import { Address } from '@graphprotocol/graph-ts'
import { address, counters, decimal, metrics, token } from '@mstable/subgraph-utils'

import { SavingsContract as SavingsContractEntity } from '../generated/schema'
import { SavingsContract } from '../generated/templates/SavingsContract/SavingsContract'

export function createSavingsContract(
  addr: Address,
  massetAddress: Address,
): SavingsContractEntity {
  let id = addr.toHexString()
  let savingsContractEntity = SavingsContractEntity.load(id)

  if (savingsContractEntity != null) {
    return savingsContractEntity as SavingsContractEntity
  }

  savingsContractEntity = new SavingsContractEntity(id)

  let contract = SavingsContract.bind(addr)

  let version = 1

  // Try a view that doesn't exist on v1
  let balance = contract.try_balanceOfUnderlying(address.ZERO_ADDRESS)
  if (!balance.reverted) {
    version = 2
  }

  savingsContractEntity.version = version

  if (version == 2) {
    let tokenEntity = token.getOrCreate(addr)
    savingsContractEntity.token = tokenEntity.id
  }

  savingsContractEntity.masset = massetAddress.toHexString()
  savingsContractEntity.automationEnabled = false

  savingsContractEntity.cumulativeDeposited = metrics.getOrCreate(addr, 'cumulativeDeposited').id
  savingsContractEntity.cumulativeWithdrawn = metrics.getOrCreate(addr, 'cumulativeWithdrawn').id
  savingsContractEntity.totalCredits = metrics.getOrCreate(addr, 'totalCredits').id
  savingsContractEntity.totalSavings = metrics.getOrCreate(addr, 'totalSavings').id
  savingsContractEntity.utilisationRate = metrics.getOrCreate(addr, 'utilisationRate').id
  savingsContractEntity.dailyAPY = decimal.ZERO

  savingsContractEntity.totalDeposits = counters.getOrCreate(addr, 'totalDeposits').id
  savingsContractEntity.totalWithdrawals = counters.getOrCreate(addr, 'totalWithdrawals').id

  savingsContractEntity.save()

  return savingsContractEntity as SavingsContractEntity
}
