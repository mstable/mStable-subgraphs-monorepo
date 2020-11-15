import { Address, BigInt } from '@graphprotocol/graph-ts'
import { counters, events, integer, metrics, transaction, decimal } from '@mstable/subgraph-utils'

import {
  AutomaticInterestCollectionSwitched,
  CreditsRedeemed,
  ExchangeRateUpdated,
  SavingsContract,
  SavingsDeposited,
} from '../../generated/templates/SavingsContract/SavingsContract'

import {
  Account as AccountEntity,
  ExchangeRate as ExchangeRateEntity,
  SavingsContract as SavingsContractEntity,
  SavingsContractDepositTransaction as SavingsContractDepositTransactionEntity,
  SavingsContractWithdrawTransaction as SavingsContractWithdrawTransactionEntity,
} from '../../generated/schema'

import { getOrCreateCreditBalance } from '../CreditBalance'

const SECONDS_IN_DAY = 86400
const SECONDS_IN_YEAR = 86400 * 365

export function handleAutomaticInterestCollectionSwitched(
  event: AutomaticInterestCollectionSwitched,
): void {
  let savingsContractEntity = new SavingsContractEntity(event.address.toHexString())
  savingsContractEntity.automationEnabled = event.params.automationEnabled
  savingsContractEntity.save()
}

// Calculation: (1 + 0.001) ^ 365 - 1
function calculateAPY(start: ExchangeRateEntity, end: ExchangeRateEntity): BigInt {
  let timeDiff = integer.fromNumber(end.timestamp - start.timestamp)
  let rateDiff = end.rate.div(start.rate)

  let portionOfYear = timeDiff.times(integer.SCALE).div(integer.fromNumber(SECONDS_IN_YEAR))
  if (portionOfYear.equals(integer.ZERO)) {
    return integer.ZERO
  }

  let portionsInYear = integer.SCALE.div(portionOfYear)

  // Use primitives because BigInt will overflow
  let portionsInYearI32: i32 = portionsInYear.toI32()
  let rateF64: f64 = parseFloat(rateDiff.toString())
  let apyF64: f64 = rateF64 ** portionsInYearI32
  let apyPercentage: f64 = apyF64 - 1

  return decimal.fromNumber(apyPercentage).digits.times(integer.fromNumber(1000))
}

export function handleExchangeRateUpdated(event: ExchangeRateUpdated): void {
  let id = events.getId(event)

  let savingsContractEntity = SavingsContractEntity.load(
    event.address.toHexString(),
  ) as SavingsContractEntity

  metrics.incrementById(savingsContractEntity.totalSavings, event.params.interestCollected)

  // Get the current latest exchange rate before adding this one (i.e. previous)
  let exchangeRatePrevious: ExchangeRateEntity | null = savingsContractEntity.latestExchangeRate
    ? ExchangeRateEntity.load(savingsContractEntity.latestExchangeRate)
    : null

  // Get the previous day exchange rate
  let exchangeRate24hAgo: ExchangeRateEntity | null = savingsContractEntity.exchangeRate24hAgo
    ? ExchangeRateEntity.load(savingsContractEntity.exchangeRate24hAgo)
    : null

  // Create a new exchange rate
  let exchangeRateLatest = new ExchangeRateEntity(id)
  exchangeRateLatest.rate = decimal.convert(event.params.newExchangeRate)
  exchangeRateLatest.savingsContract = event.address.toHexString()
  exchangeRateLatest.timestamp = event.block.timestamp.toI32()
  exchangeRateLatest.save()

  // The latest exchange rate is now the one we just created
  savingsContractEntity.latestExchangeRate = exchangeRateLatest.id
  savingsContractEntity.save()

  // The next exchange rate of the previous exchange rate is this latest one
  if (exchangeRatePrevious != null) {
    exchangeRatePrevious.next = exchangeRateLatest.id
    exchangeRatePrevious.save()
  }

  if (exchangeRate24hAgo == null) {
    // Set the first 24h ago value (should only happen once)
    savingsContractEntity.exchangeRate24hAgo = exchangeRateLatest.id
    savingsContractEntity.save()
  } else if (exchangeRateLatest.timestamp - exchangeRate24hAgo.timestamp > SECONDS_IN_DAY) {
    // The '24hAgo' rate should be _at least_ 24h ago; iterate through the 'next' rates
    // in order to push this rate forward.
    while (exchangeRate24hAgo.next != null) {
      let exchangeRateNext = ExchangeRateEntity.load(exchangeRate24hAgo.next) as ExchangeRateEntity
      if (exchangeRateLatest.timestamp - exchangeRateNext.timestamp > SECONDS_IN_DAY) {
        exchangeRate24hAgo = exchangeRateNext
      } else {
        break
      }
    }

    savingsContractEntity.exchangeRate24hAgo = exchangeRate24hAgo.id
    savingsContractEntity.save()

    let dailyAPY = calculateAPY(exchangeRate24hAgo as ExchangeRateEntity, exchangeRateLatest)
    metrics.updateById(savingsContractEntity.dailyAPY, dailyAPY)
  }
}

