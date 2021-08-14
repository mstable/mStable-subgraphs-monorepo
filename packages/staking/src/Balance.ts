import { Address } from '@graphprotocol/graph-ts'

import { Balance as BalanceEntity } from '../generated/schema'
import { StakedToken } from './StakedToken'

export namespace Balance {
  export function getOrCreate(addr: Address): BalanceEntity {
    let id = addr.toHexString()

    let entity = BalanceEntity.load(id)
    if (entity != null) {
      return entity as BalanceEntity
    }

    entity = new BalanceEntity(id)
    entity.account = id
    entity = update(entity as BalanceEntity, addr)
    entity.save()

    return entity as BalanceEntity
  }

  export function update(entity: BalanceEntity, addr: Address): BalanceEntity {
    let stakedToken = StakedToken.getContract()
    let balanceData = stakedToken.balanceData(addr)

    entity.raw = balanceData.raw
    entity.weightedTimestamp = balanceData.weightedTimestamp.toI32()
    entity.lastAction = balanceData.lastAction.toI32()
    entity.permMultiplier = balanceData.permMultiplier
    entity.seasonMultiplier = balanceData.seasonMultiplier
    entity.timeMultiplier = balanceData.timeMultiplier
    entity.cooldownMultiplier = balanceData.cooldownMultiplier
    entity.votes = stakedToken.getVotes(addr)

    return entity
  }

  export function updateByAddress(addr: Address): BalanceEntity {
    let entity = getOrCreate(addr)
    entity = update(entity, addr)
    entity.save()
    return entity
  }
}
