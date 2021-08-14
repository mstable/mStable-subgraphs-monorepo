import { token } from '@mstable/subgraph-utils'
import { Address } from '@graphprotocol/graph-ts'

import { HeadlessStakingRewards } from '../generated/StakedToken/HeadlessStakingRewards'
import { StakingRewards as StakingRewardsEntity } from '../generated/schema'

export namespace StakingRewards {
  export function getContract(addr: Address): HeadlessStakingRewards {
    return HeadlessStakingRewards.bind(addr)
  }

  export function getOrCreate(addr: Address): StakingRewardsEntity {
    let id = addr.toHexString()

    let entity = StakingRewardsEntity.load(id)
    if (entity != null) {
      return entity as StakingRewardsEntity
    }

    let contract = getContract(addr)

    entity = new StakingRewardsEntity(id)
    entity.DURATION = contract.DURATION().toI32()
    entity.rewardsToken = token.getOrCreate(contract.REWARDS_TOKEN()).id
    entity.rewardsTokenVendor = contract.rewardTokenVendor()
    entity = update(entity as StakingRewardsEntity, addr)
    entity.save()

    return entity as StakingRewardsEntity
  }

  export function update(entity: StakingRewardsEntity, addr: Address): StakingRewardsEntity {
    let contract = getContract(addr)

    entity.pendingAdditionalReward = contract.pendingAdditionalReward()
    entity.rewardsDistributor = contract.rewardsDistributor()

    let globalData = contract.globalData()
    entity.periodFinish = globalData.value0.toI32()
    entity.lastUpdateTime = globalData.value1.toI32()
    entity.rewardRate = globalData.value2
    entity.rewardPerTokenStored = globalData.value3

    return entity
  }

  export function updateByAddress(addr: Address): StakingRewardsEntity {
    let entity = getOrCreate(addr)
    entity = update(entity, addr)
    entity.save()
    return entity
  }
}
