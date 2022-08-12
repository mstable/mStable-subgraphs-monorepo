import { Address, BigInt } from '@graphprotocol/graph-ts'
import { integer } from '@mstable/subgraph-utils'

import {
  QuestAdded,
  QuestExpired,
  QuestSeasonEnded,
  QuestMaster,
  QuestSigner,
  QuestCompleteQuests,
  QuestCompleteUsers,
} from '../../generated/QuestManager/QuestManager'

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

export function handleQuestCompleteQuests(event: QuestCompleteQuests): void {
  let ids = event.params.ids
  let accountEntity = Account.updateQuestBalance(event.params.user, event.address)

  for (let i = 0; i < ids.length; i++) {
    let questId = ids[i] as BigInt
    CompletedQuest.complete(accountEntity, questId, event.block.timestamp)
  }
}

export function handleQuestCompleteUsers(event: QuestCompleteUsers): void {
  let accounts = event.params.accounts

  for (let i = 0; i < accounts.length; i++) {
    let accountId = accounts[i] as Address
    let accountEntity = Account.updateQuestBalance(accountId, event.address)
    CompletedQuest.complete(accountEntity, event.params.questId, event.block.timestamp)
  }
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
