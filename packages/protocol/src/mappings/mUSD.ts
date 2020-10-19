import { Address } from '@graphprotocol/graph-ts'
import { transaction, metrics, integer, token } from '@mstable/subgraph-utils'
import { Transfer as ERC20Transfer } from '@mstable/subgraph-utils/generated/Empty/ERC20Detailed'

import {
  Minted,
  MintedMulti,
  PaidFee,
  Redeemed,
  RedeemedMasset,
  RedemptionFeeChanged,
  SwapFeeChanged,
  Swapped,
  Transfer,
} from '../../generated/mUSD/Masset'
import { BasketManager } from '../../generated/mUSD/BasketManager'

import {
  Basset as BassetEntity,
  Masset as MassetEntity,
  MintMultiTransaction as MintMultiTransactionEntity,
  MintSingleTransaction as MintSingleTransactionEntity,
  PaidFeeTransaction as PaidFeeTransactionEntity,
  RedeemMassetTransaction as RedeemMassetTransactionEntity,
  RedeemTransaction as RedeemTransactionEntity,
  SwapTransaction as SwapTransactionEntity,
} from '../../generated/schema'

import { getOrCreateMasset } from '../Masset'
import { updateBassetEntities } from '../Basket'

export function handleTransfer(event: Transfer): void {
  token.handleTransfer(event as ERC20Transfer)
}

function updateVaultBalances(massetAddress: Address): Array<BassetEntity> {
  let massetEntity = getOrCreateMasset(massetAddress)

  let basketManager = BasketManager.bind(massetEntity.basketManager as Address)
  return updateBassetEntities(basketManager)
}

export function handleMinted(event: Minted): void {
  let masset = event.address

  updateVaultBalances(masset)

  let massetUnits = event.params.mAssetQuantity
  let bassetUnits = event.params.bAssetQuantity
  let basset = event.params.bAsset

  metrics.incrementCounterForAddress(masset, 'totalMints')
  metrics.incrementCounterForAddress(basset, 'totalMints')
  metrics.incrementMetricForAddress(masset, 'totalMinted', massetUnits)
  metrics.incrementMetricForAddress(basset, 'totalMinted', bassetUnits)

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

  updateVaultBalances(masset)

  let massetUnits = event.params.mAssetQuantity
  let bassetsUnits = event.params.bAssetQuantities
  let bassets = event.params.bAssets

  for (let i = 0; i < bassets.length; i++) {
    let basset = bassets[i]
    let bassetUnits = bassetsUnits[i]
    metrics.incrementCounterForAddress(basset, 'totalMints')
    metrics.incrementMetricForAddress(basset, 'totalMinted', bassetUnits)
  }

  metrics.incrementCounterForAddress(masset, 'totalMints')
  metrics.incrementMetricForAddress(masset, 'totalMinted', massetUnits)

  let baseTx = transaction.fromEvent(event)
  let txEntity = new MintMultiTransactionEntity(baseTx.id)
  txEntity.timestamp = baseTx.timestamp
  txEntity.block = baseTx.block
  txEntity.hash = baseTx.hash

  txEntity.recipient = event.params.recipient
  txEntity.sender = event.params.minter
  txEntity.masset = masset.toHexString()
  txEntity.massetUnits = massetUnits
  txEntity.bassets = event.params.bAssets.map<string>(b => b.toHexString())
  txEntity.bassetsUnits = bassetsUnits

  txEntity.save()
}

export function handleSwapped(event: Swapped): void {
  let masset = event.address

  let inputBasset = BassetEntity.load(event.params.input.toHexString()) as BassetEntity
  let outputBasset = BassetEntity.load(event.params.output.toHexString()) as BassetEntity

  updateVaultBalances(masset)

  let outputAmountInBassetUnits = event.params.outputAmount
  let massetUnits = integer.toRatio(outputAmountInBassetUnits, outputBasset.ratio)

  metrics.incrementCounterForAddress(masset, 'totalSwaps')
  metrics.incrementMetricForAddress(masset, 'totalSwapped', massetUnits)

  metrics.incrementCounter(inputBasset.totalSwapsAsInput)
  metrics.incrementCounter(outputBasset.totalSwapsAsOutput)
  metrics.incrementMetric(outputBasset.totalSwappedAsOutput, outputAmountInBassetUnits)

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

export function handleRedeemed(event: Redeemed): void {
  updateVaultBalances(event.address)

  let masset = event.address
  let massetUnits = event.params.mAssetQuantity
  let bassets = event.params.bAssets
  let bassetsUnits = event.params.bAssetQuantities

  for (let i = 0; i < bassets.length; i++) {
    let basset = bassets[i]
    let bassetUnits = bassetsUnits[i]
    metrics.incrementCounterForAddress(basset, 'totalRedemptions')
    metrics.incrementMetricForAddress(basset, 'totalRedeemed', bassetUnits)
  }

  metrics.incrementCounterForAddress(masset, 'totalRedemptions')
  metrics.incrementMetricForAddress(masset, 'totalRedeemed', massetUnits)

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

export function handleRedeemedMasset(event: RedeemedMasset): void {
  let bassets = updateVaultBalances(event.address)

  let masset = event.address
  let massetUnits = event.params.mAssetQuantity

  metrics.incrementCounterForAddress(masset, 'totalRedeemMassets')
  metrics.incrementMetricForAddress(masset, 'totalRedeemedMasset', massetUnits)

  let baseTx = transaction.fromEvent(event)
  let txEntity = new RedeemMassetTransactionEntity(baseTx.id)
  txEntity.timestamp = baseTx.timestamp
  txEntity.block = baseTx.block
  txEntity.hash = baseTx.hash

  txEntity.recipient = event.params.recipient
  txEntity.sender = event.params.redeemer
  txEntity.masset = masset.toHexString()
  txEntity.massetUnits = massetUnits

  txEntity.save()
}

export function handlePaidFee(event: PaidFee): void {
  let masset = event.address

  let basset = event.params.asset.toHexString()
  let bassetUnits = event.params.feeQuantity
  let bassetEntity = BassetEntity.load(basset)

  let massetUnits = integer.toRatio(bassetUnits, bassetEntity.ratio)

  metrics.incrementMetricForAddress(masset, 'totalFeesPaid', massetUnits)
  metrics.incrementMetric(bassetEntity.totalFeesPaid, bassetUnits)

  let baseTx = transaction.fromEvent(event)
  let txEntity = new PaidFeeTransactionEntity(baseTx.id)
  txEntity.timestamp = baseTx.timestamp
  txEntity.block = baseTx.block
  txEntity.hash = baseTx.hash

  txEntity.sender = event.params.payer
  txEntity.masset = masset.toHexString()
  txEntity.massetUnits = massetUnits
  txEntity.basset = basset
  txEntity.bassetUnits = bassetUnits

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
