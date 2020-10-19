import { Address, BigInt } from '@graphprotocol/graph-ts'
import { token } from '@mstable/subgraph-utils'

import { IncentivisedVotingLockup } from '../../generated/schema'
import { IncentivisedVotingLockup as IncentivisedVotingLockupContract } from '../../generated/IncentivisedVotingLockup/IncentivisedVotingLockup'

export function getOrCreateIncentivisedVotingLockup(
  address: Address,
): IncentivisedVotingLockup {
  let entity = IncentivisedVotingLockup.load(address.toHexString())

  if (entity != null) {
    return entity as IncentivisedVotingLockup
  }

  {
    let entity = new IncentivisedVotingLockup(address.toHexString())

    let contract = IncentivisedVotingLockupContract.bind(address)


    token.getOrCreate(address)

    entity.votingToken = address.toHexString()

    entity.duration = contract.getDuration()
    entity.periodFinish = contract.periodFinish().toI32()
    entity.lastUpdateTime = contract.lastUpdateTime().toI32()
    entity.rewardPerTokenStored = contract.rewardPerTokenStored()
    entity.rewardRate = contract.rewardRate()

    let stakingTokenAddress = contract.stakingToken()

    // Currently the rewardsToken is assumed to be the same as the staking token
    entity.rewardsToken = stakingTokenAddress.toHexString()
    entity.stakingToken = stakingTokenAddress.toHexString()

    entity.rewardsDistributor = contract.rewardsDistributor().toHexString()
    entity.globalEpoch = contract.globalEpoch()
    entity.end = contract.END()
    entity.expired = contract.expired()
    entity.maxTime = contract.MAXTIME()
    entity.totalStaticWeight = contract.totalStaticWeight()
    entity.totalStakingRewards = entity.rewardRate.times(entity.duration)
    entity.totalValue = BigInt.fromI32(0)

    entity.save()

    return entity
  }
}

export function updateLockupGlobals(
  address: Address,
): IncentivisedVotingLockup {
  let entity = getOrCreateIncentivisedVotingLockup(address)

  let contract = IncentivisedVotingLockupContract.bind(address)

  entity.lastUpdateTime = contract.lastUpdateTime().toI32()
  entity.periodFinish = contract.periodFinish().toI32()
  entity.rewardRate = contract.rewardRate()
  entity.rewardPerTokenStored = contract.rewardPerTokenStored()
  entity.totalStakingRewards = entity.rewardRate.times(entity.duration)
  entity.totalStaticWeight = contract.totalStaticWeight()

  token.getOrCreate(address)

  entity.save()

  return entity
}

export function expireIncentivisedVotingLockup(
  address: Address,
): IncentivisedVotingLockup {
  let incentivisedVotingLockup = getOrCreateIncentivisedVotingLockup(address)

  incentivisedVotingLockup.expired = true

  incentivisedVotingLockup.save()

  return incentivisedVotingLockup
}

export function increaseTotalValue(
  address: Address,
  value: BigInt,
): IncentivisedVotingLockup {
  let entity = getOrCreateIncentivisedVotingLockup(address)

  entity.totalValue = entity.totalValue.plus(value)

  entity.save()

  return entity
}

export function decreaseTotalValue(
  address: Address,
  value: BigInt,
): IncentivisedVotingLockup {
  let entity = getOrCreateIncentivisedVotingLockup(address)

  entity.totalValue = entity.totalValue.minus(value)

  entity.save()

  return entity
}
