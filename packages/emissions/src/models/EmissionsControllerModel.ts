import { Address } from '@graphprotocol/graph-ts'
import { token } from '@mstable/subgraph-utils'

import { EmissionsController as EmissionsControllerContract } from '../../generated/EmissionsController/EmissionsController'
import { EmissionsController, Epoch } from '../../generated/schema'
import { EpochModel } from './EpochModel'

export namespace EmissionsControllerModel {
  export function getOrCreate(address: Address): EmissionsController {
    let id = address.toHexString()

    let entity = EmissionsController.load(id)

    if (entity != null) {
      return entity as EmissionsController
    }

    let contract = EmissionsControllerContract.bind(address)

    entity = new EmissionsController(id)

    entity.address = address
    entity.rewardToken = token.getOrCreate(contract.REWARD_TOKEN()).id

    // This will always have at least one item
    let epochs = contract.epochs()
    entity.startEpoch = EpochModel.getOrCreate(address, epochs[0].startEpoch).id
    entity.lastEpoch = EpochModel.getOrCreate(address, epochs[0].lastEpoch).id

    entity.save()

    return entity as EmissionsController
  }

  export function updateLastEpoch(address: Address, epoch: Epoch): void {
    let entity = getOrCreate(address)
    entity.lastEpoch = epoch.id
    entity.save()
  }
}
