import { address, token } from '@mstable/subgraph-utils'
import { Transfer as ERC20Transfer } from '@mstable/subgraph-utils/generated/Empty/ERC20'

import {
  Cooldown,
  CooldownExited,
  DelegateChanged,
  DelegateVotesChanged,
  Recollateralised,
  RewardAdded,
  RewardPaid,
  SlashRateChanged,
  Staked,
  Transfer,
  Withdraw,
} from '../../generated/StakedTokenMTA/StakedTokenMTA'
import {
  BalClaimed,
  FeesConverted,
  PriceCoefficientUpdated,
} from '../../generated/StakedTokenBPT/StakedTokenBPT'

import { StakedTokenAccount } from '../StakedTokenAccount'
import { StakedToken } from '../StakedToken'
import { Account } from '../Account'
import { StakingRewards } from '../StakingRewards'
import { Transactions } from '../Transactions'

export function handleTransfer(event: Transfer): void {
  token.handleTransfer(event as ERC20Transfer)
}

export function handleStaked(event: Staked): void {
  StakedToken.updateByAddress(event.address)
  Account.update(event.params.user, event.address)
  StakedTokenAccount.update(event.params.user, event.address)

  if (event.params.delegatee.notEqual(address.ZERO_ADDRESS)) {
    StakedTokenAccount.update(event.params.delegatee, event.address)
  }
}

export function handleWithdraw(event: Withdraw): void {
  StakedToken.updateByAddress(event.address)
  Account.update(event.params.user, event.address)
  StakedTokenAccount.update(event.params.user, event.address)
}

export function handleCooldown(event: Cooldown): void {
  StakedToken.updateByAddress(event.address)
  Account.update(event.params.user, event.address)
  StakedTokenAccount.update(event.params.user, event.address)
}

export function handleCooldownExited(event: CooldownExited): void {
  StakedToken.updateByAddress(event.address)
  Account.update(event.params.user, event.address)
  StakedTokenAccount.update(event.params.user, event.address)
}
export function handleDelegateChanged(event: DelegateChanged): void {
  StakedToken.updateByAddress(event.address)

  // Could involve duplication, can be optimised:
  Account.update(event.params.fromDelegate, event.address)
  Account.update(event.params.toDelegate, event.address)
  Account.update(event.params.delegator, event.address)
  StakedTokenAccount.update(event.params.fromDelegate, event.address)
  StakedTokenAccount.update(event.params.toDelegate, event.address)
  StakedTokenAccount.update(event.params.delegator, event.address)
}

export function handleSlashRateChanged(event: SlashRateChanged): void {
  StakedToken.updateByAddress(event.address)
}

export function handleRecollateralised(event: Recollateralised): void {
  StakedToken.updateByAddress(event.address)
}

export function handleDelegateVotesChanged(event: DelegateVotesChanged): void {
  Account.update(event.params.delegate, event.address)
  StakedTokenAccount.update(event.params.delegate, event.address)
}

export function handleRewardAdded(event: RewardAdded): void {
  StakingRewards.update(event.address)
}

export function handleRewardPaid(event: RewardPaid): void {
  StakingRewards.update(event.address)
  StakedTokenAccount.update(event.params.user, event.address)
  Transactions.getOrCreateRewardPaid(event)
}

export function handlePriceCoefficientUpdated(event: PriceCoefficientUpdated): void {
  StakedToken.updateByAddress(event.address)
}

export function handleFeesConverted(event: FeesConverted): void {
  StakedToken.updateByAddress(event.address)
}

export function handleBalClaimed(event: BalClaimed): void {
  StakedToken.updateByAddress(event.address)
}
