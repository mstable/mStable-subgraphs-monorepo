import { Address, BigInt } from '@graphprotocol/graph-ts'
import { events, integer, metrics, transaction, decimal } from '@mstable/subgraph-utils'

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

export function handleAutomaticInterestCollectionSwitched(
  event: AutomaticInterestCollectionSwitched,
): void {
  let savingsContractEntity = new SavingsContractEntity(event.address.toHexString())
  savingsContractEntity.automationEnabled = event.params.automationEnabled
  savingsContractEntity.save()
}

// Calculation: (1 + 0.001) ^ 365 - 1
function calculateAPY(start: ExchangeRateEntity, end: ExchangeRateEntity): BigInt {
  let secondsInYear = integer.fromNumber(365 * 24 * 60 * 60)
  let timeDiff = BigInt.fromI32(end.timestamp - start.timestamp)
  let rateDiff = end.rate.div(start.rate)

  let portionOfYear = timeDiff.times(integer.SCALE).div(secondsInYear)
  if (portionOfYear.equals(integer.ZERO)) {
    return integer.ZERO
  }

  let portionsInYear = integer.SCALE.div(portionOfYear)

  // Use primitives because BigInt will overflow
  let portionsInYearI32: i32 = portionsInYear.toI32()
  let rateF64: f64 = parseFloat(rateDiff.toString())
  let apyF64: f64 = rateF64 ** portionsInYearI32
  let apyPercentage: f64 = apyF64 - 1

  return decimal.fromNumber(apyPercentage).digits.times(integer.fromNumber(100))
}

export function handleExchangeRateUpdated(event: ExchangeRateUpdated): void {
  let id = events.getId(event)

  let savingsContractEntity = SavingsContractEntity.load(
    event.address.toHexString(),
  ) as SavingsContractEntity

  // Get the latest exchange rate
  let latestExchangeRateEntity: ExchangeRateEntity | null = savingsContractEntity.latestExchangeRate
    ? ExchangeRateEntity.load(savingsContractEntity.latestExchangeRate)
    : null

  // Get the previous day exchange rate
  let previousExchangeRateEntity: ExchangeRateEntity | null = savingsContractEntity.previousExchangeRate
    ? ExchangeRateEntity.load(savingsContractEntity.previousExchangeRate)
    : null

  // Create a new exchange rate
  let exchangeRateEntity = new ExchangeRateEntity(id)
  exchangeRateEntity.rate = decimal.convert(event.params.newExchangeRate)
  exchangeRateEntity.savingsContract = event.address.toHexString()
  exchangeRateEntity.timestamp = event.block.timestamp.toI32()
  exchangeRateEntity.save()

  if (previousExchangeRateEntity == null) {
    // Set the first value (should only happen once)
    savingsContractEntity.previousExchangeRate = exchangeRateEntity.id
  }

  if (
    latestExchangeRateEntity != null &&
    previousExchangeRateEntity != null &&
    latestExchangeRateEntity.id != previousExchangeRateEntity.id
  ) {
    // Update the previousExchangeRate if it's more than 24h ago
    let latestTs = integer.fromNumber(exchangeRateEntity.timestamp)
    let previousTs = integer.fromNumber(latestExchangeRateEntity.timestamp)

    // FIXME should use day boundary
    let secondsInDay = integer.fromNumber(86400)
    if (latestTs.minus(previousTs).gt(secondsInDay)) {
      savingsContractEntity.previousExchangeRate = exchangeRateEntity.id
    }
  }

  // The latest exchange rate is now the one we just created
  savingsContractEntity.latestExchangeRate = exchangeRateEntity.id
  savingsContractEntity.save()

  if (latestExchangeRateEntity) {
    let dailyAPY = calculateAPY(latestExchangeRateEntity as ExchangeRateEntity, exchangeRateEntity)
    metrics.updateMetric(savingsContractEntity.dailyAPY, dailyAPY)
  }

  metrics.incrementMetric(savingsContractEntity.totalSavings, event.params.interestCollected)
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

  let massetTotalSupply = metrics.getOrCreateMetricForAddress(
    Address.fromString(savingsContractEntity.masset),
    'totalSupply',
  )

  let contract = SavingsContract.bind(event.address)
  let totalSavings = contract.totalSavings()

  metrics.incrementCounter(savingsContractEntity.totalDeposits)

  metrics.incrementMetric(savingsContractEntity.totalCredits, event.params.creditsIssued)
  metrics.incrementMetric(savingsContractEntity.totalDeposited, event.params.savingsDeposited)

  metrics.updateMetric(savingsContractEntity.totalSavings, totalSavings)
  metrics.updateMetric(
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

  let massetTotalSupply = metrics.getOrCreateMetricForAddress(
    Address.fromString(savingsContractEntity.masset),
    'totalSupply',
  )

  let contract = SavingsContract.bind(event.address)
  let totalSavings = contract.totalSavings()

  metrics.incrementCounter(savingsContractEntity.totalWithdrawals)

  metrics.updateMetric(savingsContractEntity.totalSavings, totalSavings)
  metrics.updateMetric(
    savingsContractEntity.utilisationRate,
    totalSavings
      .times(integer.SCALE)
      .div(massetTotalSupply.exact)
      .times(integer.fromNumber(100)),
  )

  metrics.decrementMetric(savingsContractEntity.totalCredits, event.params.creditsRedeemed)
  metrics.decrementMetric(savingsContractEntity.totalDeposited, event.params.savingsCredited)

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
