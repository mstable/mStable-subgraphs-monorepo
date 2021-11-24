import { BigInt } from '@graphprotocol/graph-ts'

import { EmissionsController as EmissionsControllerContract } from '../../generated/EmissionsController/EmissionsController'
import { Dial, EmissionsController } from '../../generated/schema'

export namespace DialModel {
  export function getOrCreate(emissionsController: EmissionsController, dialId: BigInt): Dial {
    let id = emissionsController.id + '.' + dialId.toString()

    let dial = Dial.load(id)

    if (dial != null) {
      return dial as Dial
    }

    let contract = EmissionsControllerContract.bind(emissionsController.address)

    dial = new Dial(id)
    dial.emissionsController = emissionsController.id
    dial.dialId = dialId

    let dialData = contract.dials(dialId)
    dial.disabled = dialData.value0
    dial.cap = dialData.value2
    dial.balance = dialData.value3
    dial.recipient = dialData.value4

    dial.save()
    return dial as Dial
  }

  export function updateDisabled(
    emissionsController: EmissionsController,
    dialId: BigInt,
    disabled: boolean,
  ): void {
    let dial = getOrCreate(emissionsController, dialId)
    dial.disabled = disabled
    dial.save()
  }
}
