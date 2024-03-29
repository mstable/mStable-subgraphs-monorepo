import { Address, BigInt } from '@graphprotocol/graph-ts'
import { StakingBalance } from '../../generated/schema'
import { StakingRewards } from '../../generated/templates/StakingRewards/StakingRewards'

export function getOrCreateStakingBalance(contractAddress: Address, user: Address): StakingBalance {
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

export function updateStakingBalance(contractAddress: Address, user: Address): void {
  let contract = StakingRewards.bind(contractAddress)
  let stakingBalance = getOrCreateStakingBalance(contractAddress, user)
  stakingBalance.amount = contract.balanceOf(user)
  stakingBalance.save()
}
