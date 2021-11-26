import { Address, BigInt } from '@graphprotocol/graph-ts'
import { integer } from '@mstable/subgraph-utils'

import { Epoch } from '../../generated/schema'

export namespace EpochModel {
  export function getId(emissionsControllerAddress: Address, weekNumber: BigInt): string {
    return emissionsControllerAddress + '.' + weekNumber.toString()
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
    epoch.weekNumber = weekNumber
    epoch.totalVotes = integer.ZERO
    epoch.emission = integer.ZERO
    epoch.emissionsController = emissionsControllerAddress.toHexString()

    epoch.save()

    return epoch as Epoch
  }
}
