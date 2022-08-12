import { transaction } from '@mstable/subgraph-utils'

import { RewardPaid } from '../generated/StakedTokenMTA/StakedTokenMTA'
import { RewardPaidTransaction } from '../generated/schema'

export namespace Transactions {
  export function getOrCreateRewardPaid(event: RewardPaid): RewardPaidTransaction {
    let baseTx = transaction.fromEvent(event)
    let txEntity = new RewardPaidTransaction(baseTx.id)
    txEntity.hash = baseTx.hash
    txEntity.block = baseTx.block
    txEntity.timestamp = baseTx.timestamp

    txEntity.sender = event.params.user
    txEntity.amount = event.params.reward
    txEntity.stakingRewards = event.address.toHexString()

    txEntity.save()

    return txEntity as RewardPaidTransaction
  }
}
