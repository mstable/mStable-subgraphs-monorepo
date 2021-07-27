import { BigDecimal, ethereum, log } from '@graphprotocol/graph-ts'
import {
  transaction,
  counters,
  metrics,
  integer,
  token,
  address,
  decimal,
  events,
} from '@mstable/subgraph-utils'
import { Transfer as ERC20Transfer } from '@mstable/subgraph-utils/generated/Empty/ERC20'

import {
  AmpData as AmpDataEntity,
  Basset as BassetEntity,
  FeederPoolPrice as FeederPoolPriceEntity,
  FPMintMultiTransaction as FPMintMultiTransactionEntity,
  FPMintSingleTransaction as FPMintSingleTransactionEntity,
  FPRedeemTransaction as FPRedeemTransactionEntity,
  FPSwapTransaction as FPSwapTransactionEntity,
} from '../../generated/schema'

import { getFPBassetId, getOrCreateFeederPool, updateFeederPoolBassets } from '../FeederPool'
import {
  FeederPool,
  CacheSizeChanged,
  FeesChanged,
  Minted,
  MintedMulti,
  Redeemed,
  RedeemedMulti,
  Swapped,
  WeightLimitsChanged,
  BassetsMigrated,
  StartRampA,
  StopRampA,
} from '../../generated/templates/FeederPool/FeederPool'
import { Transfer } from '../../generated/templates/FeederPool/ERC20'
import { FeederPoolAccount } from '../FeederPoolAccount'

const SECONDS_IN_DAY = 86400
const SECONDS_IN_YEAR = 86400 * 365

// Calculation: (1 + 0.001) ^ 365 - 1
function calculateAPY(start: FeederPoolPriceEntity, end: FeederPoolPriceEntity): BigDecimal {
  log.debug('calculateAPY start {} end {}', [start.id.toString(), end.id.toString()])
  let timeDiff = integer.fromNumber(end.timestamp - start.timestamp)
  let rateDiff = end.price.div(start.price)

  log.debug('calculateAPY timeDiff {} rateDiff {}', [timeDiff.toString(), rateDiff.toString()])
  let portionOfYear = timeDiff.times(integer.SCALE).div(integer.fromNumber(SECONDS_IN_YEAR))

  log.debug('calculateAPY portionOfYear {}', [portionOfYear.toString()])
  if (portionOfYear.equals(integer.ZERO)) {
    return decimal.ZERO
  }

  let portionsInYear = integer.SCALE.div(portionOfYear)
  log.debug('calculateAPY portionsInYear {}', [portionsInYear.toString()])

  // Use primitives because BigInt will overflow
  let portionsInYearI32 = portionsInYear.toI32()
  let rateF64 = parseFloat(rateDiff.toString())
  log.debug('calculateAPY rateF64 {}', [rateF64.toString()])

  let apyF64 = rateF64 ** portionsInYearI32
  log.debug('calculateAPY apyF64 {}', [apyF64.toString()])
  let apyPercentage = apyF64 - 1
  log.debug('calculateAPY apyPercentage {}', [apyPercentage.toString()])

  let result = decimal.fromNumber(apyPercentage).times(decimal.fromNumber(100))

  log.debug('calculateAPY result {}', [result.toString()])
  return result
}

export function handleTransfer(event: Transfer): void {
  token.handleTransfer(event as ERC20Transfer)

  if (event.params.from.notEqual(address.ZERO_ADDRESS)) {
    FeederPoolAccount.update(event.address, event.params.from, event.block.timestamp)
  }
  if (event.params.to.notEqual(address.ZERO_ADDRESS)) {
    FeederPoolAccount.update(event.address, event.params.to, event.block.timestamp)
  }
}

export function handleMinted(event: Minted): void {
  let feederPool = event.address

  getOrCreateFeederPool(feederPool)
  updateFeederPoolBassets(feederPool)
  updatePrice(event)

  let output = event.params.output
  let inputQuantity = event.params.inputQuantity
  let input = event.params.input

  counters.increment(feederPool, 'totalMints')
  counters.increment(input, 'totalMints')
  metrics.increment(feederPool, 'cumulativeMinted', output)
  metrics.increment(input, 'cumulativeMinted', inputQuantity)

  let baseTx = transaction.fromEvent(event)
  let txEntity = new FPMintSingleTransactionEntity(baseTx.id)
  txEntity.timestamp = baseTx.timestamp
  txEntity.block = baseTx.block
  txEntity.hash = baseTx.hash

  txEntity.recipient = event.params.recipient
  txEntity.sender = event.params.minter
  txEntity.feederPool = feederPool.toHexString()
  txEntity.massetUnits = output
  txEntity.input = input.toHexString()
  txEntity.bassetUnits = inputQuantity

  txEntity.save()
}

