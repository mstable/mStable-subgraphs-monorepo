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
  _handleStaked(event, false)
}

export function handleStakedDual(event: Staked): void {
  _handleStaked(event, true)
}

function _handleStaked(event: Staked, isDualVault: boolean): void {
  let boostedSavingsVaultEntity = handleEvent(
    event.address,
    event.block.timestamp,
    event.params.user,
    isDualVault,
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
  handleEvent(event.address, event.block.timestamp, null, false)

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
    false,
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
  _handleWithdrawn(event, false)
}

export function handleWithdrawnDual(event: Withdrawn): void {
  _handleWithdrawn(event, true)
}

function _handleWithdrawn(event: Withdrawn, isDualVault: boolean): void {
  let boostedSavingsVaultEntity = handleEvent(
    event.address,
    event.block.timestamp,
    event.params.user,
    isDualVault,
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
  _handlePoked(event, false)
}

export function handlePokedDual(event: Poked): void {
  _handlePoked(event, true)
}

function _handlePoked(event: Poked, isDualVault: boolean): void {
  // Update the boostedBalance of the poked user
  handleEvent(event.address, event.block.timestamp, event.params.user, isDualVault)
}

export function handleRewardAddedDual(event: RewardAddedDual): void {
  handleEvent(event.address, event.block.timestamp, null, true)

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
    true,
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
  isDualVault: boolean,
): BoostedSavingsVaultEntity {
  let boostedSavingsVaultEntity = BoostedSavingsVault.getOrCreate(
    boostedSavingsVaultAddress,
    isDualVault,
  )
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
