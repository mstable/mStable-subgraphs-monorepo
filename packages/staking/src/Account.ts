import { Address } from '@graphprotocol/graph-ts'
import { integer } from '@mstable/subgraph-utils'

import { Account as Entity } from '../generated/schema'
import { StakedToken } from './StakedToken'
import { StakedTokenBalance } from './StakedTokenBalance'
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
    entity.totalVotes = integer.ZERO
    entity.save()

    return entity as Entity
  }

  export function update(account: Address, stakedTokenAddress: Address): Entity {
    let entity = getOrCreate(account)
    let stakedToken = StakedToken.getContract(stakedTokenAddress)
    let stakedTokenEntity = StakedToken.getOrCreate(stakedTokenAddress)
    let stakedTokenBalance = StakedTokenBalance.getOrCreate(account, stakedTokenAddress)

    let votesPrev = stakedTokenBalance.votes
    let votes = stakedToken.getVotes(account)

    // Assumes stakedTokenBalance has not been updated yet
    entity.totalVotes = entity.totalVotes.minus(votesPrev).plus(votes)

    let questManager = QuestManager.bind(Address.fromString(stakedTokenEntity.questManager))
    let questBalance = questManager.balanceData(account)
    entity.lastAction = questBalance.lastAction.toI32()
    entity.permMultiplier = questBalance.permMultiplier
    entity.seasonMultiplier = questBalance.seasonMultiplier

    entity.save()
    return entity
  }
}
