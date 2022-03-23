import { Address, BigInt, store } from '@graphprotocol/graph-ts'
import { integer } from '@mstable/subgraph-utils'

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
    preference.weight = integer.ZERO

    preference.save()

    return preference as Preference
  }

  export function updatePreferences(
    emissionsControllerAddress: Address,
    voterAddress: Address,
    preferences: Array<PreferencesChangedPreferencesStruct>,
  ): void {
    let voter = VoterModel.getOrCreate(emissionsControllerAddress, voterAddress)

    // Iterate over all possible dials; we don't know what has been set
    let limit = BigInt.fromI32(255)
    for (
      let dialId = BigInt.fromI32(0);
      dialId.lt(limit);
      dialId = dialId.plus(BigInt.fromI32(1))
    ) {
      let dial = Dial.load(DialModel.getId(emissionsControllerAddress, dialId))
      if (dial == null) {
        // If the dial doesn't exist, we're done iterating
        break
      }

      // Find the dial in preferences (if it was set)
      let found = false
      for (let i = 0; i < preferences.length; i++) {
        if (preferences[i].dialId.equals(dialId)) {
          found = true
          let weight = preferences[i].weight
          let preference = getOrCreate(dial as Dial, voter)
          preference.weight = weight
          preference.save()
          break
        }
      }

      // Delete any existing Preference for this Dial that wasn't in preferences
      if (!found) {
        store.remove('Preference', getId(dial as Dial, voter))
      }
    }
  }
}