export function handleMintedMulti(event: MintedMulti): void {
  let feederPool = event.address

  getOrCreateFeederPool(feederPool)
  updateFeederPoolBassets(feederPool)
  updatePrice(event)

  let fpTokenUnits = event.params.output
  let bassetsUnits = event.params.inputQuantities
  let bassets = event.params.inputs

  for (let i = 0; i < bassets.length; i++) {
    let basset = bassets[i]
    let bassetUnits = bassetsUnits[i]
    counters.increment(basset, 'totalMints')
    metrics.increment(basset, 'cumulativeMinted', bassetUnits)
  }

  counters.increment(feederPool, 'totalMints')
  metrics.increment(feederPool, 'cumulativeMinted', fpTokenUnits)

  let baseTx = transaction.fromEvent(event)
  let txEntity = new FPMintMultiTransactionEntity(baseTx.id)
  txEntity.timestamp = baseTx.timestamp
  txEntity.block = baseTx.block
  txEntity.hash = baseTx.hash

  txEntity.recipient = event.params.recipient
  txEntity.sender = event.params.minter
  txEntity.feederPool = feederPool.toHexString()
  txEntity.massetUnits = fpTokenUnits
  txEntity.inputs = event.params.inputs.map<string>(b => b.toHexString())
  txEntity.bassetsUnits = bassetsUnits

  txEntity.save()
}

export function handleSwapped(event: Swapped): void {
  let feederPool = event.address

  getOrCreateFeederPool(feederPool)
  updateFeederPoolBassets(feederPool)
  updatePrice(event)

  // Determine whether they are mpAssets or fpAssets
  let inputMPAsset = BassetEntity.load(event.params.input.toHexString())
  let outputMPAsset = BassetEntity.load(event.params.output.toHexString())
  let inputFPAsset = BassetEntity.load(getFPBassetId(feederPool, event.params.input))
  let outputFPAsset = BassetEntity.load(getFPBassetId(feederPool, event.params.output))

  let inputBasset = (inputMPAsset != null ? inputMPAsset : inputFPAsset) as BassetEntity
  let outputBasset = (outputMPAsset != null ? outputMPAsset : outputFPAsset) as BassetEntity

  let outputAmountInBassetUnits = event.params.outputAmount
  let massetUnits = integer.toRatio(outputAmountInBassetUnits, outputBasset.ratio)

  counters.increment(feederPool, 'totalSwaps')
  metrics.increment(feederPool, 'cumulativeSwapped', massetUnits)

  counters.incrementById(inputBasset.totalSwapsAsInput)
  counters.incrementById(outputBasset.totalSwapsAsOutput)
  metrics.incrementById(outputBasset.cumulativeSwappedAsOutput, outputAmountInBassetUnits)

  let baseTx = transaction.fromEvent(event)
  let txEntity = new FPSwapTransactionEntity(baseTx.id)
  txEntity.timestamp = baseTx.timestamp
  txEntity.block = baseTx.block
  txEntity.hash = baseTx.hash

  txEntity.recipient = event.params.recipient
  txEntity.sender = event.params.swapper
  txEntity.feederPool = feederPool.toHexString()
  txEntity.massetUnits = massetUnits
  txEntity.outputBasset = outputBasset.id
  txEntity.inputBasset = inputBasset.id

  txEntity.save()
}

export function handleRedeemedMulti(event: RedeemedMulti): void {
  let feederPool = event.address

  updateFeederPoolBassets(feederPool)
  updatePrice(event)

  let massetUnits = event.params.mAssetQuantity
  let bassets = event.params.outputs
  let bassetsUnits = event.params.outputQuantity
  let scaledFee = event.params.scaledFee

  for (let i = 0; i < bassets.length; i++) {
    let basset = bassets[i]
    let bassetUnits = bassetsUnits[i]
    counters.increment(basset, 'totalRedemptions')
    metrics.increment(basset, 'cumulativeRedeemed', bassetUnits)
  }

  counters.increment(feederPool, 'totalRedemptions')
  metrics.increment(feederPool, 'cumulativeRedeemed', massetUnits)
  metrics.increment(feederPool, 'cumulativeFeesPaid', scaledFee)

  let baseTx = transaction.fromEvent(event)
  let txEntity = new FPRedeemTransactionEntity(baseTx.id)
  txEntity.timestamp = baseTx.timestamp
  txEntity.block = baseTx.block
  txEntity.hash = baseTx.hash

  txEntity.recipient = event.params.recipient
  txEntity.sender = event.params.redeemer
  txEntity.feederPool = feederPool.toHexString()
  txEntity.massetUnits = massetUnits
  txEntity.bassets = bassets.map<string>(b => b.toHexString())
  txEntity.bassetsUnits = bassetsUnits

  txEntity.save()
}

