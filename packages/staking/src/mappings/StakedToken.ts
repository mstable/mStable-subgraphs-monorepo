import { address, integer, token } from '@mstable/subgraph-utils'
import { Transfer as ERC20Transfer } from '@mstable/subgraph-utils/generated/Empty/ERC20'

import {
  Cooldown,
  CooldownExited,
  QuestAdded,
  QuestComplete,
  QuestExpired,
  QuestSeasonEnded,
  Recollateralised,
  SlashRateChanged,
  Staked,
  Transfer,
  Withdraw,
} from '../../generated/StakedTokenMTA/StakedToken'

import { StakedTokenAccount } from '../StakedTokenAccount'
import { StakedToken } from '../StakedToken'
import { Quest } from '../Quest'
import { CompletedQuest } from '../CompletedQuest'

export function handleTransfer(event: Transfer): void {
  token.handleTransfer(event as ERC20Transfer)
}

export function handleStaked(event: Staked): void {
  StakedToken.updateByAddress(event.address)
  StakedTokenAccount.update(event.params.user, event.address)

  if (event.params.delegatee.notEqual(address.ZERO_ADDRESS)) {
    StakedTokenAccount.update(event.params.delegatee, event.address)
  }
}

export function handleWithdraw(event: Withdraw): void {
  StakedToken.updateByAddress(event.address)
  StakedTokenAccount.update(event.params.user, event.address)
}

export function handleCooldown(event: Cooldown): void {
  StakedToken.updateByAddress(event.address)
  StakedTokenAccount.update(event.params.user, event.address)
}

export function handleCooldownExited(event: CooldownExited): void {
  StakedToken.updateByAddress(event.address)
  StakedTokenAccount.update(event.params.user, event.address)
}

export function handleSlashRateChanged(event: SlashRateChanged): void {
  StakedToken.updateByAddress(event.address)
}

export function handleRecollateralised(event: Recollateralised): void {
  StakedToken.updateByAddress(event.address)
}

export function handleQuestAdded(event: QuestAdded): void {
  Quest.getOrCreate(event.params.id, event.address)
}

export function handleQuestExpired(event: QuestExpired): void {
  Quest.updateById(integer.fromNumber(event.params.id), event.address)
}

export function handleQuestComplete(event: QuestComplete): void {
  let accountEntity = StakedTokenAccount.update(event.params.user, event.address)
  CompletedQuest.complete(accountEntity, event.params.id, event.block.timestamp)
}

export function handleQuestSeasonEnded(event: QuestSeasonEnded): void {
  StakedToken.updateByAddress(event.address)
}
