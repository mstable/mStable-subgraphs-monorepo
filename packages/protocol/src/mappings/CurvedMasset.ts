import { transaction, counters, metrics, integer, token } from '@mstable/subgraph-utils'
import { Transfer as ERC20Transfer } from '@mstable/subgraph-utils/generated/Empty/ERC20Detailed'

import {
  Minted,
  MintedMulti,
  Redeemed,
  RedeemedMulti,
  RedemptionFeeChanged,
  SwapFeeChanged,
  Swapped,
  Transfer,
} from '../../generated/mBTC/CurvedMasset'

import {
  Basset as BassetEntity,
  Masset as MassetEntity,
  MintMultiTransaction as MintMultiTransactionEntity,
  MintSingleTransaction as MintSingleTransactionEntity,
  RedeemTransaction as RedeemTransactionEntity,
  SwapTransaction as SwapTransactionEntity,
} from '../../generated/schema'

import { updateBasketCurvedMasset } from '../Basket'

export function handleTransfer(event: Transfer): void {
  token.handleTransfer(event as ERC20Transfer)
}

export function handleMinted(event: Minted): void {
  let masset = event.address

  updateBasketCurvedMasset(masset)

  let massetUnits = event.params.mAssetQuantity
  let bassetUnits = event.params.inputQuantity
  let basset = event.params.input

  counters.increment(masset, 'totalMints')
  counters.increment(basset, 'totalMints')
  metrics.increment(masset, 'cumulativeMinted', massetUnits)
  metrics.increment(basset, 'cumulativeMinted', bassetUnits)

  let baseTx = transaction.fromEvent(event)
  let txEntity = new MintSingleTransactionEntity(baseTx.id)
  txEntity.timestamp = baseTx.timestamp
  txEntity.block = baseTx.block
  txEntity.hash = baseTx.hash

  txEntity.recipient = event.params.recipient
  txEntity.sender = event.params.minter
  txEntity.masset = masset.toHexString()
  txEntity.massetUnits = massetUnits
  txEntity.basset = basset.toHexString()
  txEntity.bassetUnits = bassetUnits

  txEntity.save()
}

export function handleMintedIdx(event: Minted): void {
  let masset = event.address

  updateBasketCurvedMasset(masset)

  let massetUnits = event.params.mAssetQuantity
  let bassetUnits = event.params.inputQuantity
  let basset = event.params.input

  counters.increment(masset, 'totalMints')
  counters.increment(basset, 'totalMints')
  metrics.increment(masset, 'cumulativeMinted', massetUnits)
  metrics.increment(basset, 'cumulativeMinted', bassetUnits)

  let baseTx = transaction.fromEvent(event)
  let txEntity = new MintSingleTransactionEntity(baseTx.id)
  txEntity.timestamp = baseTx.timestamp
  txEntity.block = baseTx.block
  txEntity.hash = baseTx.hash

  txEntity.recipient = event.params.recipient
  txEntity.sender = event.params.minter
  txEntity.masset = masset.toHexString()
  txEntity.massetUnits = massetUnits
  txEntity.basset = basset.toHexString()
  txEntity.bassetUnits = bassetUnits

  txEntity.save()
}

export function handleMintedMulti(event: MintedMulti): void {
  let masset = event.address

  updateBasketCurvedMasset(masset)

  let massetUnits = event.params.mAssetQuantity
  let bassetsUnits = event.params.inputQuantities
  let bassets = event.params.inputs

  for (let i = 0; i < bassets.length; i++) {
    let basset = bassets[i]
    let bassetUnits = bassetsUnits[i]
    counters.increment(basset, 'totalMints')
    metrics.increment(basset, 'cumulativeMinted', bassetUnits)
  }

  counters.increment(masset, 'totalMints')
  metrics.increment(masset, 'cumulativeMinted', massetUnits)

  let baseTx = transaction.fromEvent(event)
  let txEntity = new MintMultiTransactionEntity(baseTx.id)
  txEntity.timestamp = baseTx.timestamp
  txEntity.block = baseTx.block
  txEntity.hash = baseTx.hash

  txEntity.recipient = event.params.recipient
  txEntity.sender = event.params.minter
  txEntity.masset = masset.toHexString()
  txEntity.massetUnits = massetUnits
  txEntity.bassets = event.params.inputs.map<string>(b => b.toHexString())
  txEntity.bassetsUnits = bassetsUnits

  txEntity.save()
}

