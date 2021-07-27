import { Address, BigInt } from '@graphprotocol/graph-ts'
import { metrics, transaction } from '@mstable/subgraph-utils'

import {
  Staked,
  RewardAdded,
  RewardPaid,
  Withdrawn,
  Poked,
} from '../../generated/templates/FeederPool/BoostedSavingsVault'
import {
  RewardAdded as RewardAddedDual,
  RewardPaid as RewardPaidDual,
} from '../../generated/templates/FeederPool/BoostedDualVault'
import {
  BoostedSavingsVault as BoostedSavingsVaultEntity,
  BoostedSavingsVaultRewardPaidTransaction,
  BoostedSavingsVaultRewardAddedTransaction,
  BoostedSavingsVaultStakeTransaction,
  BoostedSavingsVaultWithdrawTransaction,
} from '../../generated/schema'

import { BoostedSavingsVault } from '../BoostedSavingsVault'
import { BoostedSavingsVaultAccount } from '../BoostedSavingsVaultAccount'
import { FeederPoolAccount } from '../FeederPoolAccount'

export function handleStaked(event: Staked): void {
  let boostedSavingsVaultEntity = handleEvent(
    event.address,
    event.block.timestamp,
    event.params.user,
  )

  {
    let baseTx = transaction.fromEvent(event)
    let txEntity = new BoostedSavingsVaultStakeTransaction(baseTx.id)
    txEntity.hash = baseTx.hash
    txEntity.timestamp = baseTx.timestamp
    txEntity.block = baseTx.block
    txEntity.account = BoostedSavingsVaultAccount.getId(
      boostedSavingsVaultEntity,
      event.params.user,
    )
    txEntity.amount = event.params.amount
    txEntity.sender = event.params.payer
    txEntity.boostedSavingsVault = event.address.toHexString()
    txEntity.save()
  }
}

export function handleRewardAdded(event: RewardAdded): void {
  handleEvent(event.address, event.block.timestamp, null)

  {
    let baseTx = transaction.fromEvent(event)
    let txEntity = new BoostedSavingsVaultRewardAddedTransaction(baseTx.id)
    txEntity.hash = baseTx.hash
    txEntity.timestamp = baseTx.timestamp
    txEntity.block = baseTx.block
    txEntity.sender = event.transaction.from
    txEntity.amount = event.params.reward
    txEntity.boostedSavingsVault = event.address.toHexString()
    txEntity.save()
  }
}

export function handleRewardPaid(event: RewardPaid): void {
  let boostedSavingsVaultEntity = handleEvent(
    event.address,
    event.block.timestamp,
    event.params.user,
  )

  {
    let baseTx = transaction.fromEvent(event)
    let txEntity = new BoostedSavingsVaultRewardPaidTransaction(baseTx.id)
    txEntity.hash = baseTx.hash
    txEntity.timestamp = baseTx.timestamp
    txEntity.block = baseTx.block
    txEntity.account = BoostedSavingsVaultAccount.getId(
      boostedSavingsVaultEntity,
      event.params.user,
    )
    txEntity.amount = event.params.reward
    txEntity.sender = event.params.user
    txEntity.boostedSavingsVault = event.address.toHexString()
    txEntity.save()

    let cumulativeClaimed = boostedSavingsVaultEntity.id
      .concat('.')
      .concat(event.params.user.toHexString())
      .concat('.')
      .concat('cumulativeClaimed')
    metrics.incrementById(cumulativeClaimed, event.params.reward)
  }
}

export function handleWithdrawn(event: Withdrawn): void {
  let boostedSavingsVaultEntity = handleEvent(
    event.address,
    event.block.timestamp,
    event.params.user,
  )

  {
    let baseTx = transaction.fromEvent(event)
    let txEntity = new BoostedSavingsVaultWithdrawTransaction(baseTx.id)
    txEntity.hash = baseTx.hash
    txEntity.timestamp = baseTx.timestamp
    txEntity.block = baseTx.block
    txEntity.account = BoostedSavingsVaultAccount.getId(
      boostedSavingsVaultEntity,
      event.params.user,
    )
    txEntity.amount = event.params.amount
    txEntity.sender = event.params.user
    txEntity.boostedSavingsVault = event.address.toHexString()
    txEntity.save()
  }
}

export function handlePoked(event: Poked): void {
  // Update the boostedBalance of the poked user
  handleEvent(event.address, event.block.timestamp, event.params.user)
}

export function handleRewardAddedDual(event: RewardAddedDual): void {
  handleEvent(event.address, event.block.timestamp, null)

  {
    let baseTx = transaction.fromEvent(event)
    let txEntity = new BoostedSavingsVaultRewardAddedTransaction(baseTx.id)
    txEntity.hash = baseTx.hash
    txEntity.timestamp = baseTx.timestamp
    txEntity.block = baseTx.block
    txEntity.sender = event.transaction.from
    txEntity.amount = event.params.reward
    txEntity.platformAmount = event.params.platformReward
    txEntity.boostedSavingsVault = event.address.toHexString()
    txEntity.save()
  }
}

export function handleRewardPaidDual(event: RewardPaidDual): void {
  let boostedSavingsVaultEntity = handleEvent(
    event.address,
    event.block.timestamp,
    event.params.user,
  )

  {
    let baseTx = transaction.fromEvent(event)
    let txEntity = new BoostedSavingsVaultRewardPaidTransaction(baseTx.id)
    txEntity.hash = baseTx.hash
    txEntity.timestamp = baseTx.timestamp
    txEntity.block = baseTx.block
    txEntity.account = BoostedSavingsVaultAccount.getId(
      boostedSavingsVaultEntity,
      event.params.user,
    )
    txEntity.amount = event.params.reward
    txEntity.platformAmount = event.params.platformReward
    txEntity.sender = event.params.user
    txEntity.boostedSavingsVault = event.address.toHexString()
    txEntity.save()

    let cumulativeClaimed = boostedSavingsVaultEntity.id
      .concat('.')
      .concat(event.params.user.toHexString())
      .concat('.')
      .concat('cumulativeClaimed')
    metrics.incrementById(cumulativeClaimed, event.params.reward)

    let cumulativePlatformClaimed = boostedSavingsVaultEntity.id
      .concat('.')
      .concat(event.params.user.toHexString())
      .concat('.')
      .concat('cumulativePlatformClaimed')
    metrics.incrementById(cumulativePlatformClaimed, event.params.platformReward)
  }
}

function handleEvent(
  boostedSavingsVaultAddress: Address,
  timestamp: BigInt,
  account: Address | null,
): BoostedSavingsVaultEntity {
  let boostedSavingsVaultEntity = BoostedSavingsVault.getOrCreate(boostedSavingsVaultAddress)
  boostedSavingsVaultEntity = BoostedSavingsVault.update(boostedSavingsVaultEntity)
  boostedSavingsVaultEntity.save()

  if (account != null) {
    let accountEntity = BoostedSavingsVaultAccount.getOrCreate(
      boostedSavingsVaultEntity,
      account as Address,
    )
    accountEntity = BoostedSavingsVaultAccount.update(accountEntity, boostedSavingsVaultEntity)
    accountEntity.save()

    if (boostedSavingsVaultEntity.feederPool != null) {
      let poolAddress = Address.fromString(boostedSavingsVaultEntity.feederPool)
      FeederPoolAccount.updateVault(
        poolAddress,
        boostedSavingsVaultAddress,
        account as Address,
        timestamp,
      )
    }
  }

  return boostedSavingsVaultEntity
}
