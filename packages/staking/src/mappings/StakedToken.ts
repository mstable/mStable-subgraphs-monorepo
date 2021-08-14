import { address, token } from '@mstable/subgraph-utils'
import { Transfer as ERC20Transfer } from '@mstable/subgraph-utils/generated/Empty/ERC20'

import {
  Staked,
  Withdraw,
  Cooldown,
  CooldownExited,
  SlashRateChanged,
  Recollateralised,
  Transfer,
} from '../../generated/StakedToken/StakedToken'

import { Account } from '../Account'
import { StakedToken } from '../StakedToken'

export function handleTransfer(event: Transfer): void {
  token.handleTransfer(event as ERC20Transfer)
}

export function handleStaked(event: Staked): void {
  StakedToken.updateByAddress(event.address)
  Account.updateByAddress(event.params.user)

  if (event.params.delegatee.notEqual(address.ZERO_ADDRESS)) {
    Account.updateByAddress(event.params.delegatee)
  }
}

export function handleWithdraw(event: Withdraw): void {
  StakedToken.updateByAddress(event.address)
  Account.updateByAddress(event.params.user)
}

export function handleCooldown(event: Cooldown): void {
  StakedToken.updateByAddress(event.address)
  Account.updateByAddress(event.params.user)
}

export function handleCooldownExited(event: CooldownExited): void {
  StakedToken.updateByAddress(event.address)
  Account.updateByAddress(event.params.user)
}

export function handleSlashRateChanged(event: SlashRateChanged): void {
  StakedToken.updateByAddress(event.address)
}

export function handleRecollateralised(event: Recollateralised): void {
  StakedToken.updateByAddress(event.address)
}
