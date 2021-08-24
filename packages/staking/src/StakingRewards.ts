import { token } from '@mstable/subgraph-utils'
import { Address } from '@graphprotocol/graph-ts'

import { HeadlessStakingRewards } from '../generated/StakedTokenMTA/HeadlessStakingRewards'
import { StakingRewards as Entity } from '../generated/schema'

export namespace StakingRewards {
  export function getContract(addr: Address): HeadlessStakingRewards {
    return HeadlessStakingRewards.bind(addr)
  }

  export function getOrCreate(addr: Address): Entity {
    let id = addr.toHexString()

    let entity = Entity.load(id)
    if (entity != null) {
      return entity as Entity
    }

    let contract = getContract(addr)

    entity = new Entity(id)
    entity.DURATION = contract.DURATION().toI32()
    entity.rewardsToken = token.getOrCreate(contract.REWARDS_TOKEN()).id
    entity.rewardsTokenVendor = contract.rewardTokenVendor()
    entity = updateEntity(entity as Entity, addr)
    entity.save()

    return entity as Entity
  }

  export function updateEntity(entity: Entity, addr: Address): Entity {
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

  export function update(addr: Address): Entity {
    let entity = getOrCreate(addr)
    entity = updateEntity(entity, addr)
    entity.save()
    return entity
  }
}
