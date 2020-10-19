import { transaction } from '@mstable/subgraph-utils'

import {
  StakingRewardsContractClaimRewardTransaction as StakingRewardsContractClaimRewardTransactionEntity,
  StakingRewardsContractStakeTransaction as StakingRewardsContractStakeTransactionEntity,
  StakingRewardsContractWithdrawTransaction as StakingRewardsContractWithdrawTransactionEntity,
} from './../../generated/schema'
import {
  RewardPaid,
  Staked,
  Withdrawn,
} from '../../generated/templates/StakingRewards/StakingRewards'

export function getOrCreateStakingRewardsContractWithdrawTransaction(
  event: Withdrawn,
): StakingRewardsContractWithdrawTransactionEntity {
  let baseTx = transaction.fromEvent(event)
  let txEntity = new StakingRewardsContractWithdrawTransactionEntity(baseTx.id)
  txEntity.hash = baseTx.hash
  txEntity.block = baseTx.block
  txEntity.timestamp = baseTx.timestamp

  txEntity.sender = event.params.user
  txEntity.amount = event.params.amount
  txEntity.stakingRewardsContract = event.address.toHexString()

  txEntity.save()

  return txEntity as StakingRewardsContractWithdrawTransactionEntity
}

export function getOrCreateStakingRewardsContractRewardPaidTransaction(
  event: RewardPaid,
): StakingRewardsContractClaimRewardTransactionEntity {
  let baseTx = transaction.fromEvent(event)
  let txEntity = new StakingRewardsContractWithdrawTransactionEntity(baseTx.id)
  txEntity.hash = baseTx.hash
  txEntity.block = baseTx.block
  txEntity.timestamp = baseTx.timestamp

  txEntity.sender = event.params.user
  txEntity.amount = event.params.reward
  txEntity.stakingRewardsContract = event.address.toHexString()

  txEntity.save()

  return txEntity as StakingRewardsContractClaimRewardTransactionEntity
}

export function getOrCreateStakingRewardsContractStakeTransaction(
  event: Staked,
): StakingRewardsContractStakeTransactionEntity {
  let baseTx = transaction.fromEvent(event)
  let txEntity = new StakingRewardsContractWithdrawTransactionEntity(baseTx.id)
  txEntity.hash = baseTx.hash
  txEntity.block = baseTx.block
  txEntity.timestamp = baseTx.timestamp

  txEntity.amount = event.params.amount
  txEntity.stakingRewardsContract = event.address.toHexString()

  txEntity.save()

  return txEntity as StakingRewardsContractStakeTransactionEntity
}
