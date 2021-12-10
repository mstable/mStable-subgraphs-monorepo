import { Address, BigInt } from '@graphprotocol/graph-ts'
import { integer } from '@mstable/subgraph-utils'

import { EmissionsController as EmissionsControllerContract } from '../../generated/EmissionsController/EmissionsController'
import { Epoch } from '../../generated/schema'
import { EmissionsControllerModel } from './EmissionsControllerModel'

export namespace EpochModel {
  export function getId(emissionsControllerAddress: Address, weekNumber: BigInt): string {
    return emissionsControllerAddress.toHexString() + '.' + weekNumber.toString()
  }

  export function getWeekNumberFromId(id: string): BigInt {
    let weekNumberStr = id.split('.')[1]
    return BigInt.fromString(weekNumberStr)
  }

  export function getEmptyEntity(emissionsControllerAddress: Address, weekNumber: BigInt): Epoch {
    return new Epoch(getId(emissionsControllerAddress, weekNumber))
  }

  export function getOrCreate(emissionsControllerAddress: Address, weekNumber: BigInt): Epoch {
    let id = getId(emissionsControllerAddress, weekNumber)

    let epoch = Epoch.load(id)

    if (epoch != null) {
      return epoch as Epoch
    }

    epoch = new Epoch(id)
    epoch.weekNumber = weekNumber.toI32()
    epoch.emission = integer.ZERO
    epoch.totalVotes = integer.ZERO
    epoch.emissionsController = emissionsControllerAddress.toHexString()

    epoch.save()

    updateTopLineEmission(emissionsControllerAddress, weekNumber)

    return epoch as Epoch
  }

  export function updateTopLineEmission(
    emissionsControllerAddress: Address,
    weekNumber: BigInt,
  ): void {
    let contract = EmissionsControllerContract.bind(emissionsControllerAddress)
    let topLineEmission = contract.try_topLineEmission(weekNumber.plus(BigInt.fromI32(1)))
    if (topLineEmission.reverted) {
      return
    }

    let epoch = getEmptyEntity(emissionsControllerAddress, weekNumber)
    epoch.emission = topLineEmission.value
    epoch.save()
  }

  export function updateTotalVotes(emissionsControllerAddress: Address, weekNumber: BigInt): void {
    let contract = EmissionsControllerContract.bind(emissionsControllerAddress)

    let totalVotes = integer.ZERO
    for (let i = 0; i <= 16; i++) {
      let dialId = BigInt.fromI32(i)
      let voteHistory = contract.try_getDialVoteHistory(dialId)
      if (!voteHistory.reverted) {
        let vh = voteHistory.value
        let votes = vh[vh.length - 1].votes
        totalVotes = totalVotes.plus(votes)
      }
    }

    let epoch = getEmptyEntity(emissionsControllerAddress, weekNumber)
    epoch.totalVotes = totalVotes
    epoch.save()
  }
}
