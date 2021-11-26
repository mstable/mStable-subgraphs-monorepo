import { Address, BigInt } from '@graphprotocol/graph-ts'
import { integer } from '@mstable/subgraph-utils'

import { Voter } from '../../generated/schema'

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
    voter.lastSourcePoke = integer.ZERO

    return voter as Voter
  }

  export function updateSourcesPoked(
    emissionsControllerAddress: Address,
    voterAddress: Address,
    timestamp: BigInt,
  ): void {
    let voter = getEmptyEntity(emissionsControllerAddress, voterAddress)
    voter.lastSourcePoke = timestamp
    voter.save()
  }
}
