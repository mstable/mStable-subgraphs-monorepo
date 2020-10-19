import { Address } from '@graphprotocol/graph-ts'
import { integer, metrics } from '@mstable/subgraph-utils'

import { Masset } from '../generated/BasketManager/Masset'
import { Masset as MassetEntity } from '../generated/schema'

export function getOrCreateMasset(address: Address): MassetEntity {
  let id = address.toHexString()

  let massetEntity = MassetEntity.load(id)

  if (massetEntity != null) {
    return massetEntity as MassetEntity
  }

  massetEntity = new MassetEntity(id)

  let contract = Masset.bind(address)

  massetEntity.feeRate = contract.swapFee()
  massetEntity.basketManager = contract.getBasketManager()
  massetEntity.basket = id

  let redemptionFee = contract.try_redemptionFee()
  massetEntity.redemptionFeeRate = redemptionFee.reverted ? integer.ZERO : redemptionFee.value

  massetEntity.totalMinted = metrics.getOrCreateMetricForAddress(address, 'totalMinted').id
  massetEntity.totalRedeemed = metrics.getOrCreateMetricForAddress(address, 'totalRedeemed').id
  massetEntity.totalRedeemedMasset = metrics.getOrCreateMetricForAddress(
    address,
    'totalRedeemedMasset',
  ).id
  massetEntity.totalSwapped = metrics.getOrCreateMetricForAddress(address, 'totalSwapped').id
  massetEntity.totalFeesPaid = metrics.getOrCreateMetricForAddress(address, 'totalFeesPaid').id

  massetEntity.totalMints = metrics.getOrCreateCounterForAddress(address, 'totalMints').id
  massetEntity.totalRedemptions = metrics.getOrCreateCounterForAddress(
    address,
    'totalRedemptions',
  ).id
  massetEntity.totalRedeemMassets = metrics.getOrCreateCounterForAddress(
    address,
    'totalRedeemMassets',
  ).id
  massetEntity.totalSwaps = metrics.getOrCreateCounterForAddress(address, 'totalSwaps').id

  massetEntity.token = id
  massetEntity.basket = id

  massetEntity.save()

  return massetEntity as MassetEntity
}
