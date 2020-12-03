import { Address } from '@graphprotocol/graph-ts'
import {
  Staked,
  RewardAdded,
  RewardPaid,
  Withdrawn,
  BoostedSavingsVault as BoostedSavingsVaultContract,
} from '../../generated/BoostedSavingsVault_mUSD/BoostedSavingsVault'

import { BoostedSavingsVault } from '../BoostedSavingsVault'
import { BoostedSavingsVaultAccount } from '../BoostedSavingsVaultAccount'

export function handleStaked(event: Staked): void {
  handleEvent(event.address, event.params.user)
}

export function handleRewardAdded(event: RewardAdded): void {
  handleEvent(event.address, null)
}

export function handleRewardPaid(event: RewardPaid): void {
  handleEvent(event.address, event.params.user)
}

export function handleWithdrawn(event: Withdrawn): void {
  handleEvent(event.address, event.params.user)
}

function handleEvent(boostedSavingsVaultAddress: Address, account: Address | null): void {
  let boostedSavingsVault = BoostedSavingsVaultContract.bind(boostedSavingsVaultAddress)

  let boostedSavingsVaultEntity = BoostedSavingsVault.getOrCreate(boostedSavingsVaultAddress)
  boostedSavingsVaultEntity = BoostedSavingsVault.update(
    boostedSavingsVaultEntity,
    boostedSavingsVault,
  )
  boostedSavingsVaultEntity.save()

  if (account != null) {
    let accountEntity = BoostedSavingsVaultAccount.getOrCreate(
      boostedSavingsVaultEntity,
      account as Address,
    )
    accountEntity = BoostedSavingsVaultAccount.update(
      accountEntity,
      boostedSavingsVaultEntity,
      boostedSavingsVault,
    )
    accountEntity.save()
  }
}
