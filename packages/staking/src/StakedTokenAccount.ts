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

    entity.account = account.toHexString()
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

    let userData = stakedTokenContract.userData(account)
    entity.rewardPerTokenPaid = userData.value0
    entity.rewards = userData.value1

    if (delegatee) {
      if (delegatee.notEqual(account)) {
        entity.delegatee = delegatee.toHexString()
      } else {
        entity.delegatee = null
      }
    }

    return entity
  }

  export function update(account: Address, stakedTokenAddress: Address): Entity {
    let entity = getOrCreate(account, stakedTokenAddress)
    entity = updateEntity(entity, account, stakedTokenAddress)
    entity.save()
    return entity
  }
}
