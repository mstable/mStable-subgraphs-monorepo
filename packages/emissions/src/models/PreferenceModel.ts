import { Address } from '@graphprotocol/graph-ts'

import { EmissionsController as EmissionsControllerContract } from '../../generated/EmissionsController/EmissionsController'
import { Preference } from '../../generated/schema'

export namespace PreferenceModel {
  export function getOrCreate(address: Address): Preference {
    let id = address.toHexString()

    let entity = Preference.load(id)

    if (entity != null) {
      return entity as Preference
    }

    entity = new Preference(id)
    entity.save()
    return entity as Preference
  }
}
