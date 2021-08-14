import {
  QuestAdded,
  QuestExpired,
  QuestComplete,
  QuestSeasonEnded,
} from '../../generated/GamifiedManager/GamifiedManager'

import { Account } from '../Account'
import { CompletedQuest } from '../CompletedQuest'
import { Quest } from '../Quest'
import { StakedToken } from '../StakedToken'
import { integer } from '../../../utils'

export function handleQuestAdded(event: QuestAdded): void {
  Quest.getOrCreate(event.params.id)
}

export function handleQuestExpired(event: QuestExpired): void {
  Quest.updateById(integer.fromNumber(event.params.id))
}

export function handleQuestComplete(event: QuestComplete): void {
  Account.updateByAddress(event.params.user)
  CompletedQuest.complete(event.params.user, event.params.id, event.block.timestamp)
}

export function handleQuestSeasonEnded(event: QuestSeasonEnded): void {
  StakedToken.updateEntity()
}
