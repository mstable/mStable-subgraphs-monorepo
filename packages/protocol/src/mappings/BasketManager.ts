import {
  BasketWeightsUpdated,
  BassetAdded,
  BassetStatusChanged,
  BassetRemoved,
} from '../../generated/mUSD/BasketManager'
import { Basset as BassetEntity } from '../../generated/schema'
import { updateBasket } from '../Basket'

export function handleBassetAdded(event: BassetAdded): void {
  updateBasket(event.address)

  let bassetEntity = new BassetEntity(event.params.bAsset.toHexString())
  bassetEntity.removed = false
  bassetEntity.save()
}

export function handleBassetRemoved(event: BassetRemoved): void {
  updateBasket(event.address)

  let bassetEntity = new BassetEntity(event.params.bAsset.toHexString())
  bassetEntity.removed = true
  bassetEntity.save()
}

export function handleBasketWeightsUpdated(event: BasketWeightsUpdated): void {
  updateBasket(event.address)
}

export function handleBassetStatusChanged(event: BassetStatusChanged): void {
  updateBasket(event.address)
}

export function handleBasketStatusChanged(event: BassetStatusChanged): void {
  updateBasket(event.address)
}
