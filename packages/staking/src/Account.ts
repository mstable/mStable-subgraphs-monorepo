import { Address } from '@graphprotocol/graph-ts'

import { Account as AccountEntity } from '../generated/schema'
import { StakedToken } from './StakedToken'
import { Balance } from './Balance'
import { integer } from '../../utils'

export namespace Account {
  export function getOrCreate(addr: Address): AccountEntity {
    let id = addr.toHexString()

    let entity = AccountEntity.load(id)
    if (entity != null) {
      return entity as AccountEntity
    }

    entity = new AccountEntity(id)

    entity.rewardPerTokenPaid = integer.ZERO
    entity.rewards = integer.ZERO
    entity.balance = Balance.getOrCreate(addr).id
    entity = update(entity as AccountEntity, addr)
    entity.save()

    return entity as AccountEntity
  }

  export function update(entity: AccountEntity, addr: Address): AccountEntity {
    let stakedToken = StakedToken.getContract()
    let delegatee = stakedToken.delegates(addr)
    Balance.updateByAddress(addr)

    if (delegatee) {
      if (delegatee.notEqual(addr)) {
        entity.delegatee = delegatee.toHexString()
      }
    }

    let stakerCooldown = stakedToken.stakersCooldowns(addr)

    entity.cooldownTimestamp = stakerCooldown.value0
    entity.cooldownPercentage = stakerCooldown.value1

    return entity
  }

  export function updateByAddress(addr: Address): AccountEntity {
    let entity = getOrCreate(addr)
    entity = update(entity, addr)
    entity.save()
    return entity
  }
}
