import { Address, BigInt } from '@graphprotocol/graph-ts'
import { integer } from '@mstable/subgraph-utils'

import { Quest as QuestEntity } from '../generated/schema'

import { StakedToken } from './StakedToken'

export namespace Quest {
  export function getOrCreate(numericId: BigInt, stakedTokenAddress: Address): QuestEntity {
    let id = numericId.toString()

    let entity = QuestEntity.load(id)
    if (entity != null) {
      return entity as QuestEntity
    }

    let stakedTokenEntity = StakedToken.getOrCreate(stakedTokenAddress)

    entity = new QuestEntity(id)
    entity.season = stakedTokenEntity.season
    entity = update(entity as QuestEntity, stakedTokenAddress)
    entity.save()

    return entity as QuestEntity
  }

  export function update(entity: QuestEntity, stakedTokenAddress: Address): QuestEntity {
    let stakedToken = StakedToken.getContract(stakedTokenAddress)
    let stakedTokenEntity = StakedToken.getOrCreate(stakedTokenAddress)

    let questData = stakedToken.getQuest(integer.fromString(entity.id))

    entity.expiry = questData.expiry.toI32()
    entity.multiplier = questData.multiplier
    entity.status = questData.status == 0 ? 'ACTIVE' : 'EXPIRED'
    entity.type = questData.model == 0 ? 'PERMANENT' : 'SEASONAL'
    if (entity.type == 'SEASONAL') {
      entity.season = stakedTokenEntity.season
    }

    return entity
  }

  export function updateById(numericId: BigInt, stakedTokenAddress: Address): QuestEntity {
    let entity = getOrCreate(numericId, stakedTokenAddress)
    entity = update(entity, stakedTokenAddress)
    entity.save()
    return entity
  }
}
