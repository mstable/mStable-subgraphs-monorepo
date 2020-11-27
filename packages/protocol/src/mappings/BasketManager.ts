import {
  BasketWeightsUpdated,
  BassetAdded,
  BassetStatusChanged,
  BassetRemoved,
} from '../../generated/mUSD/BasketManager'
import { updateBasket } from '../Basket'
import { store } from '@graphprotocol/graph-ts'

export function handleBassetAdded(event: BassetAdded): void {
  updateBasket(event.address)
}

export function handleBassetRemoved(event: BassetRemoved): void {
  let bAsset = event.params.bAsset
  store.remove('Basset', bAsset)
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
