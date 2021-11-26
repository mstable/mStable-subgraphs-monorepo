import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts'
import { integer } from '@mstable/subgraph-utils'

import { EmissionsController as EmissionsControllerContract } from '../../generated/EmissionsController/EmissionsController'
import { DialVotesForEpoch } from '../../generated/schema'

import { DialModel } from './DialModel'
import { EpochModel } from './EpochModel'

export namespace DialVotesForEpochModel {
  export function getId(
    emissionsControllerAddress: Address,
    dialId: BigInt,
    weekNumber: BigInt,
  ): string {
    return (
      DialModel.getId(emissionsControllerAddress, dialId) +
      '.' +
      EpochModel.getId(emissionsControllerAddress, weekNumber)
    )
  }

  export function getEmptyEntity(
    emissionsControllerAddress: Address,
    dialId: BigInt,
    weekNumber: BigInt,
  ): DialVotesForEpoch {
    return new DialVotesForEpoch(getId(emissionsControllerAddress, dialId, weekNumber))
  }

  export function getOrCreate(
    emissionsControllerAddress: Address,
    dialId: BigInt,
    weekNumber: BigInt,
  ): DialVotesForEpoch {
    let id = getId(emissionsControllerAddress, dialId, weekNumber)

    let dvfe = DialVotesForEpoch.load(id)

    if (dvfe != null) {
      return dvfe as DialVotesForEpoch
    }

    dvfe = new DialVotesForEpoch(id)
    dvfe.dial = DialModel.getId(emissionsControllerAddress, dialId)
    dvfe.epoch = EpochModel.getId(emissionsControllerAddress, weekNumber)
    dvfe.votes = integer.ZERO

    dvfe.save()

    return dvfe as DialVotesForEpoch
  }

  export function addVotes(
    emissionsControllerAddress: Address,
    dialId: BigInt,
    weekNumber: BigInt,
    votes: BigInt,
  ): void {
    let dvfe = getOrCreate(emissionsControllerAddress, dialId, weekNumber)
    dvfe.votes = dvfe.votes.plus(votes)
    dvfe.save()
  }

  export function updateVotes(
    emissionsControllerAddress: Address,
    dialId: BigInt,
    weekNumber: BigInt,
  ): void {
    let contract = EmissionsControllerContract.bind(emissionsControllerAddress)

    let dvfe = getEmptyEntity(emissionsControllerAddress, dialId, weekNumber)
    let data = contract.dials(dialId)
    let dataMap = data.toMap()
    if (dataMap.isSet('voteHistory')) {
      let voteHistoryArr = dataMap.get('voteHistory').toArray()
      let voteHistory = ethereum.Value.fromArray(voteHistoryArr)
    }
    dvfe.votes = voteHistory
    dvfe.save()
  }
}
