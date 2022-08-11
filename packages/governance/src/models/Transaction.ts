import { transaction } from '@mstable/subgraph-utils'

import {
  ClaimTransaction,
  CreateLockTransaction,
  EjectTransaction,
  IncreaseLockAmountTransaction,
  IncreaseLockTimeTransaction,
  WithdrawTransaction,
} from '../../generated/schema'
import {
  Deposit,
  Ejected,
  RewardPaid,
  Withdraw,
} from '../../generated/IncentivisedVotingLockup/IncentivisedVotingLockup'
import { LockAction } from '../utils'

export function getOrCreateWithdrawTransaction(event: Withdraw): WithdrawTransaction {
  let baseTx = transaction.fromEvent(event)
  let txEntity = new WithdrawTransaction(baseTx.id)
  txEntity.block = baseTx.block
  txEntity.hash = baseTx.hash
  txEntity.timestamp = baseTx.timestamp

  txEntity.sender = event.transaction.from
  txEntity.provider = event.params.provider
  txEntity.value = event.params.value

  txEntity.save()

  return txEntity as WithdrawTransaction
}

export function getOrCreateEjectTransaction(event: Ejected): EjectTransaction {
  let baseTx = transaction.fromEvent(event)
  let txEntity = new EjectTransaction(baseTx.id)
  txEntity.block = baseTx.block
  txEntity.hash = baseTx.hash
  txEntity.timestamp = baseTx.timestamp

  txEntity.sender = event.transaction.from
  txEntity.ejected = event.params.ejected
  txEntity.ejector = event.params.ejector

  txEntity.save()

  return txEntity as EjectTransaction
}

export function getOrCreateClaimTransaction(event: RewardPaid): ClaimTransaction {
  let baseTx = transaction.fromEvent(event)
  let txEntity = new ClaimTransaction(baseTx.id)
  txEntity.block = baseTx.block
  txEntity.hash = baseTx.hash
  txEntity.timestamp = baseTx.timestamp

  txEntity.sender = event.transaction.from
  txEntity.user = event.params.user
  txEntity.reward = event.params.reward

  txEntity.save()

  return txEntity as ClaimTransaction
}

export function handleDepositTransaction(event: Deposit): void {
  switch (event.params.action as LockAction) {
    case LockAction.CREATE_LOCK: {
      getOrCreateCreateLockTransaction(event)
      return
    }
    case LockAction.INCREASE_LOCK_AMOUNT: {
      getOrCreateIncreaseLockAmountTransaction(event)
      return
    }

    case LockAction.INCREASE_LOCK_TIME: {
      getOrCreateIncreaseLockTimeTransaction(event)
      return
    }
  }
}

export function getOrCreateCreateLockTransaction(event: Deposit): CreateLockTransaction {
  let baseTx = transaction.fromEvent(event)
  let txEntity = new CreateLockTransaction(baseTx.id)
  txEntity.block = baseTx.block
  txEntity.hash = baseTx.hash
  txEntity.timestamp = baseTx.timestamp

  txEntity.sender = event.transaction.from
  txEntity.provider = event.params.provider
  txEntity.value = event.params.value
  txEntity.lockTime = event.params.locktime

  txEntity.save()

  return txEntity as CreateLockTransaction
}

export function getOrCreateIncreaseLockAmountTransaction(
  event: Deposit,
): IncreaseLockAmountTransaction {
  let baseTx = transaction.fromEvent(event)
  let txEntity = new IncreaseLockAmountTransaction(baseTx.id)
  txEntity.block = baseTx.block
  txEntity.hash = baseTx.hash
  txEntity.timestamp = baseTx.timestamp

  txEntity.sender = event.transaction.from

  txEntity.provider = event.params.provider
  txEntity.value = event.params.value

  txEntity.save()

  return txEntity as IncreaseLockAmountTransaction
}

export function getOrCreateIncreaseLockTimeTransaction(
  event: Deposit,
): IncreaseLockTimeTransaction {
  let baseTx = transaction.fromEvent(event)
  let txEntity = new IncreaseLockTimeTransaction(baseTx.id)
  txEntity.block = baseTx.block
  txEntity.hash = baseTx.hash
  txEntity.timestamp = baseTx.timestamp

  txEntity.sender = event.transaction.from
  txEntity.provider = event.params.provider
  txEntity.lockTime = event.params.locktime

  txEntity.save()

  return txEntity as IncreaseLockTimeTransaction
}
