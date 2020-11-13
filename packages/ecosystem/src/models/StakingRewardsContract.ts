import { Address, BigInt } from '@graphprotocol/graph-ts'

import { StakingRewardsContract } from '../../generated/schema'
import { StakingRewards } from '../../generated/templates/StakingRewards/StakingRewards'
import { StakingRewardsWithPlatformToken } from '../../generated/templates/StakingRewardsWithPlatformToken/StakingRewardsWithPlatformToken'
import { mapStakingRewardsContractType, StakingRewardsContractType } from '../enums'

export function getOrCreateStakingRewardsContract(
  address: Address,
  type: StakingRewardsContractType,
): StakingRewardsContract {
  let id = address.toHexString()

  let stakingRewards = StakingRewardsContract.load(id)

  if (stakingRewards != null) {
    return stakingRewards as StakingRewardsContract
  }

  {
    let contract = StakingRewards.bind(address)

    let stakingRewards = new StakingRewardsContract(id)
    let rewardRate = contract.rewardRate()
    let duration = contract.DURATION().toI32()

    stakingRewards.type = mapStakingRewardsContractType(type)
    stakingRewards.duration = duration
    stakingRewards.lastUpdateTime = contract.lastUpdateTime().toI32()
    stakingRewards.periodFinish = contract.periodFinish().toI32()
    stakingRewards.stakingToken = contract.stakingToken().toHexString()
    stakingRewards.rewardRate = rewardRate
    stakingRewards.rewardsDistributor = contract.rewardsDistributor().toHexString()
    stakingRewards.rewardsToken = contract.rewardsToken().toHexString()
    stakingRewards.rewardPerTokenStored = contract.rewardPerTokenStored()
    stakingRewards.totalStakingRewards = getTotalRewards(rewardRate, duration)
    stakingRewards.totalSupply = contract.totalSupply()

    if (isWithPlatformToken(type)) {
      let contract = StakingRewardsWithPlatformToken.bind(address)

      let platformRewardRate = contract.platformRewardRate()

      stakingRewards.platformToken = contract.platformToken().toHexString()
      stakingRewards.platformRewardRate = platformRewardRate
      stakingRewards.platformRewardPerTokenStored = contract.platformRewardPerTokenStored()
      stakingRewards.totalPlatformRewards = getTotalRewards(platformRewardRate, duration)
    }

    stakingRewards.save()
  }

  return stakingRewards as StakingRewardsContract
}

export function getTotalRewards(rewardRate: BigInt, duration: i32): BigInt {
  return rewardRate.times(BigInt.fromI32(duration))
}

export function isWithPlatformToken(type: StakingRewardsContractType): boolean {
  return type == StakingRewardsContractType.STAKING_REWARDS_WITH_PLATFORM_TOKEN
}
