import { Address } from '@graphprotocol/graph-ts'
import { metrics } from '@mstable/subgraph-utils'

import { SavingsContract as SavingsContractTemplate } from '../../generated/templates'
import {
  SavingsContractAdded,
  SavingsContractUpdated,
  SavingsRateChanged,
  LiquidatorDeposited,
  InterestCollected,
  InterestDistributed,
  StreamsFrozen,
} from '../../generated/SavingsManager/SavingsManager'
import {
  SavingsManager as SavingsManagerEntity,
  SavingsContract as SavingsContractEntity,
  Masset as MassetEntity,
} from '../../generated/schema'

import { getOrCreateMasset } from '../Masset'
import { getOrCreateSavingsContract } from '../SavingsContract'
import { SAVINGS_MANAGER_ID } from '../constants'

function addSavingsContract(massetAddress: Address, savingsContractAddress: Address): void {
  let savingsContractEntity = SavingsContractEntity.load(savingsContractAddress.toHexString())

  if (savingsContractEntity == null) {
    // If the entity doesn't exist (i.e. it wasn't pre-released), track events
    SavingsContractTemplate.create(savingsContractAddress)
  }

  // Create the savings contract and mark it as active
  savingsContractEntity = getOrCreateSavingsContract(savingsContractAddress, massetAddress)
  savingsContractEntity.active = true
  savingsContractEntity.save()

  // Set the savings contract as active on the Masset
  let massetEntity = new MassetEntity(massetAddress.toHexString())
  massetEntity.currentSavingsContract = savingsContractEntity.id
  massetEntity.save()
}

export function handleSavingsContractAdded(event: SavingsContractAdded): void {
  // Ensure the SavingsManager entity is created, because this should be the first
  // event from the contract
  createSavingsManager(event.address)

  // Create the masset if it doesn't exist already
  getOrCreateMasset(event.params.mAsset)

  addSavingsContract(event.params.mAsset, event.params.savingsContract)
}

export function handleSavingsContractUpdated(event: SavingsContractUpdated): void {
  addSavingsContract(event.params.mAsset, event.params.savingsContract)
}

export function handleSavingsRateChanged(event: SavingsRateChanged): void {
  metrics.update(event.address, 'savingsRate', event.params.newSavingsRate)
}

export function handleStreamsFrozen(event: StreamsFrozen): void {
  let savingsManagerEntity = new SavingsManagerEntity(event.address.toHexString())
  savingsManagerEntity.streamsFrozen = true
  savingsManagerEntity.save()
}

export function handleLiquidatorDeposited(event: LiquidatorDeposited): void {
  metrics.increment(event.params.mAsset, 'cumulativeLiquidatorDeposited', event.params.amount)
}

export function handleInterestCollected(event: InterestCollected): void {
  metrics.increment(event.params.mAsset, 'cumulativeInterestCollected', event.params.interest)
}

export function handleInterestDistributed(event: InterestDistributed): void {
  metrics.increment(event.params.mAsset, 'cumulativeInterestDistributed', event.params.amountSent)
}

function createSavingsManager(address: Address): SavingsManagerEntity {
  let savingsManagerEntity = SavingsManagerEntity.load(SAVINGS_MANAGER_ID)

  if (savingsManagerEntity != null) {
    return savingsManagerEntity as SavingsManagerEntity
  }

  savingsManagerEntity = new SavingsManagerEntity(SAVINGS_MANAGER_ID)
  savingsManagerEntity.address = address
  savingsManagerEntity.streamsFrozen = false
  savingsManagerEntity.savingsRate = metrics.getOrCreate(address, 'savingsRate').id
  savingsManagerEntity.save()

  return savingsManagerEntity as SavingsManagerEntity
}