export function handleSwapped(event: Swapped): void {
  let masset = event.address

  updateBasketCurvedMasset(masset)

  let inputBasset = BassetEntity.load(event.params.input.toHexString()) as BassetEntity
  let outputBasset = BassetEntity.load(event.params.output.toHexString()) as BassetEntity

  let outputAmountInBassetUnits = event.params.outputAmount
  let massetUnits = integer.toRatio(outputAmountInBassetUnits, outputBasset.ratio)

  counters.increment(masset, 'totalSwaps')
  metrics.increment(masset, 'cumulativeSwapped', massetUnits)

  counters.incrementById(inputBasset.totalSwapsAsInput)
  counters.incrementById(outputBasset.totalSwapsAsOutput)
  metrics.incrementById(outputBasset.cumulativeSwappedAsOutput, outputAmountInBassetUnits)

  let baseTx = transaction.fromEvent(event)
  let txEntity = new SwapTransactionEntity(baseTx.id)
  txEntity.timestamp = baseTx.timestamp
  txEntity.block = baseTx.block
  txEntity.hash = baseTx.hash

  txEntity.recipient = event.params.recipient
  txEntity.sender = event.params.swapper
  txEntity.masset = masset.toHexString()
  txEntity.massetUnits = massetUnits
  txEntity.outputBasset = outputBasset.id
  txEntity.inputBasset = inputBasset.id

  txEntity.save()
}

export function handleRedeemedMulti(event: RedeemedMulti): void {
  let masset = event.address

  updateBasketCurvedMasset(masset)

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

  counters.increment(masset, 'totalRedemptions')
  metrics.increment(masset, 'cumulativeRedeemed', massetUnits)
  metrics.increment(masset, 'cumulativeFeesPaid', scaledFee)

  let baseTx = transaction.fromEvent(event)
  let txEntity = new RedeemTransactionEntity(baseTx.id)
  txEntity.timestamp = baseTx.timestamp
  txEntity.block = baseTx.block
  txEntity.hash = baseTx.hash

  txEntity.recipient = event.params.recipient
  txEntity.sender = event.params.redeemer
  txEntity.masset = masset.toHexString()
  txEntity.massetUnits = massetUnits
  txEntity.bassets = bassets.map<string>(b => b.toHexString())
  txEntity.bassetsUnits = bassetsUnits

  txEntity.save()
}

export function handleRedeemed(event: Redeemed): void {
  let masset = event.address

  updateBasketCurvedMasset(masset)

  let massetUnits = event.params.mAssetQuantity
  let scaledFee = event.params.scaledFee

  let basset = event.params.output
  let bassetUnits = event.params.outputQuantity
  let bassetEntity = BassetEntity.load(basset.toHexString()) as BassetEntity
  let rawFee = integer.fromRatio(scaledFee, bassetEntity.ratio)

  counters.incrementById(bassetEntity.totalRedemptions)
  metrics.incrementById(bassetEntity.cumulativeFeesPaid, rawFee)
  metrics.incrementById(bassetEntity.cumulativeRedeemed, bassetUnits)

  counters.increment(masset, 'totalRedemptions')
  metrics.increment(masset, 'cumulativeFeesPaid', scaledFee)
  metrics.increment(masset, 'cumulativeRedeemed', massetUnits)

  let baseTx = transaction.fromEvent(event)
  let txEntity = new RedeemTransactionEntity(baseTx.id)
  txEntity.timestamp = baseTx.timestamp
  txEntity.block = baseTx.block
  txEntity.hash = baseTx.hash

  txEntity.recipient = event.params.recipient
  txEntity.sender = event.params.redeemer
  txEntity.masset = masset.toHexString()
  txEntity.massetUnits = massetUnits
  txEntity.bassets = [basset.toHexString()]
  txEntity.bassetsUnits = [bassetUnits]

  txEntity.save()
}

export function handleSwapFeeChanged(event: SwapFeeChanged): void {
  let masset = new MassetEntity(event.address.toHexString())
  masset.feeRate = event.params.fee
  masset.save()
}

export function handleRedemptionFeeChanged(event: RedemptionFeeChanged): void {
  let masset = new MassetEntity(event.address.toHexString())
  masset.redemptionFeeRate = event.params.fee
  masset.save()
}
