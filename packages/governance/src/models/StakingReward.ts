import { Address, BigInt } from '@graphprotocol/graph-ts'

import { StakingReward } from '../../generated/schema'
import { IncentivisedVotingLockup as IncentivisedVotingLockupContract } from '../../generated/IncentivisedVotingLockup/IncentivisedVotingLockup'

export function getOrCreateStakingReward(
  address: Address,
  account: Address,
): StakingReward {
  let id: string = address.toHexString() + account.toHexString()

  let entity = StakingReward.load(id)

  if (entity != null) {
    return entity as StakingReward
  }

  entity = new StakingReward(id)
  entity.incentivisedVotingLockup = address.toHexString()
  entity.account = account
  entity.amount = BigInt.fromI32(0)
  entity.rewardsPaid = BigInt.fromI32(0)
  entity.amountPerTokenPaid = BigInt.fromI32(0)

  entity.save()

  return entity as StakingReward
}

export function updateStakingReward(
  address: Address,
  account: Address,
): StakingReward {
  {
    let contract = IncentivisedVotingLockupContract.bind(address)

    let entity = getOrCreateStakingReward(address, account)

    entity.amount = contract.rewards(account)
    entity.rewardsPaid = contract.rewardsPaid(account)

    let userRewardPerTokenPaid = contract.userRewardPerTokenPaid(account)
    let rewardPerTokenStored = contract.rewardPerTokenStored()

    // `userRewardPerTokenPaid` sometimes seemingly returns stale results;
    // use whichever value is higher.
    // (No Math.max in AssemblyScript)
    entity.amountPerTokenPaid = userRewardPerTokenPaid.gt(rewardPerTokenStored)
      ? userRewardPerTokenPaid
      : rewardPerTokenStored

    entity.save()

    return entity
  }
}
