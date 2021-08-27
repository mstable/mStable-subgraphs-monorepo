import { Address, BigInt } from '@graphprotocol/graph-ts'
import { integer } from '@mstable/subgraph-utils'

import { Quest as QuestEntity } from '../generated/schema'

import { QuestManager } from './QuestManager'

export namespace Quest {
  export function getOrCreate(numericId: BigInt, questManagerAddress: Address): QuestEntity {
    let id = numericId.toString()

    let entity = QuestEntity.load(id)
    if (entity != null) {
      return entity as QuestEntity
    }

    let questManagerEntity = QuestManager.getOrCreate(questManagerAddress)

    entity = new QuestEntity(id)
    entity.season = questManagerEntity.season
    entity = update(entity as QuestEntity, questManagerAddress)
    entity.save()

    return entity as QuestEntity
  }

  export function update(entity: QuestEntity, questManagerAddress: Address): QuestEntity {
    let questManager = QuestManager.getContract(questManagerAddress)
    let questManagerEntity = QuestManager.getOrCreate(questManagerAddress)

    let questData = questManager.getQuest(integer.fromString(entity.id))

    entity.expiry = questData.expiry.toI32()
    entity.multiplier = questData.multiplier
    entity.status = questData.status == 0 ? 'ACTIVE' : 'EXPIRED'
    entity.type = questData.model == 0 ? 'PERMANENT' : 'SEASONAL'
    if (entity.type == 'SEASONAL') {
      entity.season = questManagerEntity.season
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
