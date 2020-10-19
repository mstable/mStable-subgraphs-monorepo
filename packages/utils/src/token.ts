import { Address } from '@graphprotocol/graph-ts'

import { Token as TokenEntity } from '../generated/schema'
import { ERC20Detailed, Transfer } from '../generated/Empty/ERC20Detailed'
import { address } from './dataTypes'
import { metrics } from './metrics'

export namespace token {
  export function getOrCreate(tokenAddress: Address): TokenEntity {
    let id = tokenAddress.toHexString()
    let tokenEntity = TokenEntity.load(id)

    if (tokenEntity == null) {
      tokenEntity = new TokenEntity(id)

      let contract = ERC20Detailed.bind(tokenAddress)

      let decimals = contract.decimals()
      tokenEntity.decimals = decimals

      tokenEntity.address = tokenAddress
      tokenEntity.symbol = contract.symbol()
      tokenEntity.name = contract.name()

      tokenEntity.totalSupply = metrics.getOrCreateMetricForAddress(
        tokenAddress,
        'totalSupply',
        decimals,
      ).id
      tokenEntity.totalBurned = metrics.getOrCreateMetricForAddress(
        tokenAddress,
        'totalBurned',
        decimals,
      ).id
      tokenEntity.totalMinted = metrics.getOrCreateMetricForAddress(
        tokenAddress,
        'totalBurned',
        decimals,
      ).id

      let totalSupply = contract.totalSupply()
      metrics.updateMetric(tokenEntity.totalSupply, totalSupply)

      tokenEntity.transfers = metrics.getOrCreateCounterForAddress(tokenAddress, 'transfers').id
      tokenEntity.totalMints = metrics.getOrCreateCounterForAddress(tokenAddress, 'totalMints').id
      tokenEntity.totalBurns = metrics.getOrCreateCounterForAddress(tokenAddress, 'totalBurns').id

      tokenEntity.save()
    }

    return tokenEntity as TokenEntity
  }

  export function handleTransfer(event: Transfer): void {
    let tokenAddress = event.address
    let value = event.params.value

    metrics.incrementCounterForAddress(tokenAddress, 'totalTransfers')

    if (event.params.from.equals(address.ZERO_ADDRESS)) {
      metrics.incrementCounterForAddress(tokenAddress, 'totalMints')
      metrics.incrementMetricForAddress(tokenAddress, 'totalMinted', value)
      metrics.incrementMetricForAddress(tokenAddress, 'totalSupply', value)
    } else if (event.params.to.equals(address.ZERO_ADDRESS)) {
      metrics.incrementCounterForAddress(tokenAddress, 'totalBurns')
      metrics.incrementMetricForAddress(tokenAddress, 'totalBurned', value)
      metrics.decrementMetricForAddress(tokenAddress, 'totalSupply', value)
    }
  }
}
