import { Address } from '@graphprotocol/graph-ts'

import { EmissionsController as EmissionsControllerContract } from '../../generated/EmissionsController/EmissionsController'
import { Epoch } from '../../generated/schema'

export namespace EpochModel {
  export function getOrCreate(address: Address, weekNumber: number): Epoch {
    let id = address.toHexString() + '.' + weekNumber.toString()

    let entity = Epoch.load(id)

    if (entity != null) {
      return entity as Epoch
    }

    entity = new Epoch(id)
    entity.weekNumber = weekNumber

    entity.save()

    return entity as Epoch
  }
}
