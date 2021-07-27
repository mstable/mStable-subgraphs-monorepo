import { Address } from '@graphprotocol/graph-ts'
import { counters, metrics, token } from '@mstable/subgraph-utils'

import { Masset } from '../generated/Masset_mUSD/Masset'

import { Basket as BasketEntity, Basset as BassetEntity } from '../generated/schema'

function updateBassetEntities(masset: Masset): Array<BassetEntity> {
  let result = masset.getBassets()
  let bassetsPersonal = result.value0
  let bassetsData = result.value1

  let arr = new Array<BassetEntity>()
  let length = bassetsPersonal.length

  for (let i = 0; i < length; i++) {
    let bassetData = bassetsData[i]
    let bassetPersonal = bassetsPersonal[i]

    let bassetAddress = bassetPersonal.addr
    arr.push(new BassetEntity(bassetAddress.toHexString()))

    let tokenEntity = token.getOrCreate(bassetAddress)
    let decimals = tokenEntity.decimals

    arr[i].token = tokenEntity.id
    arr[i].ratio = bassetData.ratio
    arr[i].removed = false

    arr[i].vaultBalance = metrics.getOrCreateWithDecimals(
      bassetAddress,
      'vaultBalance',
      decimals,
    ).id
    metrics.updateByIdWithDecimals(arr[i].vaultBalance, bassetData.vaultBalance, decimals)

    arr[i].isTransferFeeCharged = bassetPersonal.hasTxFee
    arr[i].status = mapBassetStatus(bassetPersonal.status)

    arr[i].totalSupply = metrics.getOrCreateWithDecimals(
      bassetAddress,
      'token.totalSupply',
      decimals,
    ).id
    arr[i].cumulativeMinted = metrics.getOrCreateWithDecimals(
      bassetAddress,
      'cumulativeMinted',
      decimals,
    ).id
    arr[i].cumulativeRedeemed = metrics.getOrCreateWithDecimals(
      bassetAddress,
      'cumulativeRedeemed',
      decimals,
    ).id
    arr[i].cumulativeFeesPaid = metrics.getOrCreateWithDecimals(
      bassetAddress,
      'cumulativeFeesPaid',
      decimals,
    ).id
    arr[i].cumulativeSwappedAsOutput = metrics.getOrCreateWithDecimals(
      bassetAddress,
      'cumulativeSwappedAsOutput',
      decimals,
    ).id

    arr[i].totalMints = counters.getOrCreate(bassetAddress, 'totalMints').id
    arr[i].totalRedemptions = counters.getOrCreate(bassetAddress, 'totalRedemptions').id
    arr[i].totalSwapsAsInput = counters.getOrCreate(bassetAddress, 'totalSwapsAsInput').id
    arr[i].totalSwapsAsOutput = counters.getOrCreate(bassetAddress, 'totalSwapsAsOutput').id
    arr[i].save()
  }

  return arr
}

export function updateBasket(massetAddress: Address): void {
  let masset = Masset.bind(massetAddress)
  let basket = masset.try_getBasket()

  if (!basket.reverted) {
    updateBasketV2(massetAddress)
  }
}

function updateBasketV2(massetAddress: Address): void {
  let masset = Masset.bind(massetAddress)
  let basket = masset.getBasket()

  let basketEntity = new BasketEntity(massetAddress.toHexString())
  let bassetEntities = updateBassetEntities(masset)

  basketEntity.bassets = bassetEntities.map<string>((basset: BassetEntity) => basset.id)
  basketEntity.undergoingRecol = basket.value0
  basketEntity.failed = basket.value1

  basketEntity.save()
}

// @ts-ignore
export function mapBassetStatus(status: i32): string {
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
