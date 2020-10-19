import { Address } from '@graphprotocol/graph-ts'
import { metrics, token } from '@mstable/subgraph-utils'

import {
  BasketManager,
  BasketManager__getBasketResultBStruct,
} from '../generated/mUSD/BasketManager'
import { Masset } from '../generated/mUSD/Masset'

import { Basket as BasketEntity, Basset as BassetEntity } from '../generated/schema'

export function updateBassetEntities(basketManager: BasketManager): Array<BassetEntity> {
  let getBassetsResult = basketManager.getBassets()

  let arr = new Array<BassetEntity>()
  let length = getBassetsResult.value1.toI32()

  for (let i = 0; i < length; i++) {
    let value0 = getBassetsResult.value0
    let basset = value0[i]

    let bassetAddress = basset.addr
    arr.push(new BassetEntity(bassetAddress.toHexString()))

    let tokenEntity = token.getOrCreate(bassetAddress)
    let decimals = tokenEntity.decimals

    arr[i].token = tokenEntity.id
    arr[i].ratio = basset.ratio
    arr[i].maxWeight = basset.maxWeight
    arr[i].vaultBalance = metrics.updateMetric(
      arr[i].vaultBalance,
      basset.vaultBalance,
      decimals,
    ).id
    arr[i].isTransferFeeCharged = basset.isTransferFeeCharged
    arr[i].status = mapBassetStatus(basset.status)

    arr[i].totalMinted = metrics.getOrCreateMetricForAddress(
      bassetAddress,
      'totalMinted',
      decimals,
    ).id
    arr[i].totalRedeemed = metrics.getOrCreateMetricForAddress(
      bassetAddress,
      'totalRedeemed',
      decimals,
    ).id
    arr[i].totalFeesPaid = metrics.getOrCreateMetricForAddress(
      bassetAddress,
      'totalFeesPaid',
      decimals,
    ).id
    arr[i].totalSwappedAsOutput = metrics.getOrCreateMetricForAddress(
      bassetAddress,
      'totalSwappedAsOutput',
      decimals,
    ).id

    arr[i].totalMints = metrics.getOrCreateCounterForAddress(bassetAddress, 'totalMints').id
    arr[i].totalRedemptions = metrics.getOrCreateCounterForAddress(
      bassetAddress,
      'totalRedemptions',
    ).id
    arr[i].totalSwapsAsInput = metrics.getOrCreateCounterForAddress(
      bassetAddress,
      'totalSwapsAsInput',
    ).id
    arr[i].totalSwapsAsOutput = metrics.getOrCreateCounterForAddress(
      bassetAddress,
      'totalSwapsAsOutput',
    ).id
    arr[i].save()
  }

  return arr
}

export function getBasketData(massetAddress: Address): BasketManager__getBasketResultBStruct {
  let masset = Masset.bind(massetAddress)
  let basketManager = BasketManager.bind(masset.getBasketManager())
  return basketManager.getBasket()
}

export function updateBasket(basketManagerAddress: Address): void {
  let basketManager = BasketManager.bind(basketManagerAddress)
  let massetAddress = basketManager.mAsset()

  let basketEntity = new BasketEntity(massetAddress.toHexString())

  let basketData = getBasketData(massetAddress)

  let bassetEntities = updateBassetEntities(basketManager)

  basketEntity.bassets = bassetEntities.map<string>((basset: BassetEntity) => basset.id)
  basketEntity.undergoingRecol = basketData.undergoingRecol
  basketEntity.failed = basketData.failed
  basketEntity.maxBassets = basketData.maxBassets
  basketEntity.collateralisationRatio = basketData.collateralisationRatio
  basketEntity.save()
}

function mapBassetStatus(status: i32): string {
  switch (status) {
    case 0:
      return 'Default'
    case 1:
      return 'Normal'
    case 2:
      return 'BrokenBelowPeg'
    case 3:
      return 'BrokenAbovePeg'
    case 4:
      return 'Blacklisted'
    case 5:
      return 'Liquidating'
    case 6:
      return 'Liquidated'
    case 7:
      return 'Failed'
    default:
      throw new Error(`Unknown basset status ${status}`)
  }
}
