import { Address } from '@graphprotocol/graph-ts'
import { address, integer, token } from '@mstable/subgraph-utils'

import { BoostedSavingsVault as BoostedSavingsVaultContract } from '../generated/templates/FeederPool/BoostedSavingsVault'
import { BoostedDualVault as BoostedDualVaultContract } from '../generated/templates/FeederPool/BoostedDualVault'

import {
  BoostedSavingsVault as BoostedSavingsVaultEntity,
  FeederPool as FeederPoolEntity,
} from '../generated/schema'

export namespace BoostedSavingsVault {
  export function getOrCreate(addr: Address): BoostedSavingsVaultEntity {
    let id = addr.toHexString()

    let entity = BoostedSavingsVaultEntity.load(id)
    if (entity != null) {
      return entity as BoostedSavingsVaultEntity
    }

    let contract = BoostedSavingsVaultContract.bind(addr)
    let dualVaultContract = BoostedDualVaultContract.bind(addr)

    entity = new BoostedSavingsVaultEntity(id)
    entity.periodDuration = contract.DURATION().toI32()
    entity.lockupDuration = contract.LOCKUP().toI32()
    entity.unlockPercentage = contract.UNLOCK()

    let stakingToken = contract.stakingToken()
    token.getOrCreate(stakingToken)

    entity.stakingContract = stakingToken
    let boostCoeff = contract.try_boostCoeff()
    let priceCoeff = contract.try_priceCoeff()
    if (!boostCoeff.reverted) {
      entity.boostCoeff = boostCoeff.value
    }
    if (!priceCoeff.reverted) {
      entity.priceCoeff = priceCoeff.value
    }

    entity.rewardsDistributor = contract.rewardsDistributor()
    entity.rewardsToken = token.getOrCreate(contract.getRewardToken()).id
    entity.stakingToken = token.getOrCreate(contract.stakingToken()).id

    if (FeederPoolEntity.load(entity.stakingToken) != null) {
      entity.feederPool = entity.stakingToken
    }

    let platformToken = dualVaultContract.try_platformToken()
    if (!platformToken.reverted && platformToken.value.notEqual(address.ZERO_ADDRESS)) {
      entity.totalRaw = dualVaultContract.totalRaw()
      entity.platformRewardPerTokenStored = dualVaultContract.platformRewardPerTokenStored()
      entity.platformRewardRate = dualVaultContract.platformRewardRate()
      entity.platformRewardsToken = token.getOrCreate(platformToken.value).id
    }

    entity = update(entity as BoostedSavingsVaultEntity)

    entity.save()

    return entity as BoostedSavingsVaultEntity
  }

  export function update(entity: BoostedSavingsVaultEntity): BoostedSavingsVaultEntity {
    let addr = Address.fromString(entity.id)
    let contract = BoostedSavingsVaultContract.bind(addr)

    entity.lastUpdateTime = contract.lastUpdateTime().toI32()
    entity.periodFinish = contract.periodFinish().toI32()
    entity.rewardRate = contract.rewardRate()
    entity.rewardPerTokenStored = contract.rewardPerTokenStored()
    entity.totalSupply = contract.totalSupply()

    if (entity.platformRewardsToken) {
      let dualVaultContract = BoostedDualVaultContract.bind(addr)
      entity.totalRaw = dualVaultContract.totalRaw()
      entity.platformRewardRate = dualVaultContract.platformRewardRate()
      entity.platformRewardPerTokenStored = dualVaultContract.platformRewardPerTokenStored()
    }

    entity.totalStakingRewards = entity.rewardRate
      .times(integer.fromNumber(entity.periodDuration))
      .div(integer.SCALE)

    return entity
  }
}
