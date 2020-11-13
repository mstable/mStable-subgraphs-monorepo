import { Address } from '@graphprotocol/graph-ts'
import { integer, counters, metrics } from '@mstable/subgraph-utils'

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

  massetEntity.totalMinted = metrics.getOrCreate(address, 'totalMinted').id
  massetEntity.totalRedeemed = metrics.getOrCreate(address, 'totalRedeemed').id
  massetEntity.totalRedeemedMasset = metrics.getOrCreate(address, 'totalRedeemedMasset').id
  massetEntity.totalSwapped = metrics.getOrCreate(address, 'totalSwapped').id
  massetEntity.totalFeesPaid = metrics.getOrCreate(address, 'totalFeesPaid').id

  massetEntity.totalMints = counters.getOrCreate(address, 'totalMints').id
  massetEntity.totalRedemptions = counters.getOrCreate(address, 'totalRedemptions').id
  massetEntity.totalRedeemMassets = counters.getOrCreate(address, 'totalRedeemMassets').id
  massetEntity.totalSwaps = counters.getOrCreate(address, 'totalSwaps').id

  massetEntity.token = id
  massetEntity.basket = id

  massetEntity.save()

  return massetEntity as MassetEntity
}
