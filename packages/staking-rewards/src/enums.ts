export enum StakingRewardsContractType {
  STAKING_REWARDS,
  STAKING_REWARDS_WITH_PLATFORM_TOKEN,
}

export enum StakingRewardType {
  REWARD,
  PLATFORM_REWARD,
}

export function mapStakingRewardsContractType(type: StakingRewardsContractType): string {
  switch (type) {
    case StakingRewardsContractType.STAKING_REWARDS:
      return 'STAKING_REWARDS'
    case StakingRewardsContractType.STAKING_REWARDS_WITH_PLATFORM_TOKEN:
      return 'STAKING_REWARDS_WITH_PLATFORM_TOKEN'
    default:
      return ''
  }
}

export function mapStakingRewardType(type: StakingRewardType): string {
  switch (type) {
    case StakingRewardType.PLATFORM_REWARD:
      return 'PLATFORM_REWARD'
    case StakingRewardType.REWARD:
      return 'REWARD'
    default:
      return ''
  }
}
