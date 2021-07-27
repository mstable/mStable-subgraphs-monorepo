import { Address, BigInt } from '@graphprotocol/graph-ts'

import { StakingReward } from '../../generated/schema'
import { mapStakingRewardType, StakingRewardType } from '../enums'

export function getOrCreateStakingReward(
  contractAddress: Address,
  account: Address,
  type: StakingRewardType,
): StakingReward {
  let id: string =
    contractAddress.toHexString() + account.toHexString() + type.toString()

  let stakingReward = StakingReward.load(id)

  if (stakingReward != null) {
    return stakingReward as StakingReward
  }

  stakingReward = new StakingReward(id)
  stakingReward.stakingRewardsContract = contractAddress.toHexString()
  stakingReward.account = account
  stakingReward.type = mapStakingRewardType(type)
  stakingReward.amount = BigInt.fromI32(0)
  stakingReward.amountPerTokenPaid = BigInt.fromI32(0)

  stakingReward.save()

  return stakingReward as StakingReward
}