export function handleRedeemed(event: Redeemed): void {
  let feederPool = event.address

  updateFeederPoolBassets(feederPool)
  updatePrice(event)

  let massetUnits = event.params.mAssetQuantity
  let scaledFee = event.params.scaledFee

  let basset = event.params.output
  let bassetUnits = event.params.outputQuantity

  let mpAsset = BassetEntity.load(basset.toHexString())
  let fpAsset = BassetEntity.load(getFPBassetId(feederPool, basset))

  let bassetEntity = (mpAsset != null ? mpAsset : fpAsset) as BassetEntity

  let rawFee = integer.fromRatio(scaledFee, bassetEntity.ratio)

  counters.incrementById(bassetEntity.totalRedemptions)
  metrics.incrementById(bassetEntity.cumulativeFeesPaid, rawFee)
  metrics.incrementById(bassetEntity.cumulativeRedeemed, bassetUnits)

  counters.increment(feederPool, 'totalRedemptions')
  metrics.increment(feederPool, 'cumulativeFeesPaid', scaledFee)
  metrics.increment(feederPool, 'cumulativeRedeemed', massetUnits)

  let baseTx = transaction.fromEvent(event)
  let txEntity = new FPRedeemTransactionEntity(baseTx.id)
  txEntity.timestamp = baseTx.timestamp
  txEntity.block = baseTx.block
  txEntity.hash = baseTx.hash

  txEntity.recipient = event.params.recipient
  txEntity.sender = event.params.redeemer
  txEntity.feederPool = feederPool.toHexString()
  txEntity.massetUnits = massetUnits
  txEntity.bassets = [basset.toHexString()]
  txEntity.bassetsUnits = [bassetUnits]

  txEntity.save()
}
export function handleStartRampA(event: StartRampA): void {
  getOrCreateFeederPool(event.address)
  updatePrice(event)

  let ampDataEntity = new AmpDataEntity(event.address.toHexString())
  ampDataEntity.currentA = event.params.currentA
  ampDataEntity.startTime = event.params.startTime
  ampDataEntity.targetA = event.params.targetA
  ampDataEntity.rampEndTime = event.params.rampEndTime
  ampDataEntity.save()
}

export function handleStopRampA(event: StopRampA): void {
  getOrCreateFeederPool(event.address)
  updatePrice(event)

  let ampDataEntity = new AmpDataEntity(event.address.toHexString())
  ampDataEntity.currentA = event.params.currentA
  ampDataEntity.startTime = event.params.time
  ampDataEntity.targetA = event.params.currentA
  ampDataEntity.rampEndTime = event.params.time
  ampDataEntity.save()
}

export function handleCacheSizeChanged(event: CacheSizeChanged): void {
  let fpEntity = getOrCreateFeederPool(event.address)
  fpEntity.cacheSize = event.params.cacheSize
  fpEntity.save()
}

export function handleFeesChanged(event: FeesChanged): void {
  let fpEntity = getOrCreateFeederPool(event.address)
  fpEntity.swapFeeRate = event.params.swapFee
  fpEntity.redemptionFeeRate = event.params.redemptionFee
  fpEntity.governanceFeeRate = event.params.govFee
  fpEntity.save()
}

export function handleWeightLimitsChanged(event: WeightLimitsChanged): void {
  let fpEntity = getOrCreateFeederPool(event.address)
  fpEntity.hardMin = event.params.min
  fpEntity.hardMax = event.params.max
  fpEntity.save()
}

export function handleBassetsMigrated(event: BassetsMigrated): void {}

function updatePrice(event: ethereum.Event): void {
  let feederPool = FeederPool.bind(event.address)
  let fpEntity = getOrCreateFeederPool(event.address)

  let price = feederPool.getPrice()
  fpEntity.price = price.value0
  fpEntity.invariantK = price.value1

  // Get the current latest price before adding this one (i.e. previous)
  let lastPricePrevious: FeederPoolPriceEntity | null = fpEntity.lastPrice
    ? FeederPoolPriceEntity.load(fpEntity.lastPrice)
    : null

  // Get the previous day price
  let price24hAgo: FeederPoolPriceEntity | null = fpEntity.price24hAgo
    ? FeederPoolPriceEntity.load(fpEntity.price24hAgo)
    : null

  // This is the only instance in which a FeederPoolPriceEntity gets created
  let lastPrice = new FeederPoolPriceEntity(events.getId(event))
  lastPrice.price = decimal.convert(fpEntity.price)
  lastPrice.feederPool = fpEntity.id
  lastPrice.timestamp = event.block.timestamp.toI32()
  lastPrice.save()

  // The last price is now the one we just created
  fpEntity.lastPrice = lastPrice.id
  fpEntity.save()

  // The next price of the previous price is this latest one
  if (lastPricePrevious != null) {
    lastPricePrevious.next = lastPrice.id
    lastPricePrevious.save()
  }

  if (price24hAgo == null) {
    // Set the first 24h ago value (should only happen once)
    fpEntity.price24hAgo = lastPrice.id
  } else if (lastPrice.timestamp - price24hAgo.timestamp > SECONDS_IN_DAY) {
    // The '24hAgo' rate should be _at least_ 24h ago; iterate through the 'next' rates
    // in order to push this rate forward.
    while (price24hAgo.next != null) {
      let priceNext = FeederPoolPriceEntity.load(price24hAgo.next) as FeederPoolPriceEntity
      if (lastPrice.timestamp - priceNext.timestamp > SECONDS_IN_DAY) {
        price24hAgo = priceNext
      } else {
        break
      }
    }

    fpEntity.price24hAgo = price24hAgo.id
  }

  if (price24hAgo != null) {
    fpEntity.dailyAPY = calculateAPY(price24hAgo as FeederPoolPriceEntity, lastPrice)
  }

  fpEntity.save()
}
