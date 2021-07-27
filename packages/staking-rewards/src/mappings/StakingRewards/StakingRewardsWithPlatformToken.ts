import { log } from '@graphprotocol/graph-ts'

import {
  RewardAdded,
  RewardPaid,
  Staked,
  Withdrawn,
} from '../../../generated/templates/StakingRewardsWithPlatformToken/StakingRewardsWithPlatformToken'
import {
  RewardPaid as RewardPaidBase,
  Staked as StakedBase,
  Withdrawn as WithdrawnBase,
} from '../../../generated/templates/StakingRewards/StakingRewards'
import { StakingRewardsContractType } from '../../enums'
import {
  handleRewardAddedForType,
  handleRewardPaidForType,
  handleStakedForType,
  handleWithdrawnForType,
} from './shared'
import {
  getOrCreateStakingRewardsContractRewardPaidTransaction,
  getOrCreateStakingRewardsContractStakeTransaction,
  getOrCreateStakingRewardsContractWithdrawTransaction,
} from '../../models/Transaction'

export function handleRewardAdded(event: RewardAdded): void {
  log.debug('StakingRewardsWithPlatformToken: handleRewardAdded {}', [
    event.transaction.hash.toHexString(),
  ])
  handleRewardAddedForType(
    event.address,
    StakingRewardsContractType.STAKING_REWARDS_WITH_PLATFORM_TOKEN,
  )
}

export function handleStaked(event: Staked): void {
  log.debug('StakingRewardsWithPlatformToken: handleStaked {}', [
    event.transaction.hash.toHexString(),
  ])
  handleStakedForType(
    event as StakedBase,
    StakingRewardsContractType.STAKING_REWARDS_WITH_PLATFORM_TOKEN,
  )
  getOrCreateStakingRewardsContractStakeTransaction(event as StakedBase)
}

export function handleWithdrawn(event: Withdrawn): void {
  handleWithdrawnForType(
    event as WithdrawnBase,
    StakingRewardsContractType.STAKING_REWARDS_WITH_PLATFORM_TOKEN,
  )
  getOrCreateStakingRewardsContractWithdrawTransaction(event as WithdrawnBase)
}

export function handleRewardPaid(event: RewardPaid): void {
  handleRewardPaidForType(
    event as RewardPaidBase,
    StakingRewardsContractType.STAKING_REWARDS_WITH_PLATFORM_TOKEN,
  )
  getOrCreateStakingRewardsContractRewardPaidTransaction(event as RewardPaidBase)
}
