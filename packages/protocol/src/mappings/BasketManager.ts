import {
  BasketWeightsUpdated,
  BassetAdded,
  BassetStatusChanged,
  BassetRemoved,
} from '../../generated/LegacyMasset/BasketManager'
import { Basset as BassetEntity } from '../../generated/schema'
import { updateBasketLegacy } from '../Basket'

export function handleBassetAdded(event: BassetAdded): void {
  updateBasketLegacy(event.address)

  let bassetEntity = new BassetEntity(event.params.bAsset.toHexString())
  bassetEntity.removed = false
  bassetEntity.save()
}

export function handleBassetRemoved(event: BassetRemoved): void {
  updateBasketLegacy(event.address)

  let bassetEntity = new BassetEntity(event.params.bAsset.toHexString())
  bassetEntity.removed = true
  bassetEntity.save()
}

export function handleBasketWeightsUpdated(event: BasketWeightsUpdated): void {
  updateBasketLegacy(event.address)
}

export function handleBassetStatusChanged(event: BassetStatusChanged): void {
  updateBasketLegacy(event.address)
}

export function handleBasketStatusChanged(event: BassetStatusChanged): void {
  updateBasketLegacy(event.address)
}
