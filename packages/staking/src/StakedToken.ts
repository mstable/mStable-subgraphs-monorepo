import { Address } from '@graphprotocol/graph-ts'
import { token } from '@mstable/subgraph-utils'

import { StakedTokenMTA as StakedTokenContract } from '../generated/StakedTokenMTA/StakedTokenMTA'
import { StakedTokenBPT as StakedTokenBPTContract } from '../generated/StakedTokenBPT/StakedTokenBPT'
import { StakedToken as Entity } from '../generated/schema'

import { StakingRewards } from './StakingRewards'
import { QuestManager } from './QuestManager'

export namespace StakedToken {
  export function getContract(addr: Address): StakedTokenContract {
    return StakedTokenContract.bind(addr)
  }

  export function getOrCreate(addr: Address): Entity {
    let id = addr.toHexString()
    let entity = Entity.load(id)
    if (entity != null) {
      return entity as Entity
    }

    entity = new Entity(id)
    let contract = StakedTokenContract.bind(addr)

    // Set immutable fields
    entity.COOLDOWN_SECONDS = contract.COOLDOWN_SECONDS()
    entity.UNSTAKE_WINDOW = contract.UNSTAKE_WINDOW()

    // Create sub-entities
    entity.token = token.getOrCreate(addr).id
    let stakingToken = contract.STAKED_TOKEN()
    entity.stakingToken = token.getOrCreate(stakingToken).id
    entity.stakingRewards = StakingRewards.getOrCreate(addr).id
    entity.questManager = QuestManager.getOrCreate(contract.questManager()).id

    entity = update(entity as Entity)
    entity.save()

    return entity as Entity
  }

  export function updateByAddress(addr: Address): Entity {
    let entity = getOrCreate(addr)
    entity = update(entity)
    entity.save()
    return entity
  }

  export function update(entity: Entity): Entity {
    let address = Address.fromString(entity.id)
    let contract = StakedTokenContract.bind(address)

    StakingRewards.update(address)

    let safetyData = contract.safetyData()

    let stakedTokenBPTContract = StakedTokenBPTContract.bind(address)
    let priceCoefficient = stakedTokenBPTContract.try_priceCoefficient()
    if (!priceCoefficient.reverted) {
      entity.priceCoefficient = priceCoefficient.value
    }

    entity.collateralisationRatio = safetyData.value0
    entity.slashingPercentage = safetyData.value1

    return entity
  }
}
