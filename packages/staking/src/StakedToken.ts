import { Address, log } from '@graphprotocol/graph-ts'
import { integer, token } from '@mstable/subgraph-utils'

import { StakedToken as StakedTokenContract } from '../generated/StakedToken/StakedToken'
import { StakedToken as StakedTokenEntity } from '../generated/schema'

import { Season } from './Season'
import { StakingRewards } from './StakingRewards'

export namespace StakedToken {
  let ID = 'StakedToken'

  export function getEntity(): StakedTokenEntity {
    return StakedTokenEntity.load(ID) as StakedTokenEntity
  }

  export function getContract(): StakedTokenContract {
    let entity = getEntity()
    return StakedTokenContract.bind(entity.address as Address)
  }

  export function getOrCreate(addr: Address): StakedTokenEntity {
    let entity = StakedTokenEntity.load(ID)
    if (entity != null) {
      return entity as StakedTokenEntity
    }

    entity = new StakedTokenEntity(ID)
    let contract = StakedTokenContract.bind(addr)
    log.debug('StakedToken.getOrCreate', [])

    // Set immutable fields
    entity.address = addr
    entity.COOLDOWN_PERCENTAGE_SCALE = contract.COOLDOWN_PERCENTAGE_SCALE()
    entity.COOLDOWN_SECONDS = contract.COOLDOWN_SECONDS()
    entity.UNSTAKE_WINDOW = contract.UNSTAKE_WINDOW()
    entity.questSigner = contract._signer()

    // Create sub-entities
    entity.token = token.getOrCreate(addr).id
    let stakingToken = contract.STAKED_TOKEN()
    entity.stakingToken = token.getOrCreate(stakingToken).id
    entity.stakingRewards = StakingRewards.getOrCreate(addr).id
    let seasonEntity = Season.getOrCreate(integer.ZERO, contract.seasonEpoch())
    entity.season = seasonEntity.id

    entity = update(entity as StakedTokenEntity)
    entity.save()

    return entity as StakedTokenEntity
  }

  export function updateEntity(): StakedTokenEntity {
    let entity = getEntity()
    entity = update(entity)
    entity.save()
    return entity
  }

  export function update(entity: StakedTokenEntity): StakedTokenEntity {
    let contract = StakedTokenContract.bind(entity.address as Address)

    StakingRewards.updateByAddress(entity.address as Address)

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

  export function updateByAddress(addr: Address): StakedTokenEntity {
    let entity = getOrCreate(addr)
    entity = update(entity)
    entity.save()
    return entity
  }
}
