import { Address } from '@graphprotocol/graph-ts'
import { integer } from '@mstable/subgraph-utils'

import { StakedTokenAccount as Entity } from '../generated/schema'
import { StakedToken } from './StakedToken'
import { StakedTokenBalance } from './StakedTokenBalance'

export namespace StakedTokenAccount {
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

    entity.address = account
    entity.stakedToken = stakedTokenAddress.toHexString()
    entity.rewardPerTokenPaid = integer.ZERO
    entity.rewards = integer.ZERO
    entity.balance = StakedTokenBalance.getOrCreate(account, stakedTokenAddress).id
    entity = updateEntity(entity as Entity, account, stakedTokenAddress)
    entity.save()

    return entity as Entity
  }

  export function updateEntity(
    entity: Entity,
    account: Address,
    stakedTokenAddress: Address,
  ): Entity {
    let stakedTokenContract = StakedToken.getContract(stakedTokenAddress)
    let delegatee = stakedTokenContract.delegates(account)
    StakedTokenBalance.update(account, stakedTokenAddress)

    if (delegatee) {
      if (delegatee.notEqual(account)) {
        entity.delegatee = delegatee.toHexString()
      }
    }

    let stakerCooldown = stakedTokenContract.stakersCooldowns(account)

    entity.cooldownTimestamp = stakerCooldown.value0
    entity.cooldownPercentage = stakerCooldown.value1

    return entity
  }

  export function update(account: Address, stakedTokenAddress: Address): Entity {
    let entity = getOrCreate(account, stakedTokenAddress)
    entity = updateEntity(entity, account, stakedTokenAddress)
    entity.save()
    return entity
  }
}
