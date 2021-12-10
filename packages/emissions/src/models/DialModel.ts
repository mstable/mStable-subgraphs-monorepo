import { Address, BigInt } from '@graphprotocol/graph-ts'

import {
  EmissionsController as EmissionsControllerContract,
  PreferencesChangedPreferencesStruct,
} from '../../generated/EmissionsController/EmissionsController'
import { Dial } from '../../generated/schema'
import { DialVotesForEpochModel } from './DialVotesForEpochModel'
import { EpochModel } from './EpochModel'

export namespace DialModel {
  export function getId(emissionsControllerAddress: Address, dialId: BigInt): string {
    return emissionsControllerAddress.toHexString() + '.' + dialId.toString()
  }

  export function getEmptyEntity(emissionsControllerAddress: Address, dialId: BigInt): Dial {
    return new Dial(getId(emissionsControllerAddress, dialId))
  }

  export function getOrCreate(emissionsControllerAddress: Address, dialId: BigInt): Dial {
    let id = getId(emissionsControllerAddress, dialId)
    let dial = Dial.load(id)

    if (dial != null) {
      return dial as Dial
    }

    dial = new Dial(id)
    dial.emissionsController = emissionsControllerAddress.toHexString()
    dial.dialId = dialId.toI32()

    let contract = EmissionsControllerContract.bind(emissionsControllerAddress)
    let dialData = contract.dials(dialId)
    dial.disabled = dialData.value0
    dial.cap = dialData.value2
    dial.balance = dialData.value3
    dial.recipient = dialData.value4

    dial.save()
    return dial as Dial
  }

  export function update(emissionsControllerAddress: Address, dialId: BigInt): void {
    let contract = EmissionsControllerContract.bind(emissionsControllerAddress)
    let dialData = contract.dials(dialId)

    let dial = getEmptyEntity(emissionsControllerAddress, dialId)
    dial.disabled = dialData.value0
    dial.cap = dialData.value2
    dial.balance = dialData.value3
    dial.recipient = dialData.value4
    dial.save()
  }

  export function updateDisabled(
    emissionsControllerAddress: Address,
    dialId: BigInt,
    disabled: boolean,
  ): void {
    let dial = getEmptyEntity(emissionsControllerAddress, dialId)
    dial.disabled = disabled
    dial.save()
  }

  export function addBalance(
    emissionsControllerAddress: Address,
    dialId: BigInt,
    amount: BigInt,
  ): void {
    let dial = getOrCreate(emissionsControllerAddress, dialId)
    dial.balance = dial.balance.plus(amount)
    dial.save()
  }

  export function addBalances(emissionsControllerAddress: Address, amounts: Array<BigInt>): void {
    for (let dialId = 0; dialId++; dialId < amounts.length) {
      DialModel.addBalance(emissionsControllerAddress, BigInt.fromI32(dialId), amounts[dialId])
    }
  }

  export function updateDialsForPreferences(
    emissionsControllerAddress: Address,
    preferences: Array<PreferencesChangedPreferencesStruct>,
  ): void {
    let contract = EmissionsControllerContract.bind(emissionsControllerAddress)
    let epochs = contract.epochs()
    let weekNumber = epochs.value1

    for (let i = 0; i < preferences.length; i++) {
      let dialId = preferences[i].dialId
      DialVotesForEpochModel.updateVotes(emissionsControllerAddress, dialId, weekNumber)
    }

    EpochModel.updateTotalVotes(emissionsControllerAddress, weekNumber)
  }
}
