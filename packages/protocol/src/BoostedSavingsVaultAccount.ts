import { Address, BigInt, log } from '@graphprotocol/graph-ts'
import { integer } from '@mstable/subgraph-utils'

import { BoostedSavingsVault as BoostedSavingsVaultContract } from '../generated/BoostedSavingsVault_imUSD/BoostedSavingsVault'

import {
  BoostedSavingsVault as BoostedSavingsVaultEntity,
  BoostedSavingsVaultAccount as BoostedSavingsVaultAccountEntity,
} from '../generated/schema'

import { BoostedSavingsVaultRewardEntry } from './BoostedSavingsVaultRewardEntry'

let maxI32 = BigInt.fromI32(2147483647)

export namespace BoostedSavingsVaultAccount {
  export function getId(
    boostedSavingsVaultEntity: BoostedSavingsVaultEntity,
    account: Address,
  ): string {
    let accountId = account.toHexString()
    return boostedSavingsVaultEntity.id.concat('.').concat(accountId)
  }

  export function get(
    boostedSavingsVaultEntity: BoostedSavingsVaultEntity,
    account: Address,
  ): BoostedSavingsVaultAccountEntity | null {
    let id = getId(boostedSavingsVaultEntity, account)
    return BoostedSavingsVaultAccountEntity.load(id)
  }

  export function getOrCreate(
    boostedSavingsVaultEntity: BoostedSavingsVaultEntity,
    account: Address,
  ): BoostedSavingsVaultAccountEntity {
    let entity = get(boostedSavingsVaultEntity, account)
    if (entity != null) {
      return entity as BoostedSavingsVaultAccountEntity
    }

    let id = getId(boostedSavingsVaultEntity, account)
    entity = new BoostedSavingsVaultAccountEntity(id)
    entity.account = account.toHexString()
    entity.rawBalance = integer.ZERO
    entity.boostedBalance = integer.ZERO
    entity.boostedSavingsVault = boostedSavingsVaultEntity.id
    entity.rewardPerTokenPaid = integer.ZERO
    entity.rewards = integer.ZERO
    entity.lastAction = integer.ZERO
    entity.lastClaim = integer.ZERO
    entity.rewardCount = integer.ZERO

    return entity as BoostedSavingsVaultAccountEntity
  }

  export function update(
    entity: BoostedSavingsVaultAccountEntity,
    boostedSavingsVaultEntity: BoostedSavingsVaultEntity,
    contract: BoostedSavingsVaultContract,
  ): BoostedSavingsVaultAccountEntity {
    let account = Address.fromString(entity.account)

    let userData = contract.userData(account)
    let lastClaim = contract.userClaim(account)

    entity.rawBalance = contract.rawBalanceOf(account)
    entity.boostedBalance = contract.balanceOf(account)
    entity.rewardPerTokenPaid = userData.value0
    entity.rewards = userData.value1
    entity.lastAction = userData.value2
    entity.lastClaim = lastClaim
    entity.rewardCount = userData.value3

    let index = BigInt.fromString('0')
    while (
      entity.rewardCount.gt(BigInt.fromString('0')) &&
      entity.rewardCount.gt(index) &&
      // Hack: prevent timeout
      index.lt(BigInt.fromString('1000'))
    ) {
      BoostedSavingsVaultRewardEntry.update(entity.id, index.toI32(), account, contract)
      index = index.plus(BigInt.fromString('1'))
    }

    return entity as BoostedSavingsVaultAccountEntity
  }
}
