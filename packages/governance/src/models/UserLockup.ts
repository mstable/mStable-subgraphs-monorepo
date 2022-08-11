import { Address, BigInt } from '@graphprotocol/graph-ts'
import { UserLockup } from '../../generated/schema'
import { decreaseTotalValue } from './IncentivisedVotingLockup'
import {
  IncentivisedVotingLockup as IncentivisedVotingLockupContract,
  Deposit,
  Withdraw,
  Ejected,
} from '../../generated/IncentivisedVotingLockup/IncentivisedVotingLockup'
import { LockAction } from '../utils'

export function getOrCreateUserLockup(
  address: Address,
  account: Address,
): UserLockup {
  let id = address.toHexString() + account.toHexString()

  let entity = UserLockup.load(id)

  if (entity != null) {
    return entity as UserLockup
  }

  {
    let entity = new UserLockup(address.toHexString() + account.toHexString())

    entity.incentivisedVotingLockup = address.toHexString()
    entity.account = account
    entity.value = BigInt.fromI32(0)
    entity.bias = BigInt.fromI32(0)
    entity.lockTime = BigInt.fromI32(0)
    entity.ts = BigInt.fromI32(0)
    entity.slope = BigInt.fromI32(0)
    entity.ejected = false

    entity.save()

    return entity
  }
}

export function depositUserLockup(event: Deposit): UserLockup {
  let userLockup = getOrCreateUserLockup(event.address, event.params.provider)

  let contract = IncentivisedVotingLockupContract.bind(event.address)

  let point = contract.getLastUserPoint(userLockup.account as Address)

  // When increasing the lock amount, the value is added to the previous value
  let newValue =
    event.params.action == LockAction.INCREASE_LOCK_AMOUNT
      ? userLockup.value.plus(event.params.value)
      : event.params.action == LockAction.INCREASE_LOCK_TIME
      ? userLockup.value
      : event.params.value

  userLockup.value = newValue
  userLockup.lockTime = event.params.locktime
  userLockup.slope = point.value1
  userLockup.bias = point.value0
  userLockup.ts = point.value2
  userLockup.ejected = false

  userLockup.save()

  return userLockup
}

export function withdrawUserLockup(event: Withdraw): UserLockup {
  let userLockup = getOrCreateUserLockup(event.address, event.params.provider)

  let contract = IncentivisedVotingLockupContract.bind(event.address)

  let point = contract.getLastUserPoint(userLockup.account as Address)

  userLockup.value = BigInt.fromI32(0)
  userLockup.lockTime = BigInt.fromI32(0)
  userLockup.slope = point.value1
  userLockup.bias = point.value0
  userLockup.ts = point.value2
  userLockup.ejected = false

  userLockup.save()

  return userLockup
}

export function resetUserLockup(event: Ejected): UserLockup {
  let userLockup = getOrCreateUserLockup(event.address, event.params.ejected)

  decreaseTotalValue(event.address, userLockup.value)

  let contract = IncentivisedVotingLockupContract.bind(event.address)

  let point = contract.getLastUserPoint(userLockup.account as Address)

  userLockup.value = BigInt.fromI32(0)
  userLockup.lockTime = BigInt.fromI32(0)
  userLockup.slope = point.value1
  userLockup.bias = point.value0
  userLockup.ts = point.value2
  userLockup.ejected = true
  userLockup.ejectedHash = event.transaction.hash

  userLockup.save()

  return userLockup
}
