import { Address } from '@graphprotocol/graph-ts'
import { token } from '@mstable/subgraph-utils'

import { EmissionsController as EmissionsControllerContract } from '../../generated/EmissionsController/EmissionsController'
import { EmissionsController, Epoch } from '../../generated/schema'
import { EpochModel } from './EpochModel'

export namespace EmissionsControllerModel {
  export function getId(emissionsControllerAddress: Address): string {
    return emissionsControllerAddress.toHexString()
  }

  export function getEmptyEntity(emissionsControllerAddress: Address): EmissionsController {
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
    emissionsController.stakingContracts = []

    emissionsController.rewardToken = token.getOrCreate(contract.REWARD_TOKEN()).id

    let epochs = contract.epochs()
    emissionsController.startEpoch = EpochModel.getOrCreate(
      emissionsControllerAddress,
      epochs.value0,
    ).id
    emissionsController.lastEpoch = EpochModel.getOrCreate(
      emissionsControllerAddress,
      epochs.value1,
    ).id

    emissionsController.save()

    return emissionsController as EmissionsController
  }

  export function updateLastEpoch(emissionsControllerAddress: Address): Epoch {
    let emissionsController = getOrCreate(emissionsControllerAddress)

    let contract = EmissionsControllerContract.bind(emissionsControllerAddress)
    let epochs = contract.epochs()

    let lastEpoch = EpochModel.getOrCreate(emissionsControllerAddress, epochs.value1)

    emissionsController.lastEpoch = lastEpoch.id
    emissionsController.save()

    return lastEpoch as Epoch
  }

  export function addStakingContract(
    emissionsControllerAddress: Address,
    stakingContract: Address,
  ): void {
    let emissionsController = getOrCreate(emissionsControllerAddress)
    emissionsController.stakingContracts.push(stakingContract)
    emissionsController.save()
  }
}
