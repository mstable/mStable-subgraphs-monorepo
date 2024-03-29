import { Address, BigInt } from '@graphprotocol/graph-ts'

import { Metric as MetricEntity } from '../generated/schema'
import { decimal, integer } from './dataTypes'

export namespace metrics {
  function getId(address: Address, type: string): string {
    return address
      .toHexString()
      .concat('.')
      .concat(type)
  }

  export function getOrCreate(address: Address, type: string): MetricEntity {
    return getOrCreateWithDecimals(address, type, decimal.DEFAULT_DECIMALS)
  }

  export function getOrCreateWithDecimals(
    address: Address,
    type: string,
    // @ts-ignore
    decimals: i32,
  ): MetricEntity {
    let id = getId(address, type)
    return getOrCreateByIdWithDecimals(id, decimals)
  }

  export function increment(address: Address, type: string, delta: BigInt): MetricEntity {
    let id = getId(address, type)
    return incrementById(id, delta)
  }

  export function decrement(address: Address, type: string, delta: BigInt): MetricEntity {
    let id = getId(address, type)
    return decrementById(id, delta)
  }

  export function update(address: Address, type: string, value: BigInt): MetricEntity {
    let id = getId(address, type)
    return updateById(id, value)
  }

  export function getOrCreateById(id: string): MetricEntity {
    return getOrCreateByIdWithDecimals(id, decimal.DEFAULT_DECIMALS)
  }

  export function getOrCreateByIdWithDecimals(
    id: string,
    // @ts-ignore
    decimals: i32,
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

  export function incrementById(id: string, delta: BigInt): MetricEntity {
    let metricEntity = getOrCreateById(id)

    metricEntity.exact = metricEntity.exact.plus(delta)
    metricEntity.simple = decimal.convert(metricEntity.exact, metricEntity.decimals)
    metricEntity.save()

    return metricEntity as MetricEntity
  }

  export function decrementById(id: string, delta: BigInt): MetricEntity {
    let metricEntity = getOrCreateById(id)

    metricEntity.exact = metricEntity.exact.minus(delta)
    metricEntity.simple = decimal.convert(metricEntity.exact, metricEntity.decimals)
    metricEntity.save()

    return metricEntity as MetricEntity
  }

  export function updateById(id: string, exact: BigInt): MetricEntity {
    return updateByIdWithDecimals(id, exact, decimal.DEFAULT_DECIMALS)
  }

  export function updateByIdWithDecimals(
    id: string,
    exact: BigInt,
    // @ts-ignore
    decimals: i32,
  ): MetricEntity {
    let metricEntity = new MetricEntity(id)

    metricEntity.exact = exact
    metricEntity.decimals = decimals
    metricEntity.simple = decimal.convert(exact, decimals)

    metricEntity.save()

    return metricEntity as MetricEntity
  }
}
