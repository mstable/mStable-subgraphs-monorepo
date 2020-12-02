import { Address } from '@graphprotocol/graph-ts'
import { counters, decimal, metrics, token } from '@mstable/subgraph-utils'

import { SavingsContract as SavingsContractEntity } from '../generated/schema'
import { SavingsContract } from '../generated/templates'

export function createSavingsContract(
  address: Address,
  massetAddress: Address,
): SavingsContractEntity {
  let id = address.toHexString()
  let savingsContractEntity = SavingsContractEntity.load(id)
  let savingsContractInstance = SavingsContract.bind(address)
  let version = 1
  let balance = savingsContractInstance.try_balanceOfUnderlying(address)

  if (!balance.reverted) {
    version = 2
  }

  if (savingsContractEntity != null) {
    return savingsContractEntity as SavingsContractEntity
  }

  savingsContractEntity = new SavingsContractEntity(id)

  savingsContractEntity.version = version

  if (version == 2) {
    let tokenEntity = token.getOrCreate(address)
    savingsContractEntity.token = tokenEntity.id
  }

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
