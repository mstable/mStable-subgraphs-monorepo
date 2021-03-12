import { Address } from '@graphprotocol/graph-ts'
import { transaction, counters, metrics, integer, token } from '@mstable/subgraph-utils'
import { Transfer as ERC20Transfer } from '@mstable/subgraph-utils/generated/Empty/ERC20Detailed'

import {
  AmpData as AmpDataEntity,
  Basset as BassetEntity,
  FeederPool as FeederPoolEntity,
  FPMintMultiTransaction as FPMintMultiTransactionEntity,
  FPMintSingleTransaction as FPMintSingleTransactionEntity,
  FPRedeemTransaction as FPRedeemTransactionEntity,
  FPSwapTransaction as FPSwapTransactionEntity,
} from '../../generated/schema'

import { getFPBassetId, getOrCreateFeederPool, updateFeederPoolBassets } from '../FeederPool'
import {
  FeederPoolExtended,
  CacheSizeChanged,
  FeesChanged,
  Minted,
  MintedMulti,
  Redeemed,
  RedeemedMulti,
  Swapped,
  Transfer,
  WeightLimitsChanged,
  FeederManager_BassetsMigrated,
  FeederManager_StartRampA,
  FeederManager_StopRampA,
} from '../../generated/templates/FeederPool/FeederPoolExtended'

export function handleTransfer(event: Transfer): void {
  token.handleTransfer(event as ERC20Transfer)
}

export function handleMinted(event: Minted): void {
  let feederPool = event.address

  getOrCreateFeederPool(feederPool)
  updateFeederPoolBassets(feederPool)
  updatePrice(event.address)

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
  updatePrice(feederPool)

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
  updatePrice(event.address)

  let inputBasset = BassetEntity.load(getFPBassetId(feederPool, event.params.input)) as BassetEntity
  let outputBasset = BassetEntity.load(
    getFPBassetId(feederPool, event.params.output),
  ) as BassetEntity

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
  updatePrice(event.address)

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
  updatePrice(event.address)

  let massetUnits = event.params.mAssetQuantity
  let scaledFee = event.params.scaledFee

  let basset = event.params.output
  let bassetUnits = event.params.outputQuantity
  let bassetEntity = BassetEntity.load(getFPBassetId(feederPool, basset)) as BassetEntity
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
export function handleStartRampA(event: FeederManager_StartRampA): void {
  getOrCreateFeederPool(event.address)
  updatePrice(event.address)

  let ampDataEntity = new AmpDataEntity(event.address.toHexString())
  ampDataEntity.currentA = event.params.currentA
  ampDataEntity.startTime = event.params.startTime
  ampDataEntity.targetA = event.params.targetA
  ampDataEntity.rampEndTime = event.params.rampEndTime
  ampDataEntity.save()
}

export function handleStopRampA(event: FeederManager_StopRampA): void {
  getOrCreateFeederPool(event.address)
  updatePrice(event.address)

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
  fpEntity.save()
}

export function handleWeightLimitsChanged(event: WeightLimitsChanged): void {
  let fpEntity = getOrCreateFeederPool(event.address)
  fpEntity.hardMin = event.params.min
  fpEntity.hardMax = event.params.max
  fpEntity.save()
}

export function handleBassetsMigrated(event: FeederManager_BassetsMigrated): void {}

function updatePrice(address: Address): void {
  let feederPool = FeederPoolExtended.bind(address)
  let fpEntity = new FeederPoolEntity(address.toHexString())
  let price = feederPool.getPrice()
  fpEntity.price = price.value0
  fpEntity.invariantK = price.value1
  fpEntity.save()
}
