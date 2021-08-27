import { BigInt } from '@graphprotocol/graph-ts'

import { CompletedQuest as CompletedQuestEntity } from '../generated/schema'
import { Account as AccountEntity } from '../generated/schema'

export namespace CompletedQuest {
  function getId(accountId: string, numericId: BigInt): string {
    return accountId + '.' + numericId.toString()
  }

  export function complete(
    accountEntity: AccountEntity,
    numericId: BigInt,
    timestamp: BigInt,
  ): CompletedQuestEntity {
    let id = getId(accountEntity.id, numericId)

    let entity = CompletedQuestEntity.load(id)
    if (entity != null) {
      return entity as CompletedQuestEntity
    }

    entity = new CompletedQuestEntity(id)
    entity.account = accountEntity.id
    entity.quest = numericId.toString()
    entity.completedAt = timestamp.toI32()
    entity.save()

    return entity as CompletedQuestEntity
  }
}
