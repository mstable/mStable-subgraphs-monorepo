import { Address } from '@graphprotocol/graph-ts'
import { integer } from '@mstable/subgraph-utils'

import { Dial, Preference, Voter } from '../../generated/schema'
import { PreferencesChanged__Params } from '../../generated/EmissionsController/EmissionsController'
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
    preference.weight = integer.ZERO

    preference.save()

    return preference as Preference
  }

  export function updateForVoter(
    emissionsControllerAddress: Address,
    voterAddress: Address,
    preferences: PreferencesChanged__Params['preferences'],
  ): void {
    let voter = VoterModel.getOrCreate(emissionsControllerAddress, voterAddress)

    for (let i = 0; i < preferences.length; i++) {
      let dialId = preferences[i].dialId
      let weight = preferences[i].weight

      let dial = DialModel.getEmptyEntity(emissionsControllerAddress, dialId)
      let preference = getOrCreate(dial, voter)
      preference.weight = weight
      preference.save()
    }
  }
}
