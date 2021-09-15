import { Address } from '@graphprotocol/graph-ts'
import { integer } from '@mstable/subgraph-utils'

import { Account as Entity } from '../generated/schema'
import { StakedToken } from './StakedToken'
import { QuestManager } from '../generated/QuestManager'

export namespace Account {
  function getId(account: Address): string {
    return account.toHexString()
  }

  export function getOrCreate(account: Address): Entity {
    let id = getId(account)

    let entity = Entity.load(id)
    if (entity != null) {
      return entity as Entity
    }

    entity = new Entity(id)
    entity.totalVotesAll = integer.ZERO
    entity.totalVotesMTA = integer.ZERO
    entity.totalVotesBPT = integer.ZERO
    entity.lastAction = 0
    entity.permMultiplier = 0
    entity.seasonMultiplier = 0
    entity.save()

    return entity as Entity
  }

  export function updateQuestBalance(account: Address, questManagerAddress: Address): Entity {
    let entity = getOrCreate(account)

    let questManager = QuestManager.bind(questManagerAddress)
    let questBalance = questManager.balanceData(account)
    entity.lastAction = questBalance.lastAction.toI32()
    entity.permMultiplier = questBalance.permMultiplier
    entity.seasonMultiplier = questBalance.seasonMultiplier
    entity.save()
    return entity
  }

  export function update(account: Address, stakedTokenAddress: Address): Entity {
    let entity = getOrCreate(account)
    let stakedToken = StakedToken.getContract(stakedTokenAddress)
    let stakedTokenEntity = StakedToken.getOrCreate(stakedTokenAddress)

    let votes = stakedToken.getVotes(account)

    if (stakedTokenEntity.isStakedTokenMTA) {
      entity.totalVotesMTA = votes
    } else {
      entity.totalVotesBPT = votes
    }

    entity.totalVotesAll = entity.totalVotesBPT.plus(entity.totalVotesMTA)

    entity.save()
    return entity
  }
}
