import { Address } from '@graphprotocol/graph-ts'
import { integer, token } from '@mstable/subgraph-utils'

import { BoostedSavingsVault as BoostedSavingsVaultContract } from '../generated/BoostedSavingsVault_imUSD/BoostedSavingsVault'

import {
  BoostedSavingsVault as BoostedSavingsVaultEntity,
  SavingsContract as SavingsContractEntity,
} from '../generated/schema'

export namespace BoostedSavingsVault {
  export function getOrCreate(addr: Address): BoostedSavingsVaultEntity {
    let id = addr.toHexString()

    let entity = BoostedSavingsVaultEntity.load(id)
    if (entity != null) {
      return entity as BoostedSavingsVaultEntity
    }

    let contract = BoostedSavingsVaultContract.bind(addr)

    entity = new BoostedSavingsVaultEntity(id)
    entity.periodDuration = contract.DURATION().toI32()
    entity.lockupDuration = contract.LOCKUP().toI32()
    entity.unlockPercentage = contract.UNLOCK()

    entity.stakingContract = contract.stakingToken()
    token.getOrCreate(entity.stakingContract as Address)

    entity.rewardsDistributor = contract.rewardsDistributor()
    entity.rewardsToken = token.getOrCreate(contract.getRewardToken()).id
    entity.stakingToken = token.getOrCreate(contract.stakingToken()).id

    let savingsContractEntity = SavingsContractEntity.load(entity.stakingToken)
    if (savingsContractEntity != null) {
      entity.savingsContract = savingsContractEntity.id
    }

    entity = update(entity as BoostedSavingsVaultEntity, contract)

    entity.save()

    return entity as BoostedSavingsVaultEntity
  }

  export function update(
    entity: BoostedSavingsVaultEntity,
    contract: BoostedSavingsVaultContract,
  ): BoostedSavingsVaultEntity {
    entity.lastUpdateTime = contract.lastUpdateTime().toI32()
    entity.periodFinish = contract.periodFinish().toI32()
    entity.rewardRate = contract.rewardRate()
    entity.rewardPerTokenStored = contract.rewardPerTokenStored()
    entity.totalSupply = contract.totalSupply()

    entity.totalStakingRewards = entity.rewardRate
      .times(integer.fromNumber(entity.periodDuration))
      .div(integer.SCALE)

    return entity
  }
}
