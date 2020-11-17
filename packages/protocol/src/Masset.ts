import { Address } from '@graphprotocol/graph-ts'
import { integer, counters, metrics, token } from '@mstable/subgraph-utils'

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
  massetEntity.token = token.getOrCreate(address).id

  let redemptionFee = contract.try_redemptionFee()
  massetEntity.redemptionFeeRate = redemptionFee.reverted ? integer.ZERO : redemptionFee.value

  massetEntity.totalSupply = metrics.getOrCreate(address, 'token.totalSupply').id
  massetEntity.cumulativeMinted = metrics.getOrCreate(address, 'cumulativeMinted').id
  massetEntity.cumulativeRedeemed = metrics.getOrCreate(address, 'cumulativeRedeemed').id
  massetEntity.cumulativeRedeemedMasset = metrics.getOrCreate(
    address,
    'cumulativeRedeemedMasset',
  ).id
  massetEntity.cumulativeSwapped = metrics.getOrCreate(address, 'cumulativeSwapped').id
  massetEntity.cumulativeFeesPaid = metrics.getOrCreate(address, 'cumulativeFeesPaid').id

  massetEntity.totalMints = counters.getOrCreate(address, 'totalMints').id
  massetEntity.totalRedemptions = counters.getOrCreate(address, 'totalRedemptions').id
  massetEntity.totalRedeemMassets = counters.getOrCreate(address, 'totalRedeemMassets').id
  massetEntity.totalSwaps = counters.getOrCreate(address, 'totalSwaps').id

  token.getOrCreate(address)
  massetEntity.token = id
  massetEntity.basket = id

  massetEntity.save()

  return massetEntity as MassetEntity
}
