import { Address, BigInt } from '@graphprotocol/graph-ts'
import { integer, metrics } from '@mstable/subgraph-utils'

import { FeederPool } from '../generated/templates/FeederPool/FeederPool'

import {
  Account as AccountEntity,
  FeederPoolAccount as FeederPoolAccountEntity,
} from '../generated/schema'
import { BoostedSavingsVault } from '../generated/templates/FeederPool/BoostedSavingsVault'

export namespace FeederPoolAccount {
  export function getId(poolAddress: Address, account: Address): string {
    return poolAddress
      .toHexString()
      .concat('.')
      .concat(account.toHexString())
  }

  export function get(poolAddress: Address, account: Address): FeederPoolAccountEntity | null {
    let id = getId(poolAddress, account)
    return FeederPoolAccountEntity.load(id)
  }

  export function getOrCreate(poolAddress: Address, account: Address): FeederPoolAccountEntity {
    let entity = get(poolAddress, account)
    if (entity != null) {
      return entity as FeederPoolAccountEntity
    }

    let id = getId(poolAddress, account)

    let cumulativeEarned = metrics.getOrCreateById(id.concat('.').concat('cumulativeEarned'))
    let cumulativeEarnedVault = metrics.getOrCreateById(
      id.concat('.').concat('cumulativeEarnedVault'),
    )

    let accountEntity = new AccountEntity(account.toHexString())
    accountEntity.save()

    entity = new FeederPoolAccountEntity(id)

    entity.account = accountEntity.id
    entity.feederPool = poolAddress.toHexString()
    entity.cumulativeEarned = cumulativeEarned.id
    entity.cumulativeEarnedVault = cumulativeEarnedVault.id

    entity.balance = integer.ZERO
    entity.price = integer.ZERO
    entity.lastUpdate = 0

    entity.balanceVault = integer.ZERO
    entity.priceVault = integer.ZERO
    entity.lastUpdateVault = 0

    entity.save()

    return entity as FeederPoolAccountEntity
  }

  export function update(
    poolAddress: Address,
    account: Address,
    timestamp: BigInt,
  ): FeederPoolAccountEntity {
    let entity = getOrCreate(poolAddress, account)

    let feederPool = FeederPool.bind(poolAddress)

    let priceNow = feederPool.getPrice().value0
    let balanceNow = feederPool.balanceOf(account)

    if (entity.balance.gt(integer.ZERO) && entity.price.gt(integer.ZERO)) {
      let lastValue = entity.balance.times(entity.price).div(integer.SCALE)
      let valueNow = entity.balance.times(priceNow).div(integer.SCALE)
      let earned = valueNow.minus(lastValue)

      if (earned.gt(integer.ZERO)) {
        metrics.incrementById(entity.cumulativeEarned, earned)
      }
    }

    entity.price = priceNow
    entity.balance = balanceNow
    entity.lastUpdate = timestamp.toI32()
    entity.save()

    return entity as FeederPoolAccountEntity
  }

  export function updateVault(
    poolAddress: Address,
    vaultAddress: Address,
    account: Address,
    timestamp: BigInt,
  ): FeederPoolAccountEntity {
    let entity = getOrCreate(poolAddress, account)

    let feederPool = FeederPool.bind(poolAddress)
    let priceNow = feederPool.getPrice().value0

    let boostedSavingsVault = BoostedSavingsVault.bind(vaultAddress)
    let rawBalanceNow = boostedSavingsVault.rawBalanceOf(account)

    if (entity.balanceVault.gt(integer.ZERO) && entity.priceVault.gt(integer.ZERO)) {
      let lastValue = entity.balanceVault.times(entity.priceVault).div(integer.SCALE)
      let valueNow = entity.balanceVault.times(priceNow).div(integer.SCALE)
      let earned = valueNow.minus(lastValue)

      if (earned.gt(integer.ZERO)) {
        metrics.incrementById(entity.cumulativeEarnedVault, earned)
      }
    }

    entity.priceVault = priceNow
    entity.balanceVault = rawBalanceNow
    entity.lastUpdateVault = timestamp.toI32()
    entity.save()

    return entity as FeederPoolAccountEntity
  }
}
