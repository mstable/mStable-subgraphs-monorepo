import { Address, BigInt } from '@graphprotocol/graph-ts'

import { StakingBalance } from '../../generated/schema'
import { IncentivisedVotingLockup as IncentivisedVotingLockupContract } from '../../generated/IncentivisedVotingLockup/IncentivisedVotingLockup'

export function getOrCreateStakingBalance(
  address: Address,
  account: Address,
): StakingBalance {
  let id = address.toHexString() + account.toHexString()

  let entity = StakingBalance.load(id)

  if (entity != null) {
    return entity as StakingBalance
  }

  {
    let entity = new StakingBalance(id)

    entity.account = account
    entity.amount = BigInt.fromI32(0)
    entity.incentivisedVotingLockup = address.toHexString()

    entity.save()

    return entity as StakingBalance
  }
}

export function updateStakingBalance(
  address: Address,
  account: Address,
): StakingBalance {
  let entity = getOrCreateStakingBalance(address, account)

  let contract = IncentivisedVotingLockupContract.bind(address)

  entity.amount = contract.staticBalanceOf(account)

  entity.save()

  return entity
}
