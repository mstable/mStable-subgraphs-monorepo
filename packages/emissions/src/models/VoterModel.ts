import { Address } from '@graphprotocol/graph-ts'

import { EmissionsController as EmissionsControllerContract } from '../../generated/EmissionsController/EmissionsController'
import { Voter } from '../../generated/schema'

export namespace VoterModel {
  export function getOrCreate(address: Address): Voter {
    let id = address.toHexString()

    let entity = Voter.load(id)

    if (entity != null) {
      return entity as Voter
    }

    entity = new Voter(id)
    entity.save()
    return entity as Voter
  }
}
