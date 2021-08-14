import { BigInt } from '@graphprotocol/graph-ts'

import { Season as SeasonEntity } from '../generated/schema'

export namespace Season {
  export function getOrCreate(seasonNumber: BigInt, seasonEpoch: BigInt): SeasonEntity {
    let id = seasonNumber.toString()

    let entity = SeasonEntity.load(id)
    if (entity != null) {
      return entity as SeasonEntity
    }

    entity = new SeasonEntity(id)
    entity.startedAt = seasonEpoch.toI32()
    entity.seasonNumber = seasonNumber.toI32()
    entity.save()

    return entity as SeasonEntity
  }

  export function getById(id: string): SeasonEntity | null {
    return SeasonEntity.load(id)
  }

  export function expire(seasonNumber: BigInt, timestamp: BigInt): void {
    let id = seasonNumber.toString()
    let entity = SeasonEntity.load(id) as SeasonEntity
    entity.endedAt = timestamp.toI32()
    entity.save()
  }
}
