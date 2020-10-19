import {
  BasketWeightsUpdated,
  BassetAdded,
  BassetStatusChanged,
  BassetRemoved,
} from '../../generated/mUSD/BasketManager'

import { updateBasket } from '../Basket'

export function handleBassetAdded(event: BassetAdded): void {
  updateBasket(event.address)
}

export function handleBassetRemoved(event: BassetRemoved): void {
  updateBasket(event.address)
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
