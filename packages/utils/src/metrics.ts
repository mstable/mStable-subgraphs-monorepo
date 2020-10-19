import { Address, BigInt } from '@graphprotocol/graph-ts'

import { Metric as MetricEntity, Counter as CounterEntity } from '../generated/schema'
import { decimal, integer } from './dataTypes'

export namespace metrics {
  function addressTypeId(address: Address, type: string): string {
    return address
      .toHexString()
      .concat('.')
      .concat(type)
  }

  export function getOrCreateMetric(
    id: string,
    decimals: i32 = decimal.DEFAULT_DECIMALS,
  ): MetricEntity {
    let metricEntity = MetricEntity.load(id)

    if (metricEntity == null) {
      metricEntity = new MetricEntity(id)
      metricEntity.exact = integer.ZERO
      metricEntity.decimals = decimals
      metricEntity.simple = decimal.ZERO
      metricEntity.save()
    }

    return metricEntity as MetricEntity
  }

  export function incrementMetric(id: string, delta: BigInt): MetricEntity {
    let metricEntity = getOrCreateMetric(id)

    metricEntity.exact = metricEntity.exact.plus(delta)
    metricEntity.simple = decimal.convert(metricEntity.exact, metricEntity.decimals)
    metricEntity.save()

    return metricEntity as MetricEntity
  }

  export function decrementMetric(id: string, delta: BigInt): MetricEntity {
    let metricEntity = getOrCreateMetric(id)

    metricEntity.exact = metricEntity.exact.minus(delta)
    metricEntity.simple = decimal.convert(metricEntity.exact, metricEntity.decimals)
    metricEntity.save()

    return metricEntity as MetricEntity
  }

  export function updateMetric(
    id: string,
    exact: BigInt,
    decimals: i32 = decimal.DEFAULT_DECIMALS,
  ): MetricEntity {
    let metricEntity = new MetricEntity(id)

    metricEntity.exact = exact
    metricEntity.decimals = decimals
    metricEntity.simple = decimal.convert(exact, decimals)

    metricEntity.save()

    return metricEntity as MetricEntity
  }

  export function getOrCreateMetricForAddress(
    address: Address,
    type: string,
    decimals: i32 = decimal.DEFAULT_DECIMALS,
  ): MetricEntity {
    let id = addressTypeId(address, type)
    return getOrCreateMetric(id, decimals)
  }

  export function incrementMetricForAddress(
    address: Address,
    type: string,
    delta: BigInt,
  ): MetricEntity {
    let id = addressTypeId(address, type)
    return incrementMetric(id, delta)
  }

  export function decrementMetricForAddress(
    address: Address,
    type: string,
    delta: BigInt,
  ): MetricEntity {
    let id = addressTypeId(address, type)
    return decrementMetric(id, delta)
  }

  export function updateMetricForAddress(
    address: Address,
    type: string,
    value: BigInt,
  ): MetricEntity {
    let id = addressTypeId(address, type)
    return updateMetric(id, value)
  }

  export function getOrCreateCounter(id: string): CounterEntity {
    let counterEntity = CounterEntity.load(id)

    if (counterEntity == null) {
      counterEntity = new CounterEntity(id)
      counterEntity.value = integer.ZERO
      counterEntity.save()
    }

    return counterEntity as CounterEntity
  }

  export function incrementCounter(id: string): CounterEntity {
    let counterEntity = getOrCreateCounter(id)

    counterEntity.value = counterEntity.value.plus(integer.ONE)

    counterEntity.save()

    return counterEntity
  }

  export function decrementCounter(id: string): CounterEntity {
    let counterEntity = getOrCreateCounter(id)

    counterEntity.value = counterEntity.value.minus(integer.ONE)

    counterEntity.save()

    return counterEntity
  }

  export function getOrCreateCounterForAddress(address: Address, type: string): CounterEntity {
    let id = addressTypeId(address, type)
    return getOrCreateCounter(id)
  }

  export function incrementCounterForAddress(address: Address, type: string): CounterEntity {
    let id = addressTypeId(address, type)
    return incrementCounter(id)
  }

  export function decrementCounterForAddress(address: Address, type: string): CounterEntity {
    let id = addressTypeId(address, type)
    return decrementCounter(id)
  }
}
