import { Address, Bytes } from '@graphprotocol/graph-ts'
import { integer } from '@mstable/subgraph-utils'

import { QuestManager as Entity } from '../generated/schema'
import { QuestManager as Contract } from '../generated/QuestManager'

import { Season } from './Season'

export namespace QuestManager {
  function getId(addr: Address): string {
    return addr.toHexString()
  }

  export function getContract(addr: Address): Contract {
    return Contract.bind(addr)
  }

  export function getOrCreate(addr: Address): Entity {
    let id = getId(addr)

    let entity = Entity.load(id)
    if (entity != null) {
      return entity as Entity
    }

    entity = new Entity(id)

    let contract = getContract(addr)

    let seasonEntity = Season.getOrCreate(integer.ZERO, contract.seasonEpoch())
    entity.season = seasonEntity.id
    entity.questMaster = contract.questMaster()

    entity.save()

    return entity as Entity
  }

  export function updateSeasons(addr: Address): Entity {
    let entity = getOrCreate(addr)
    let contract = getContract(addr)

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

    entity.save()
    return entity
  }

  export function updateQuestMaster(addr: Address, newQuestMaster: Bytes): Entity {
    let entity = getOrCreate(addr)
    entity.questMaster = newQuestMaster
    entity.save()
    return entity
  }

  export function updateQuestSigner(addr: Address, newQuestSigner: Bytes): Entity {
    let entity = getOrCreate(addr)
    entity.questSigner = newQuestSigner
    entity.save()
    return entity
  }
}
