import { BigInt, Entity, Value, Bytes, ethereum } from '@graphprotocol/graph-ts'
import { events } from './events'

export namespace transaction {
  class Transaction extends Entity {
    constructor(id: string) {
      super()
      this.set('id', Value.fromString(id))
    }

    get id(): string {
      let value = this.get('id')
      return value.toString()
    }

    set id(value: string) {
      this.set('id', Value.fromString(value))
    }

    get hash(): Bytes {
      let value = this.get('hash')
      return value.toBytes()
    }

    set hash(value: Bytes) {
      this.set('hash', Value.fromBytes(value))
    }

    get block(): i32 {
      let value = this.get('block')
      return value.toI32()
    }

    set block(value: i32) {
      this.set('block', Value.fromI32(value))
    }

    get timestamp(): BigInt {
      let value = this.get('timestamp')
      return value.toBigInt()
    }

    set timestamp(value: BigInt) {
      this.set('timestamp', Value.fromBigInt(value))
    }
  }

  export function fromEvent(event: ethereum.Event): Transaction {
    let id = events.getId(event)

    let transactionEntity = new Transaction(id)
    transactionEntity.block = event.block.number.toI32()
    transactionEntity.timestamp = event.block.timestamp
    transactionEntity.hash = event.transaction.hash

    return transactionEntity
  }
}
