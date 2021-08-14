import { Address, BigInt } from '@graphprotocol/graph-ts'

import { CompletedQuest as CompletedQuestEntity } from '../generated/schema'

export namespace CompletedQuest {
  function getId(account: Address, numericId: BigInt): string {
    return account.toHexString() + '.' + numericId.toString()
  }

  export function complete(
    account: Address,
    numericId: BigInt,
    timestamp: BigInt,
  ): CompletedQuestEntity {
    let id = getId(account, numericId)

    let entity = CompletedQuestEntity.load(id)
    if (entity != null) {
      return entity as CompletedQuestEntity
    }

    entity = new CompletedQuestEntity(id)
    entity.account = account.toHexString()
    entity.quest = numericId.toString()
    entity.completedAt = timestamp.toI32()
    entity.save()

    return entity as CompletedQuestEntity
  }
}
