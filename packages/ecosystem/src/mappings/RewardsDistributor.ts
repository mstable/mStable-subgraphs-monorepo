import { Address } from '@graphprotocol/graph-ts'
import { token } from '@mstable/subgraph-utils'

import {
  DistributedReward,
  RemovedFundManager,
  Whitelisted,
} from '../../generated/RewardsDistributor/RewardsDistributor'
import {
  StakingRewards as StakingRewardsTemplate,
  StakingRewardsWithPlatformToken as StakingRewardsWithPlatformTokenTemplate,
} from '../../generated/templates'
import { StakingRewards } from '../../generated/RewardsDistributor/StakingRewards'
import { StakingRewardsWithPlatformToken } from '../../generated/RewardsDistributor/StakingRewardsWithPlatformToken'
import { RewardsDistributor, StakingRewardsContract } from '../../generated/schema'
import { getOrCreateStakingRewardsContract } from '../models/StakingRewardsContract'
import { StakingRewardsContractType } from '../enums'
import { BoostedSavingsVault } from '../../../protocol/generated/BoostedSavingsVault_mUSD/BoostedSavingsVault'

function getOrCreateRewardsDistributor(address: Address): RewardsDistributor {
  let id = address.toHexString()
  let rewardsDistributor = RewardsDistributor.load(id)

  if (rewardsDistributor != null) {
    return rewardsDistributor as RewardsDistributor
  }

  rewardsDistributor = new RewardsDistributor(id)
  rewardsDistributor.fundManagers = []

  rewardsDistributor.save()

  return rewardsDistributor as RewardsDistributor
}

export function handleRemovedFundManager(event: RemovedFundManager): void {
  let rewardsDistributor = getOrCreateRewardsDistributor(event.address)

  rewardsDistributor.fundManagers = rewardsDistributor.fundManagers.filter(_managerId =>
    _managerId.notEqual(event.params._address),
  )

  rewardsDistributor.save()
}

export function handleWhitelisted(event: Whitelisted): void {
  let rewardsDistributor = getOrCreateRewardsDistributor(event.address)

  rewardsDistributor.fundManagers = rewardsDistributor.fundManagers.concat([event.params._address])

  rewardsDistributor.save()
}

export function handleDistributedReward(event: DistributedReward): void {
  // The receipient may be a StakingRewards or StakingRewardsWithPlatformToken
  // contract, which should be tracked here.
  let recipient = event.params.recipient

  // If the recipient is a staking rewards contract that already exists, no further
  // action is needed.
  if (StakingRewardsContract.load(recipient.toHexString()) != null) {
    return
  }

  // If it has a LOCKUP defined, it's not in the scope of this subgraph (and is possibly a
  // boosted savings vault).
  {
    let contract = BoostedSavingsVault.bind(recipient)
    if (!contract.try_LOCKUP().reverted) {
      return
    }
  }

  // Try a function that only exists on the `StakingRewardsWithPlatformToken` contract
  {
    let contract = StakingRewardsWithPlatformToken.bind(recipient)
    if (!contract.try_platformToken().reverted) {
      // Track the contract and create the entity
      {
        StakingRewardsWithPlatformTokenTemplate.create(recipient)
        getOrCreateStakingRewardsContract(
          recipient,
          StakingRewardsContractType.STAKING_REWARDS_WITH_PLATFORM_TOKEN,
        )
      }

      // Create the staking token entity, but do not track it
      {
        let address = contract.stakingToken()
        token.getOrCreate(address)
      }

      // Create the platform token entity, but do not track it
      {
        let address = contract.platformToken()
        token.getOrCreate(address)
      }

      // Create the rewards token entity, but do not track it
      {
        let address = contract.rewardsToken()
        token.getOrCreate(address)
      }

      return
    }
  }

  // Try a function that exists on the `StakingRewards` contract
  let contract = StakingRewards.bind(recipient)
  if (!contract.try_rewardsToken().reverted) {
    // Track the contract and create the entity
    StakingRewardsTemplate.create(recipient)
    getOrCreateStakingRewardsContract(
      event.params.recipient,
      StakingRewardsContractType.STAKING_REWARDS,
    )

    // Create the staking token entity, but do not track it
    {
      let address = contract.stakingToken()
      token.getOrCreate(address)
    }

    // Create the rewards token entity, but do not track it
    {
      let address = contract.rewardsToken()
      token.getOrCreate(address)
    }

    return
  }
}
