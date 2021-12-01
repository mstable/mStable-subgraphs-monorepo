import { Address, BigInt } from '@graphprotocol/graph-ts'

import { Dial, Preference, Voter } from '../../generated/schema'
import { PreferencesChangedPreferencesStruct } from '../../generated/EmissionsController/EmissionsController'
import { DialModel } from './DialModel'
import { VoterModel } from './VoterModel'

export namespace PreferenceModel {
  export function getId(dial: Dial, voter: Voter): string {
    return voter.id + '.' + dial.id
  }

  export function getEmptyEntity(dial: Dial, voter: Voter): Preference {
    return new Preference(getId(dial, voter))
  }

  export function getOrCreate(dial: Dial, voter: Voter): Preference {
    let id = getId(dial, voter)

    let preference = Preference.load(id)

    if (preference != null) {
      return preference as Preference
    }

    preference = new Preference(id)
    preference.voter = voter.id
    preference.dial = dial.id
    preference.weight = 0

    preference.save()

    return preference as Preference
  }

  export function updateForVoter(
    emissionsControllerAddress: Address,
    voterAddress: Address,
    preferences: Array<PreferencesChangedPreferencesStruct>,
  ): void {
    let voter = VoterModel.getOrCreate(emissionsControllerAddress, voterAddress)

    for (let i = 0; i < preferences.length; i++) {
      let dialId = preferences[i].dialId
      let weight = preferences[i].weight

      let dial = DialModel.getEmptyEntity(emissionsControllerAddress, BigInt.fromI32(dialId))
      let preference = getOrCreate(dial, voter)
      preference.weight = weight
      preference.save()
    }
  }

  export function incrementVotesCast(
    emissionsControllerAddress: Address,
    voterAddress: Address,
    amount: BigInt,
  ): void {
    let voter = VoterModel.getOrCreate(emissionsControllerAddress, voterAddress)
    voter.votesCast = voter.votesCast.plus(amount)
    voter.save()
  }

  export function removeVotesCast(
    emissionsControllerAddress: Address,
    voterAddress: Address,
    amount: BigInt,
  ): void {
    let voter = VoterModel.getOrCreate(emissionsControllerAddress, voterAddress)
    voter.votesCast = voter.votesCast.minus(amount)
    voter.save()
  }
}
