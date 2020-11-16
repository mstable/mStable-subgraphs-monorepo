import { Address } from '@graphprotocol/graph-ts'

import { Token as TokenEntity } from '../generated/schema'
import { ERC20Detailed, Transfer } from '../generated/Empty/ERC20Detailed'
import { address } from './dataTypes'
import { metrics } from './metrics'
import { counters } from './counters'

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

      tokenEntity.totalSupply = metrics.getOrCreate(tokenAddress, 'token.totalSupply', decimals).id
      tokenEntity.totalBurned = metrics.getOrCreate(tokenAddress, 'token.totalBurned', decimals).id
      tokenEntity.totalMinted = metrics.getOrCreate(tokenAddress, 'token.totalMinted', decimals).id

      let totalSupply = contract.totalSupply()
      metrics.updateById(tokenEntity.totalSupply, totalSupply)

      tokenEntity.totalTransfers = counters.getOrCreate(tokenAddress, 'token.totalTransfers').id
      tokenEntity.totalMints = counters.getOrCreate(tokenAddress, 'token.totalMints').id
      tokenEntity.totalBurns = counters.getOrCreate(tokenAddress, 'token.totalBurns').id

      tokenEntity.save()
    }

    return tokenEntity as TokenEntity
  }

  export function handleTransfer(event: Transfer): void {
    let tokenAddress = event.address
    let value = event.params.value

    counters.increment(tokenAddress, 'token.totalTransfers')

    if (event.params.from.equals(address.ZERO_ADDRESS)) {
      counters.increment(tokenAddress, 'token.totalMints')
      metrics.increment(tokenAddress, 'token.totalMinted', value)
      metrics.increment(tokenAddress, 'token.totalSupply', value)
    } else if (event.params.to.equals(address.ZERO_ADDRESS)) {
      counters.increment(tokenAddress, 'token.totalBurns')
      metrics.increment(tokenAddress, 'token.totalBurned', value)
      metrics.decrement(tokenAddress, 'token.totalSupply', value)
    }
  }
}
