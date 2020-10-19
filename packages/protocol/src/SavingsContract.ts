import { Address } from '@graphprotocol/graph-ts'
import { metrics } from '@mstable/subgraph-utils'

import { SavingsContract as SavingsContractEntity } from '../generated/schema'

export function createSavingsContract(
  address: Address,
  massetAddress: Address,
): SavingsContractEntity {
  let id = address.toHexString()
  let savingsContractEntity = SavingsContractEntity.load(id)

  if (savingsContractEntity != null) {
    return savingsContractEntity as SavingsContractEntity
  }

  savingsContractEntity = new SavingsContractEntity(id)

  savingsContractEntity.masset = massetAddress.toHexString()
  savingsContractEntity.automationEnabled = false

  savingsContractEntity.totalCredits = metrics.getOrCreateMetricForAddress(
    address,
    'totalCredits',
  ).id
  savingsContractEntity.totalDeposited = metrics.getOrCreateMetricForAddress(
    address,
    'totalDeposited',
  ).id
  savingsContractEntity.totalSavings = metrics.getOrCreateMetricForAddress(
    address,
    'totalSavings',
  ).id
  savingsContractEntity.savingsRate = metrics.getOrCreateMetricForAddress(address, 'savingsRate').id
  savingsContractEntity.utilisationRate = metrics.getOrCreateMetricForAddress(
    address,
    'utilisationRate',
  ).id
  savingsContractEntity.dailyAPY = metrics.getOrCreateMetricForAddress(address, 'dailyAPY').id
  savingsContractEntity.totalDeposits = metrics.getOrCreateCounterForAddress(
    address,
    'totalDeposits',
  ).id
  savingsContractEntity.totalWithdrawals = metrics.getOrCreateCounterForAddress(
    address,
    'totalWithdrawals',
  ).id

  savingsContractEntity.save()

  return savingsContractEntity as SavingsContractEntity
}
