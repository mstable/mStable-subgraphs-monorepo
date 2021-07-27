import {
  RewardAdded,
  RewardPaid,
  Staked,
  Withdrawn,
} from '../../../generated/templates/StakingRewards/StakingRewards'
import { StakingRewardsContractType } from '../../enums'
import {
  handleRewardAddedForType,
  handleStakedForType,
  handleRewardPaidForType,
  handleWithdrawnForType,
} from './shared'
import {
  getOrCreateStakingRewardsContractRewardPaidTransaction,
  getOrCreateStakingRewardsContractWithdrawTransaction,
  getOrCreateStakingRewardsContractStakeTransaction,
} from '../../models/Transaction'

export function handleRewardAdded(event: RewardAdded): void {
  handleRewardAddedForType(
    event.address,
    StakingRewardsContractType.STAKING_REWARDS,
  )
}

export function handleStaked(event: Staked): void {
  handleStakedForType(event, StakingRewardsContractType.STAKING_REWARDS)
  getOrCreateStakingRewardsContractStakeTransaction(event)
}

export function handleWithdrawn(event: Withdrawn): void {
  handleWithdrawnForType(event, StakingRewardsContractType.STAKING_REWARDS)
  getOrCreateStakingRewardsContractWithdrawTransaction(event)
}

export function handleRewardPaid(event: RewardPaid): void {
  handleRewardPaidForType(event, StakingRewardsContractType.STAKING_REWARDS)
  getOrCreateStakingRewardsContractRewardPaidTransaction(event)
}
