import { integer } from '@mstable/subgraph-utils'

import {
  QuestAdded,
  QuestComplete,
  QuestExpired,
  QuestSeasonEnded,
  QuestMaster,
  QuestSigner,
} from '../../generated/QuestManager'

import { StakedTokenAccount } from '../StakedTokenAccount'
import { Quest } from '../Quest'
import { CompletedQuest } from '../CompletedQuest'
import { Account } from '../Account'
import { QuestManager } from '../QuestManager'

export function handleQuestAdded(event: QuestAdded): void {
  Quest.getOrCreate(event.params.id, event.address)
}

export function handleQuestExpired(event: QuestExpired): void {
  Quest.updateById(integer.fromNumber(event.params.id), event.address)
}

export function handleQuestComplete(event: QuestComplete): void {
  Account.update(event.params.user, event.address)
  let accountEntity = StakedTokenAccount.update(event.params.user, event.address)
  CompletedQuest.complete(accountEntity, event.params.id, event.block.timestamp)
}

export function handleQuestSeasonEnded(event: QuestSeasonEnded): void {
  QuestManager.updateSeasons(event.address)
}

export function handleQuestMaster(event: QuestMaster): void {
  QuestManager.updateQuestMaster(event.address, event.params.newQuestMaster)
}

export function handleQuestSigner(event: QuestSigner): void {
  QuestManager.updateQuestSigner(event.address, event.params.newQuestSigner)
}
