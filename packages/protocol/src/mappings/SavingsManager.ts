import { metrics } from '@mstable/subgraph-utils'

import { SavingsContract as SavingsContractTemplate } from '../../generated/templates'
import {
  SavingsContractAdded,
  SavingsRateChanged,
} from '../../generated/SavingsManager/SavingsManager'

import { getOrCreateMasset } from '../Masset'
import { createSavingsContract } from '../SavingsContract'

export function handleSavingsContractAdded(event: SavingsContractAdded): void {
  let massetAddress = event.params.mAsset
  let savingsContractAddress = event.params.savingsContract

  // Start tracking savings contract events
  SavingsContractTemplate.create(savingsContractAddress)

  // Create the savings contract entity
  createSavingsContract(savingsContractAddress, massetAddress)

  // Create the masset if it doesn't exist already
  getOrCreateMasset(massetAddress)

  // Create the shared savingsRate
  metrics.getOrCreate(event.address, 'savingsRate')
}

export function handleSavingsRateChanged(event: SavingsRateChanged): void {
  metrics.update(event.address, 'savingsRate', event.params.newSavingsRate)
}
