import { Address } from '@graphprotocol/graph-ts'
import { RewardsDistributor } from '../../generated/schema'

export function getOrCreateRewardsDistributor(
  address: Address,
): RewardsDistributor {
  let id = address.toHexString()
  let entity = RewardsDistributor.load(id)

  if (entity != null) {
    return entity as RewardsDistributor
  }

  entity = new RewardsDistributor(id)
  entity.fundManagers = []

  entity.save()

  return entity as RewardsDistributor
}
