import { ByteArray, crypto, ethereum } from '@graphprotocol/graph-ts'
import { concat } from '@graphprotocol/graph-ts/helper-functions'

export namespace events {
  export function getId(event: ethereum.Event): string {
    return crypto
      .keccak256(concat(event.transaction.hash, ByteArray.fromI32(event.transactionLogIndex.toI32())))
      .toHex()
  }
}
