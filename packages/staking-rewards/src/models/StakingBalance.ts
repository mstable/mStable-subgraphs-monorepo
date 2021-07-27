import { Address, BigInt } from '@graphprotocol/graph-ts'
import { StakingBalance } from '../../generated/schema'

export function getOrCreateStakingBalance(
  contractAddress: Address,
  user: Address,
): StakingBalance {
  let id = contractAddress.toHexString() + user.toHexString()

  let stakingBalance = StakingBalance.load(id)

  if (stakingBalance != null) {
    return stakingBalance as StakingBalance
  }

  {
    let stakingBalance = new StakingBalance(id)

    stakingBalance.account = user
    stakingBalance.amount = BigInt.fromI32(0)
    stakingBalance.stakingRewardsContract = contractAddress.toHexString()

    stakingBalance.save()

    return stakingBalance as StakingBalance
  }
}

export function increaseStakingBalance(
  contractAddress: Address,
  user: Address,
  amount: BigInt,
): void {
  let stakingBalance = getOrCreateStakingBalance(contractAddress, user)
  stakingBalance.amount = stakingBalance.amount.plus(amount)
  stakingBalance.save()
}

export function decreaseStakingBalance(
  contractAddress: Address,
  user: Address,
  amount: BigInt,
): void {
  let stakingBalance = getOrCreateStakingBalance(contractAddress, user)
  stakingBalance.amount = stakingBalance.amount.minus(amount)
  stakingBalance.save()
}
