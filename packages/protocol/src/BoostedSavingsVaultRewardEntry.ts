import { Address } from '@graphprotocol/graph-ts'
import { integer } from '@mstable/subgraph-utils'

import { BoostedSavingsVault } from '../generated/BoostedSavingsVault_imUSD/BoostedSavingsVault'

import { BoostedSavingsVaultRewardEntry as BoostedSavingsVaultRewardEntryEntity } from '../generated/schema'

export namespace BoostedSavingsVaultRewardEntry {
  function getId(accountId: string, index: i32): string {
    return accountId.concat('.').concat(index.toString())
  }

  export function get(accountId: string, index: i32): BoostedSavingsVaultRewardEntryEntity | null {
    return BoostedSavingsVaultRewardEntryEntity.load(
      getId(accountId, index),
    ) as BoostedSavingsVaultRewardEntryEntity | null
  }

  export function getOrCreate(accountId: string, index: i32): BoostedSavingsVaultRewardEntryEntity {
    let entity = get(accountId, index)
    if (entity != null) {
      return entity as BoostedSavingsVaultRewardEntryEntity
    }

    let id = getId(accountId, index)

    entity = new BoostedSavingsVaultRewardEntryEntity(id)
    entity.index = index
    entity.account = accountId
    entity.boostedSavingsVault = accountId.split('.')[0]
    entity.rate = integer.ZERO
    entity.start = 0
    entity.finish = 0

    entity.save()

    return entity as BoostedSavingsVaultRewardEntryEntity
  }

  export function update(
    accountId: string,
    index: i32,
    account: Address,
    contract: BoostedSavingsVault,
  ): BoostedSavingsVaultRewardEntryEntity | null {
    // Reverted for some blocks
    let userRewardResult = contract.try_userRewards(account, integer.fromNumber(index))
    if (!userRewardResult.reverted) {
      let entity = getOrCreate(accountId, index)
      let userReward = userRewardResult.value
      entity.start = userReward.value0.toI32()
      entity.finish = userReward.value1.toI32()
      entity.rate = userReward.value2
      entity.save()
      return entity as BoostedSavingsVaultRewardEntryEntity
    } else {
      return null
    }
  }
}
