import { Address } from '@graphprotocol/graph-ts'
import { integer } from '@mstable/subgraph-utils'

import { BoostedSavingsVault } from '../generated/BoostedSavingsVault_mUSD/BoostedSavingsVault'

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
    entity.claimed = false

    entity.save()

    return entity as BoostedSavingsVaultRewardEntryEntity
  }

  export function update(
    accountId: string,
    index: i32,
    firstUnclaimedIndex: number,
    account: Address,
    contract: BoostedSavingsVault,
  ): BoostedSavingsVaultRewardEntryEntity {
    let entity = getOrCreate(accountId, index)

    let userReward = contract.userRewards(account, integer.fromNumber(index))

    entity.start = userReward.value0.toI32()
    entity.finish = userReward.value1.toI32()
    entity.rate = userReward.value2
    entity.claimed = index < firstUnclaimedIndex
    entity.save()

    return entity as BoostedSavingsVaultRewardEntryEntity
  }
}
