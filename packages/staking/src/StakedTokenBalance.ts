import { Address } from '@graphprotocol/graph-ts'

import { StakedTokenBalance as Entity } from '../generated/schema'
import { StakedToken } from './StakedToken'

export namespace StakedTokenBalance {
  function getId(account: Address, stakedTokenAddress: Address): string {
    return account.toHexString() + '.' + stakedTokenAddress.toHexString()
  }

  export function getOrCreate(account: Address, stakedTokenAddress: Address): Entity {
    let id = getId(account, stakedTokenAddress)

    let entity = Entity.load(id)
    if (entity != null) {
      return entity as Entity
    }

    entity = new Entity(id)
    entity.account = account.toHexString()
    entity.stakedToken = stakedTokenAddress.toHexString()
    entity = updateEntity(entity as Entity, account, stakedTokenAddress)
    entity.save()

    return entity as Entity
  }

  export function updateEntity(
    entity: Entity,
    account: Address,
    stakedTokenAddress: Address,
  ): Entity {
    let stakedToken = StakedToken.getContract(stakedTokenAddress)
    let balanceData = stakedToken.balanceData(account)

    entity.raw = balanceData.raw
    entity.weightedTimestamp = balanceData.weightedTimestamp.toI32()
    entity.cooldownUnits = balanceData.cooldownUnits.toI32()
    entity.cooldownTimestamp = balanceData.cooldownTimestamp.toI32()
    entity.timeMultiplier = balanceData.timeMultiplier
    entity.questMultiplier = balanceData.questMultiplier
    entity.votes = stakedToken.getVotes(account)

    return entity
  }

  export function update(account: Address, stakedTokenAddress: Address): Entity {
    let entity = getOrCreate(account, stakedTokenAddress)
    entity = updateEntity(entity, account, stakedTokenAddress)
    entity.save()
    return entity
  }
}
