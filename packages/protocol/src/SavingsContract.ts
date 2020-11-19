import { Address } from '@graphprotocol/graph-ts'
import { counters, decimal, metrics } from '@mstable/subgraph-utils'

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

  savingsContractEntity.cumulativeDeposited = metrics.getOrCreate(address, 'cumulativeDeposited').id
  savingsContractEntity.cumulativeWithdrawn = metrics.getOrCreate(address, 'cumulativeWithdrawn').id
  savingsContractEntity.totalCredits = metrics.getOrCreate(address, 'totalCredits').id
  savingsContractEntity.totalSavings = metrics.getOrCreate(address, 'totalSavings').id
  savingsContractEntity.utilisationRate = metrics.getOrCreate(address, 'utilisationRate').id
  savingsContractEntity.dailyAPY = decimal.ZERO

  savingsContractEntity.totalDeposits = counters.getOrCreate(address, 'totalDeposits').id
  savingsContractEntity.totalWithdrawals = counters.getOrCreate(address, 'totalWithdrawals').id

  savingsContractEntity.save()

  return savingsContractEntity as SavingsContractEntity
}
