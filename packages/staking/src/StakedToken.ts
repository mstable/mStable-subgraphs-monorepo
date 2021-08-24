import { Address } from '@graphprotocol/graph-ts'
import { integer, token } from '@mstable/subgraph-utils'

import { StakedToken as StakedTokenContract } from '../generated/StakedTokenMTA/StakedToken'
import { StakedToken as Entity } from '../generated/schema'

import { Season } from './Season'
import { StakingRewards } from './StakingRewards'

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
    entity.questMaster = contract.questMaster()

    // Create sub-entities
    entity.token = token.getOrCreate(addr).id
    let stakingToken = contract.STAKED_TOKEN()
    entity.stakingToken = token.getOrCreate(stakingToken).id
    entity.stakingRewards = StakingRewards.getOrCreate(addr).id
    let seasonEntity = Season.getOrCreate(integer.ZERO, contract.seasonEpoch())
    entity.season = seasonEntity.id

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

    entity.collateralisationRatio = safetyData.value0
    entity.slashingPercentage = safetyData.value1

    // Maintain seasons
    let seasonEpoch = contract.seasonEpoch()
    let seasonEntity = Season.getById(entity.season)
    if (seasonEntity) {
      if (seasonEntity.startedAt != seasonEpoch.toI32()) {
        let prevSeasonNumber = integer.fromNumber(seasonEntity.seasonNumber)
        Season.expire(prevSeasonNumber, seasonEpoch)
        entity.season = Season.getOrCreate(prevSeasonNumber.plus(integer.ONE), seasonEpoch).id
      }
    }

    return entity
  }
}
