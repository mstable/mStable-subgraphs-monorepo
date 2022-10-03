import { Address } from '@graphprotocol/graph-ts'
import { integer, counters, metrics, token } from '@mstable/subgraph-utils'

import { Masset } from '../generated/Masset_mUSD/Masset'

import { AmpData as AmpDataEntity, Masset as MassetEntity } from '../generated/schema'
import { updateBasket } from './Basket'

export function getOrCreateMasset(address: Address): MassetEntity {
  let id = address.toHexString()

  let massetEntity = MassetEntity.load(id)

  if (massetEntity != null) {
    return massetEntity as MassetEntity
  }

  massetEntity = new MassetEntity(id)

  let masset = Masset.bind(address)

  let massetData = masset.try_data()
  if (!massetData.reverted) {
    massetEntity.feeRate = massetData.value.value0
    massetEntity.redemptionFeeRate = massetData.value.value1
    massetEntity.cacheSize = massetData.value.value2
    massetEntity.surplus = massetData.value.value3
    let ampData = massetData.value.value5
    let ampDataEntity = new AmpDataEntity(id)
    ampDataEntity.currentA = ampData.initialA
    ampDataEntity.targetA = ampData.targetA
    ampDataEntity.startTime = ampData.rampStartTime
    ampDataEntity.rampEndTime = ampData.rampEndTime
    ampDataEntity.save()
    massetEntity.ampData = ampDataEntity.id
    let weightLimits = massetData.value.value6
    massetEntity.hardMin = weightLimits.min
    massetEntity.hardMax = weightLimits.max
  } else {
    massetEntity.feeRate = integer.ZERO
    massetEntity.redemptionFeeRate = integer.ZERO
  }

  massetEntity.basket = id
  massetEntity.token = token.getOrCreate(address).id

  updateBasket(address)

  massetEntity.totalSupply = metrics.getOrCreate(address, 'token.totalSupply').id
  massetEntity.cumulativeMinted = metrics.getOrCreate(address, 'cumulativeMinted').id
  massetEntity.cumulativeRedeemed = metrics.getOrCreate(address, 'cumulativeRedeemed').id
  massetEntity.cumulativeRedeemedMasset = metrics.getOrCreate(
    address,
    'cumulativeRedeemedMasset',
  ).id
  massetEntity.cumulativeSwapped = metrics.getOrCreate(address, 'cumulativeSwapped').id
  massetEntity.cumulativeFeesPaid = metrics.getOrCreate(address, 'cumulativeFeesPaid').id
  massetEntity.cumulativeInterestCollected = metrics.getOrCreate(
    address,
    'cumulativeInterestCollected',
  ).id
  massetEntity.cumulativeInterestDistributed = metrics.getOrCreate(
    address,
    'cumulativeInterestDistributed',
  ).id
  massetEntity.cumulativeLiquidatorDeposited = metrics.getOrCreate(
    address,
    'cumulativeLiquidatorDeposited',
  ).id

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