export function handleSavingsDeposited(event: SavingsDeposited): void {
  let creditBalanceEntity = getOrCreateCreditBalance(event.params.saver, event.address)
  creditBalanceEntity.amount = creditBalanceEntity.amount.plus(event.params.creditsIssued)
  creditBalanceEntity.save()

  let accountEntity = new AccountEntity(event.params.saver.toHexString())
  accountEntity.creditBalance = creditBalanceEntity.id
  accountEntity.save()

  let savingsContractEntity = SavingsContractEntity.load(
    event.address.toHexString(),
  ) as SavingsContractEntity

  let massetTotalSupply = metrics.getOrCreate(
    Address.fromString(savingsContractEntity.masset),
    'totalSupply',
  )

  let contract = SavingsContract.bind(event.address)
  let totalSavings = contract.totalSavings()

  counters.incrementById(savingsContractEntity.totalDeposits)

  metrics.incrementById(savingsContractEntity.totalCredits, event.params.creditsIssued)
  metrics.incrementById(savingsContractEntity.totalDeposited, event.params.savingsDeposited)

  metrics.updateById(savingsContractEntity.totalSavings, totalSavings)
  metrics.updateById(
    savingsContractEntity.utilisationRate,
    totalSavings
      .times(integer.SCALE)
      .div(massetTotalSupply.exact)
      .times(integer.fromNumber(100)),
  )

  let baseTx = transaction.fromEvent(event)
  let txEntity = new SavingsContractDepositTransactionEntity(baseTx.id)
  txEntity.timestamp = baseTx.timestamp
  txEntity.block = baseTx.block
  txEntity.hash = baseTx.hash

  txEntity.savingsContract = event.address.toHexString()
  txEntity.amount = event.params.savingsDeposited
  txEntity.sender = event.params.saver

  txEntity.save()
}

export function handleCreditsRedeemed(event: CreditsRedeemed): void {
  let creditBalanceEntity = getOrCreateCreditBalance(event.params.redeemer, event.address)
  creditBalanceEntity.amount = creditBalanceEntity.amount.minus(event.params.creditsRedeemed)
  creditBalanceEntity.save()

  let accountEntity = new AccountEntity(event.params.redeemer.toHexString())
  accountEntity.creditBalance = creditBalanceEntity.id
  accountEntity.save()

  let savingsContractEntity = SavingsContractEntity.load(
    event.address.toHexString(),
  ) as SavingsContractEntity

  let massetTotalSupply = metrics.getOrCreate(
    Address.fromString(savingsContractEntity.masset),
    'totalSupply',
  )

  let contract = SavingsContract.bind(event.address)
  let totalSavings = contract.totalSavings()

  counters.incrementById(savingsContractEntity.totalWithdrawals)

  metrics.updateById(savingsContractEntity.totalSavings, totalSavings)
  metrics.updateById(
    savingsContractEntity.utilisationRate,
    totalSavings
      .times(integer.SCALE)
      .div(massetTotalSupply.exact)
      .times(integer.fromNumber(100)),
  )

  metrics.decrementById(savingsContractEntity.totalCredits, event.params.creditsRedeemed)
  metrics.decrementById(savingsContractEntity.totalDeposited, event.params.savingsCredited)

  let baseTx = transaction.fromEvent(event)
  let txEntity = new SavingsContractWithdrawTransactionEntity(baseTx.id)
  txEntity.timestamp = baseTx.timestamp
  txEntity.block = baseTx.block
  txEntity.hash = baseTx.hash

  txEntity.savingsContract = event.address.toHexString()
  txEntity.amount = event.params.creditsRedeemed
  txEntity.sender = event.params.redeemer

  txEntity.save()
}
