import { Address, log } from '@graphprotocol/graph-ts'

import { getOrCreateStakingReward } from '../../models/StakingReward'
import { StakingRewardsContractType, StakingRewardType } from '../../enums'
import {
  getOrCreateStakingRewardsContract,
  getTotalRewards,
  isWithPlatformToken,
} from '../../models/StakingRewardsContract'
import {
  RewardPaid,
  Staked,
  StakingRewards,
  Withdrawn,
} from '../../../generated/templates/StakingRewards/StakingRewards'
import { StakingRewardsWithPlatformToken } from '../../../generated/templates/StakingRewardsWithPlatformToken/StakingRewardsWithPlatformToken'
import { decreaseStakingBalance, increaseStakingBalance } from '../../models/StakingBalance'

function updateStakingRewards(contractAddress: Address, type: StakingRewardsContractType): void {
  let contract = StakingRewards.bind(contractAddress)

  let stakingRewards = getOrCreateStakingRewardsContract(contractAddress, type)

  let rewardRate = contract.rewardRate()

  let duration = stakingRewards.duration

  stakingRewards.lastUpdateTime = contract.lastUpdateTime().toI32()
  stakingRewards.periodFinish = contract.periodFinish().toI32()

  stakingRewards.rewardRate = rewardRate
  stakingRewards.rewardPerTokenStored = contract.rewardPerTokenStored()
  stakingRewards.totalStakingRewards = getTotalRewards(rewardRate, duration)
  stakingRewards.totalSupply = contract.totalSupply()

  if (isWithPlatformToken(type)) {
    let contract = StakingRewardsWithPlatformToken.bind(contractAddress)

    let platformRewardRate = contract.platformRewardRate()

    stakingRewards.platformRewardRate = platformRewardRate
    stakingRewards.platformRewardPerTokenStored = contract.platformRewardPerTokenStored()
    stakingRewards.totalPlatformRewards = getTotalRewards(platformRewardRate, duration)
  }

  stakingRewards.save()
}

function updateUserRewards(
  contractAddress: Address,
  type: StakingRewardsContractType,
  user: Address,
): void {
  {
    let contract = StakingRewards.bind(contractAddress)

    let reward = getOrCreateStakingReward(contractAddress, user, StakingRewardType.REWARD)
    reward.amount = contract.rewards(user)

    let userRewardPerTokenPaid = contract.userRewardPerTokenPaid(user)
    let rewardPerTokenStored = contract.rewardPerTokenStored()

    // `userRewardPerTokenPaid` sometimes seemingly returns stale results;
    // use whichever value is higher.
    // (No Math.max in AssemblyScript)
    reward.amountPerTokenPaid = userRewardPerTokenPaid.gt(rewardPerTokenStored)
      ? userRewardPerTokenPaid
      : rewardPerTokenStored

    reward.save()
  }

  if (isWithPlatformToken(type)) {
    let contract = StakingRewardsWithPlatformToken.bind(contractAddress)

    let reward = getOrCreateStakingReward(contractAddress, user, StakingRewardType.PLATFORM_REWARD)
    reward.amount = contract.platformRewards(user)
    reward.amountPerTokenPaid = contract.userPlatformRewardPerTokenPaid(user)
    reward.save()
  }
}

export function handleStakedForType(event: Staked, type: StakingRewardsContractType): void {
  updateStakingRewards(event.address, type)
  updateUserRewards(event.address, type, event.params.user)
  increaseStakingBalance(event.address, event.params.user, event.params.amount)
}

export function handleRewardAddedForType(
  contractAddress: Address,
  type: StakingRewardsContractType,
): void {
  updateStakingRewards(contractAddress, type)
}

export function handleWithdrawnForType(event: Withdrawn, type: StakingRewardsContractType): void {
  updateStakingRewards(event.address, type)
  updateUserRewards(event.address, type, event.params.user)
  decreaseStakingBalance(event.address, event.params.user, event.params.amount)
}

export function handleRewardPaidForType(event: RewardPaid, type: StakingRewardsContractType): void {
  updateStakingRewards(event.address, type)
  updateUserRewards(event.address, type, event.params.user)
}
