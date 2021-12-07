import { Address, BigInt, Bytes } from '@graphprotocol/graph-ts'
import { address, token } from '@mstable/subgraph-utils'

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
    emissionsController.highestDialId = 0

    let stakingContracts = [] as Bytes[]

    {
      let stakingContract0 = contract.stakingContracts(BigInt.fromI32(0))
      if (!stakingContract0.equals(address.ZERO_ADDRESS)) {
        stakingContracts.push(stakingContract0)
      }
      let stakingContract1 = contract.stakingContracts(BigInt.fromI32(1))
      if (!stakingContract1.equals(address.ZERO_ADDRESS)) {
        stakingContracts.push(stakingContract1)
      }
    }

    emissionsController.stakingContracts = stakingContracts as Bytes[]

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

  export function updateHighestDial(emissionsControllerAddress: Address, dialId: BigInt): void {
    let emissionsController = getOrCreate(emissionsControllerAddress)

    let dialIdI32 = dialId.toI32()
    if (emissionsController.highestDialId < dialIdI32) {
      emissionsController.highestDialId = dialIdI32
      emissionsController.save()
    }
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
