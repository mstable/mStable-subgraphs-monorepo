import { Address } from '@graphprotocol/graph-ts'
import { integer, counters, metrics, token } from '@mstable/subgraph-utils'

import { Masset } from '../generated/BasketManager_mUSD/Masset'
import { InvariantValidator } from '../generated/mBTC/InvariantValidator'
import { CurvedMasset } from '../generated/mBTC/CurvedMasset'
import { AmpData as AmpDataEntity, Masset as MassetEntity } from '../generated/schema'

export function getOrCreateMasset(address: Address): MassetEntity {
  let id = address.toHexString()

  let massetEntity = MassetEntity.load(id)

  if (massetEntity != null) {
    return massetEntity as MassetEntity
  }

  massetEntity = new MassetEntity(id)

  let contract = Masset.bind(address)

  massetEntity.feeRate = contract.swapFee()

  /**
   * @deprecated
   * BasketManager is for non-CurvedMasset only
   */
  let basketManager = contract.try_getBasketManager()
  if (!basketManager.reverted) {
    massetEntity.basketManager = basketManager.value
  }

  massetEntity.forgeValidator = contract.forgeValidator()

  massetEntity.basket = id
  massetEntity.token = token.getOrCreate(address).id

  let invariantValidator = InvariantValidator.bind(massetEntity.forgeValidator as Address)
  let invariantStartTime = invariantValidator.try_startTime()
  if (!invariantStartTime.reverted) {
    massetEntity.invariantStartTime = invariantStartTime.value.toI32()
    massetEntity.invariantStartingCap = invariantValidator.startingCap()
    massetEntity.invariantCapFactor = invariantValidator.capFactor()
  }

  let curvedMasset = CurvedMasset.bind(address)
  let hardMax = curvedMasset.try_hardMax()
  if (!hardMax.reverted) {
    massetEntity.hardMax = hardMax.value
  }

  let ampData = curvedMasset.try_ampData()
  if (!ampData.reverted) {
    let ampDataEntity = new AmpDataEntity(id)
    ampDataEntity.initialA = ampData.value.value0
    ampDataEntity.futureA = ampData.value.value1
    ampDataEntity.initialATime = ampData.value.value2
    ampDataEntity.futureATime = ampData.value.value3
    ampDataEntity.save()
    massetEntity.ampData = ampDataEntity.id
  }

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
