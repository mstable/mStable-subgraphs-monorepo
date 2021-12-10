import { Address, BigInt } from '@graphprotocol/graph-ts'
import { integer } from '@mstable/subgraph-utils'

import { EmissionsController as EmissionsControllerContract } from '../../generated/EmissionsController/EmissionsController'
import { Voter } from '../../generated/schema'
import { DialVotesForEpochModel } from './DialVotesForEpochModel'
import { EpochModel } from './EpochModel'

export namespace VoterModel {
  export function getId(emissionsControllerAddress: Address, voterAddress: Address): string {
    return emissionsControllerAddress.toHexString() + '.' + voterAddress.toHexString()
  }

  export function getEmptyEntity(
    emissionsControllerAddress: Address,
    voterAddress: Address,
  ): Voter {
    return new Voter(getId(emissionsControllerAddress, voterAddress))
  }

  export function getOrCreate(emissionsControllerAddress: Address, voterAddress: Address): Voter {
    let id = getId(emissionsControllerAddress, voterAddress)
    let voter = Voter.load(id)

    if (voter != null) {
      return voter as Voter
    }

    voter = new Voter(id)
    voter.address = voterAddress
    voter.emissionsController = emissionsControllerAddress.toHexString()
    voter.votesCast = integer.ZERO
    voter.lastSourcePoke = integer.ZERO

    return voter as Voter
  }

  export function updateSourcesPoked(
    emissionsControllerAddress: Address,
    voterAddress: Address,
    timestamp: BigInt,
  ): void {
    let voter = getOrCreate(emissionsControllerAddress, voterAddress)
    voter.lastSourcePoke = timestamp
    voter.save()
  }

  export function updateLastEpoch(
    emissionsControllerAddress: Address,
    voterAddress: Address,
  ): void {
    let contract = EmissionsControllerContract.bind(emissionsControllerAddress)
    let epochs = contract.epochs()
    let weekNumber = epochs.value1

    let voter = getEmptyEntity(emissionsControllerAddress, voterAddress)
    voter.lastEpoch = EpochModel.getId(emissionsControllerAddress, weekNumber)
    voter.save()
  }

  export function updateVotesCast(
    emissionsControllerAddress: Address,
    voterAddress: Address,
  ): void {
    let contract = EmissionsControllerContract.bind(emissionsControllerAddress)
    let preferencesStruct = contract.voterPreferences(voterAddress)

    let voter = getOrCreate(emissionsControllerAddress, voterAddress)
    voter.votesCast = preferencesStruct.value0
    voter.lastSourcePoke = preferencesStruct.value1
    voter.save()
  }

  export function updateVotePreferences(
    emissionsControllerAddress: Address,
    voterAddress: Address,
  ): void {
    let contract = EmissionsControllerContract.bind(emissionsControllerAddress)
    let epochs = contract.epochs()
    let weekNumber = epochs.value1

    let preferencesStruct = contract.voterPreferences(voterAddress)
    let preferencesArr = contract.getVoterPreferences(voterAddress)

    let voter = getEmptyEntity(emissionsControllerAddress, voterAddress)
    voter.votesCast = preferencesStruct.value0
    voter.lastSourcePoke = preferencesStruct.value1
    voter.save()

    for (let i = 0; i < preferencesArr.length; i++) {
      let dialId = preferencesArr[i].dialId
      DialVotesForEpochModel.updateVotes(emissionsControllerAddress, dialId, weekNumber)
    }

    EpochModel.updateTotalVotes(emissionsControllerAddress, weekNumber)
  }

  export function incrementVotesCast(
    emissionsControllerAddress: Address,
    voterAddress: Address,
    amount: BigInt,
  ): void {
    let voter = getOrCreate(emissionsControllerAddress, voterAddress)
    voter.votesCast = voter.votesCast.plus(amount)
    voter.save()
  }

  export function removeVotesCast(
    emissionsControllerAddress: Address,
    voterAddress: Address,
    amount: BigInt,
  ): void {
    let voter = getOrCreate(emissionsControllerAddress, voterAddress)
    voter.votesCast = voter.votesCast.minus(amount)
    voter.save()
  }
}
