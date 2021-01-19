import { Address } from '@graphprotocol/graph-ts'
import { integer } from '@mstable/subgraph-utils'

import { CreditBalance as CreditBalanceEntity } from '../generated/schema'

/**
 * @deprecated
 */
export function getOrCreateCreditBalance(
  account: Address,
  savingsContract: Address,
): CreditBalanceEntity {
  let id = savingsContract
    .toHexString()
    .concat('.')
    .concat(account.toHexString())

  let creditBalanceEntity = CreditBalanceEntity.load(id)

  if (creditBalanceEntity != null) {
    return creditBalanceEntity as CreditBalanceEntity
  }

  creditBalanceEntity = new CreditBalanceEntity(id)
  creditBalanceEntity.savingsContract = savingsContract.toHexString()
  creditBalanceEntity.account = account.toHexString()
  creditBalanceEntity.amount = integer.ZERO

  return creditBalanceEntity as CreditBalanceEntity
}
