import { Address } from '@graphprotocol/graph-ts'
import { integer, counters, metrics, token } from '@mstable/subgraph-utils'

import { LegacyMasset } from '../generated/templates/Masset/LegacyMasset'
import { Masset } from '../generated/templates/Masset/Masset'
import { InvariantValidator } from '../generated/templates/Masset/InvariantValidator'
import { AmpData as AmpDataEntity, Masset as MassetEntity } from '../generated/schema'
import { updateBasket } from './Basket'

export function getOrCreateMasset(address: Address): MassetEntity {
  let id = address.toHexString()

  let massetEntity = MassetEntity.load(id)

  if (massetEntity != null) {
    return massetEntity as MassetEntity
  }

  massetEntity = new MassetEntity(id)

  let legacyMasset = LegacyMasset.bind(address)

  massetEntity.feeRate = legacyMasset.swapFee()

  /**
   * @deprecated
   * BasketManager is for Legacy Massets only
   */
  let basketManager = legacyMasset.try_getBasketManager()
  if (!basketManager.reverted) {
    massetEntity.basketManager = basketManager.value
  }

  massetEntity.forgeValidator = legacyMasset.forgeValidator()

  massetEntity.basket = id
  massetEntity.token = token.getOrCreate(address).id

  let masset = Masset.bind(address)
  let weightLimits = masset.try_weightLimits()

  // If this didn't revert, then we're dealing with a new Masset
  if (!weightLimits.reverted) {
    massetEntity.hardMin = weightLimits.value.value0
    massetEntity.hardMax = weightLimits.value.value1

    let invariantValidator = InvariantValidator.bind(massetEntity.forgeValidator as Address)
    massetEntity.invariantStartTime = invariantValidator.startTime().toI32()
    massetEntity.invariantStartingCap = invariantValidator.startingCap()
    massetEntity.invariantCapFactor = invariantValidator.capFactor()

    let ampData = masset.ampData()
    let ampDataEntity = new AmpDataEntity(id)
    ampDataEntity.currentA = ampData.value0
    ampDataEntity.targetA = ampData.value1
    ampDataEntity.startTime = ampData.value2
    ampDataEntity.rampEndTime = ampData.value3
    ampDataEntity.save()
    massetEntity.ampData = ampDataEntity.id

    updateBasket(address)
  }

  let redemptionFee = legacyMasset.try_redemptionFee()
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
