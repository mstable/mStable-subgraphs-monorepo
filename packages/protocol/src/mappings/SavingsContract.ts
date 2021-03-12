import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts'
import { counters, events, integer, metrics, transaction, decimal } from '@mstable/subgraph-utils'

import {
  SavingsContractV1,
  AutomaticInterestCollectionSwitched,
  CreditsRedeemed,
  ExchangeRateUpdated,
  SavingsDeposited,
} from '../../generated/SavingsManager/SavingsContractV1'
import { SavingsContractV2 } from '../../generated/SavingsManager/SavingsContractV2'

import {
  Account as AccountEntity,
  ExchangeRate as ExchangeRateEntity,
  SavingsContract as SavingsContractEntity,
  SavingsContractDepositTransaction as SavingsContractDepositTransactionEntity,
  SavingsContractWithdrawTransaction as SavingsContractWithdrawTransactionEntity,
} from '../../generated/schema'

import { getOrCreateCreditBalance } from '../CreditBalance'
import { getOrCreateSavingsContract } from '../SavingsContract'

const SECONDS_IN_DAY = 86400
const SECONDS_IN_YEAR = 86400 * 365

export function handleAutomaticInterestCollectionSwitched(
  event: AutomaticInterestCollectionSwitched,
): void {
  let savingsContractEntity = new SavingsContractEntity(event.address.toHexString())
  savingsContractEntity.automationEnabled = event.params.automationEnabled
  savingsContractEntity.save()
}

// Calculation:  (1 + 0.001) ^ 365 - 1
function calculateAPY(start: ExchangeRateEntity, end: ExchangeRateEntity): BigDecimal {
  let timeDiff = integer.fromNumber(end.timestamp - start.timestamp)
  let rateDiff = end.rate.div(start.rate)

  let portionOfYear = timeDiff.times(integer.SCALE).div(integer.fromNumber(SECONDS_IN_YEAR))
  if (portionOfYear.equals(integer.ZERO)) {
    return decimal.ZERO
  }

  let portionsInYear = integer.SCALE.div(portionOfYear)

  // Use primitives because BigInt will overflow
  let portionsInYearI32 = portionsInYear.toI32()
  let rateF64 = parseFloat(rateDiff.toString())
  let apyF64 = rateF64 ** portionsInYearI32
  let apyPercentage = apyF64 - 1

  return decimal.fromNumber(apyPercentage).times(decimal.fromNumber(100))
}

export function handleExchangeRateUpdated(event: ExchangeRateUpdated): void {
  let id = events.getId(event)

  let savingsContractEntity = getOrCreateSavingsContract(event.address, null)

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

    savingsContractEntity.dailyAPY = calculateAPY(
      exchangeRate24hAgo as ExchangeRateEntity,
      exchangeRateLatest,
    )

    savingsContractEntity.save()
  }
}

/**
 * @deprecated
 */
function handleSaveV1Deposit(event: SavingsDeposited): void {
  let creditBalanceEntity = getOrCreateCreditBalance(event.params.saver, event.address)
  creditBalanceEntity.amount = creditBalanceEntity.amount.plus(event.params.creditsIssued)
  creditBalanceEntity.save()

  let accountEntity = new AccountEntity(event.params.saver.toHexString())
  accountEntity.creditBalance = creditBalanceEntity.id
  accountEntity.save()
}

export function handleSavingsDeposited(event: SavingsDeposited): void {
  let savingsContractEntity = getOrCreateSavingsContract(event.address, null)

  if (savingsContractEntity.version == 1) {
    handleSaveV1Deposit(event)
  }

  let massetTotalSupply = metrics.getOrCreate(
    Address.fromString(savingsContractEntity.masset),
    'token.totalSupply',
  )

  counters.incrementById(savingsContractEntity.totalDeposits)

  metrics.incrementById(savingsContractEntity.totalCredits, event.params.creditsIssued)
  metrics.incrementById(savingsContractEntity.cumulativeDeposited, event.params.savingsDeposited)

  updateTotalSavings(savingsContractEntity, massetTotalSupply.exact)

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

/**
 * @deprecated
 */
function handleSaveV1Redemption(event: CreditsRedeemed): void {
  let creditBalanceEntity = getOrCreateCreditBalance(event.params.redeemer, event.address)
  creditBalanceEntity.amount = creditBalanceEntity.amount.minus(event.params.creditsRedeemed)
  creditBalanceEntity.save()

  let accountEntity = new AccountEntity(event.params.redeemer.toHexString())
  accountEntity.creditBalance = creditBalanceEntity.id
  accountEntity.save()
}

export function handleCreditsRedeemed(event: CreditsRedeemed): void {
  let savingsContractEntity = getOrCreateSavingsContract(event.address, null)

  if (savingsContractEntity.version == 1) {
    handleSaveV1Redemption(event)
  }

  let massetTotalSupply = metrics.getOrCreate(
    Address.fromString(savingsContractEntity.masset),
    'token.totalSupply',
  )

  counters.incrementById(savingsContractEntity.totalWithdrawals)

  updateTotalSavings(savingsContractEntity, massetTotalSupply.exact)

  metrics.incrementById(savingsContractEntity.cumulativeWithdrawn, event.params.creditsRedeemed)
  metrics.decrementById(savingsContractEntity.totalCredits, event.params.creditsRedeemed)

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

function updateTotalSavings(
  savingsContractEntity: SavingsContractEntity,
  massetTotalSupply: BigInt,
): void {
  let totalSavings: BigInt

  let addr = Address.fromString(savingsContractEntity.id)

  let v1Contract = SavingsContractV1.bind(addr)
  let totalSavingsV1 = v1Contract.try_totalSavings()

  if (!totalSavingsV1.reverted) {
    totalSavings = totalSavingsV1.value
  } else {
    let v2Contract = SavingsContractV2.bind(addr)
    let totalSavingsV2 = v2Contract.try_totalSupply()

    if (!totalSavingsV2.reverted) {
      totalSavings = totalSavingsV2.value
    }
  }

  if (totalSavings != null) {
    metrics.updateById(savingsContractEntity.totalSavings, totalSavings)
    metrics.updateById(
      savingsContractEntity.utilisationRate,
      totalSavings
        .times(integer.SCALE)
        .div(massetTotalSupply)
        .times(integer.fromNumber(100)),
    )
  }
}
