import { integer } from '@mstable/subgraph-utils'

import { Quest as QuestEntity } from '../generated/schema'

import { StakedToken } from './StakedToken'
import { BigInt } from '@graphprotocol/graph-ts'

export namespace Quest {
  export function getOrCreate(numericId: BigInt): QuestEntity {
    let id = numericId.toString()

    let entity = QuestEntity.load(id)
    if (entity != null) {
      return entity as QuestEntity
    }

    let stakedTokenEntity = StakedToken.getEntity()

    entity = new QuestEntity(id)
    entity.season = stakedTokenEntity.season
    entity = update(entity as QuestEntity)
    entity.save()

    return entity as QuestEntity
  }

  export function update(entity: QuestEntity): QuestEntity {
    let stakedToken = StakedToken.getContract()
    let stakedTokenEntity = StakedToken.getEntity()

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

  export function updateById(numericId: BigInt): QuestEntity {
    let entity = getOrCreate(numericId)
    entity = update(entity)
    entity.save()
    return entity
  }
}
