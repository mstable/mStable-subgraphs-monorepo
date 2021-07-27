import { Address } from '@graphprotocol/graph-ts'
import { token } from '@mstable/subgraph-utils'

import { BoostDirector as BoostDirectorContract } from '../generated/BoostDirector/BoostDirector'

import { BoostDirector as BoostDirectorEntity } from '../generated/schema'

export namespace BoostDirector {
  export function get(address: Address): BoostDirectorEntity | null {
    return BoostDirectorEntity.load(address.toHexString())
  }

  export function getOrCreate(address: Address): BoostDirectorEntity {
    let entity = get(address)
    if (entity != null) {
      return entity as BoostDirectorEntity
    }

    let contract = BoostDirectorContract.bind(address)
    let stakingContract = contract.stakingContract()
    token.getOrCreate(stakingContract)

    entity = new BoostDirectorEntity(address.toHexString())
    entity.whitelisted = []
    entity.stakingContract = stakingContract.toHexString()
    entity.save()

    return entity as BoostDirectorEntity
  }
}
