import { Address, log } from '@graphprotocol/graph-ts'
import { integer, token } from '@mstable/subgraph-utils'

import {
  DistributedReward,
  RemovedFundManager,
  AddedFundManager,
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

export function handleAddedFundManager(event: AddedFundManager): void {
  let rewardsDistributor = getOrCreateRewardsDistributor(event.address)

  rewardsDistributor.fundManagers = rewardsDistributor.fundManagers.concat([event.params._address])

  rewardsDistributor.save()
}

// FIXME this seems broken... entities aren't created properly
export function handleDistributedReward(event: DistributedReward): void {
  log.debug('handleDistributedReward {}', [event.transaction.hash.toHexString()])

  // The receipient may be a StakingRewards or StakingRewardsWithPlatformToken
  // contract, which should be tracked here.
  let recipient = event.params.recipient

  // If the recipient is a staking rewards contract that already exists, no further
  // action is needed.
  if (StakingRewardsContract.load(recipient.toHexString()) != null) {
    return
  }

  {
    let contract = StakingRewardsWithPlatformToken.bind(recipient)
    if (event.params.platformAmount.gt(integer.ZERO)) {
      // Track the contract and create the entity
      {
        log.debug('Tracking StakingRewardsWithPlatformToken {}', [recipient.toHexString()])
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
    log.debug('Tracking StakingRewards {}', [recipient.toHexString()])
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
