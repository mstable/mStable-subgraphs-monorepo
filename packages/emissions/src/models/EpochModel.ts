import { Address, BigInt } from '@graphprotocol/graph-ts'
import { integer } from '@mstable/subgraph-utils'

import { EmissionsController as EmissionsControllerContract } from '../../generated/EmissionsController/EmissionsController'
import { Epoch } from '../../generated/schema'

export namespace EpochModel {
  export function getId(emissionsControllerAddress: Address, weekNumber: BigInt): string {
    return emissionsControllerAddress.toHexString() + '.' + weekNumber.toString()
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
    let topLineEmission = contract.try_topLineEmission(weekNumber)
    if (topLineEmission.reverted) {
      return
    }

    let epoch = getEmptyEntity(emissionsControllerAddress, weekNumber)
    epoch.emission = topLineEmission.value
    epoch.save()
  }
}
