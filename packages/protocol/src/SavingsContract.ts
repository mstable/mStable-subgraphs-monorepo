import { Address } from '@graphprotocol/graph-ts'
import { address, counters, decimal, metrics, token } from '@mstable/subgraph-utils'

import { SavingsContract as SavingsContractEntity } from '../generated/schema'
import { SavingsContractV2 } from '../generated/SavingsManager.0x86818a2EACcDC6e1C2d7A301E4Ebb394a3c61b85/SavingsContractV2'

export function getOrCreateSavingsContract(
  addr: Address,
  massetAddress: Address | null,
): SavingsContractEntity {
  let id = addr.toHexString()
  let savingsContractEntity = SavingsContractEntity.load(id)

  if (savingsContractEntity != null) {
    return savingsContractEntity as SavingsContractEntity
  }

  savingsContractEntity = new SavingsContractEntity(id)
  savingsContractEntity.active = false

  let contract = SavingsContractV2.bind(addr)

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

    // Ropsten issue
    if (tokenEntity.id == '0xfd54148380756b2828e38a1f60e545ea11f4dee9') {
      tokenEntity.symbol = 'imUSD'
      tokenEntity.save()
    }
  }

  if (massetAddress != null) {
    savingsContractEntity.masset = massetAddress.toHexString()
  } else {
    let underlying = contract.try_underlying()
    if (underlying.reverted) {
      throw new Error('Unable to identify underlying for SavingsContract')
    } else {
      savingsContractEntity.masset = underlying.value.toHexString()
    }
  }

  savingsContractEntity.automationEnabled = false
  savingsContractEntity.cumulativeDeposited = metrics.getOrCreate(addr, 'cumulativeDeposited').id
  savingsContractEntity.cumulativeWithdrawn = metrics.getOrCreate(addr, 'cumulativeWithdrawn').id
  savingsContractEntity.totalCredits = metrics.getOrCreate(addr, 'totalCredits').id
  savingsContractEntity.totalSavings = metrics.getOrCreate(addr, 'totalSavings').id
  savingsContractEntity.utilisationRate = metrics.getOrCreate(addr, 'utilisationRate').id
  savingsContractEntity.dailyAPY = decimal.ZERO
  savingsContractEntity.provisionalAPY = decimal.ZERO

  savingsContractEntity.totalDeposits = counters.getOrCreate(addr, 'totalDeposits').id
  savingsContractEntity.totalWithdrawals = counters.getOrCreate(addr, 'totalWithdrawals').id

  savingsContractEntity.save()

  return savingsContractEntity as SavingsContractEntity
}
