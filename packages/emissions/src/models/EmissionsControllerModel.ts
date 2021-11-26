import { Address } from '@graphprotocol/graph-ts'
import { token } from '@mstable/subgraph-utils'

import { EmissionsController as EmissionsControllerContract } from '../../generated/EmissionsController/EmissionsController'
import { EmissionsController } from '../../generated/schema'
import { EpochModel } from './EpochModel'

export namespace EmissionsControllerModel {
  export function getId(emissionsControllerAddress: Address): string {
    return emissionsControllerAddress.toHexString()
  }

  export function getEmptyEntity(emissionsControllerAddress: Address) {
    return new EmissionsController(getId(emissionsControllerAddress))
  }

  export function getOrCreate(emissionsControllerAddress: Address): EmissionsController {
    let id = getId(emissionsControllerAddress)

    let emissionsController = EmissionsController.load(id)

    if (emissionsController != null) {
      return emissionsController as EmissionsController
    }

    let contract = EmissionsControllerContract.bind(emissionsControllerAddress)

    emissionsController = new EmissionsController(id)

    emissionsController.address = emissionsControllerAddress
    emissionsController.rewardToken = token.getOrCreate(contract.REWARD_TOKEN()).id

    // This will always have at least one item
    let epochs = contract.epochs()
    emissionsController.startEpoch = EpochModel.getOrCreate(
      emissionsControllerAddress,
      epochs[0].startEpoch,
    ).id
    emissionsController.lastEpoch = EpochModel.getOrCreate(
      emissionsControllerAddress,
      epochs[0].lastEpoch,
    ).id

    emissionsController.save()

    return emissionsController as EmissionsController
  }

  export function updateLastEpoch(emissionsControllerAddress: Address): void {
    let emissionsController = getOrCreate(emissionsControllerAddress)

    let contract = EmissionsControllerContract.bind(emissionsControllerAddress)
    let epochs = contract.epochs()

    let lastEpoch = EpochModel.getOrCreate(emissionsControllerAddress, epochs.value1)

    emissionsController.lastEpoch = lastEpoch.id
    emissionsController.save()
  }

  export function addStakingContract(
    emissionsControllerAddress: Address,
    stakingContract: Address,
  ): void {
    let emissionsController = getOrCreate(emissionsControllerAddress)
    emissionsController.stakingContracts.push(stakingContract) // TODO test me
    emissionsController.save()
  }
}
