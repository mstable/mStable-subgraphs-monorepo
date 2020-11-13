import { Address } from '@graphprotocol/graph-ts'

import { Counter as CounterEntity } from '../generated/schema'
import { integer } from './dataTypes'

export namespace counters {
  function getId(address: Address, type: string): string {
    return address
      .toHexString()
      .concat('.')
      .concat(type)
  }

  export function getOrCreate(address: Address, type: string): CounterEntity {
    let id = getId(address, type)
    return getOrCreateById(id)
  }

  export function increment(address: Address, type: string): CounterEntity {
    let id = getId(address, type)
    return incrementById(id)
  }

  export function decrement(address: Address, type: string): CounterEntity {
    let id = getId(address, type)
    return decrementById(id)
  }

  export function getOrCreateById(id: string): CounterEntity {
    let counterEntity = CounterEntity.load(id)

    if (counterEntity == null) {
      counterEntity = new CounterEntity(id)
      counterEntity.value = integer.ZERO
      counterEntity.save()
    }

    return counterEntity as CounterEntity
  }

  export function incrementById(id: string): CounterEntity {
    let counterEntity = getOrCreateById(id)

    counterEntity.value = counterEntity.value.plus(integer.ONE)

    counterEntity.save()

    return counterEntity
  }

  export function decrementById(id: string): CounterEntity {
    let counterEntity = getOrCreateById(id)

    counterEntity.value = counterEntity.value.minus(integer.ONE)

    counterEntity.save()

    return counterEntity
  }
}
