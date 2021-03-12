import { Address, log } from '@graphprotocol/graph-ts'
import { counters, decimal, integer, metrics, token } from '@mstable/subgraph-utils'

import { FeederPoolExtended } from '../generated/templates/FeederPool/FeederPoolExtended'

import {
  AmpData as AmpDataEntity,
  Basket as BasketEntity,
  Basset as BassetEntity,
  FeederPool as FeederPoolEntity,
} from '../generated/schema'
import { mapBassetStatus } from './Basket'

export function getOrCreateFeederPool(address: Address): FeederPoolEntity {
  log.debug('getOrCreateFeederPool {}', [address.toHexString()])
  let id = address.toHexString()

  let feederPool = FeederPoolExtended.bind(address)

  let fpEntity = FeederPoolEntity.load(id)

  if (fpEntity != null) {
    return fpEntity as FeederPoolEntity
  }

  fpEntity = new FeederPoolEntity(id)

  let feederData = feederPool.data()

  fpEntity.swapFeeRate = feederData.value0
  fpEntity.redemptionFeeRate = feederData.value1
  fpEntity.governanceFeeRate = feederData.value2
  fpEntity.pendingFees = feederData.value3 // TODO update this value
  fpEntity.cacheSize = feederData.value4
  fpEntity.hardMin = feederData.value6.min
  fpEntity.hardMax = feederData.value6.max

  let ampData = feederData.value5
  let ampDataEntity = new AmpDataEntity(id)
  ampDataEntity.currentA = ampData.initialA
  ampDataEntity.targetA = ampData.targetA
  ampDataEntity.startTime = ampData.rampStartTime
  ampDataEntity.rampEndTime = ampData.rampEndTime
  ampDataEntity.save()
  fpEntity.ampData = ampDataEntity.id

  fpEntity.swapFeeRate = integer.ZERO
  fpEntity.redemptionFeeRate = integer.ZERO
  fpEntity.governanceFeeRate = integer.ZERO
  fpEntity.pendingFees = integer.ZERO
  fpEntity.cacheSize = integer.ZERO
  fpEntity.hardMin = integer.ZERO
  fpEntity.hardMax = integer.ZERO

  fpEntity.token = token.getOrCreate(address).id
  fpEntity.totalSupply = metrics.getOrCreate(address, 'token.totalSupply').id
  fpEntity.cumulativeMinted = metrics.getOrCreate(address, 'cumulativeMinted').id
  fpEntity.cumulativeRedeemed = metrics.getOrCreate(address, 'cumulativeRedeemed').id
  fpEntity.cumulativeSwapped = metrics.getOrCreate(address, 'cumulativeSwapped').id
  fpEntity.cumulativeFeesPaid = metrics.getOrCreate(address, 'cumulativeFeesPaid').id
  fpEntity.cumulativeInterestCollected = metrics.getOrCreate(
    address,
    'cumulativeInterestCollected',
  ).id
  fpEntity.cumulativeInterestDistributed = metrics.getOrCreate(
    address,
    'cumulativeInterestDistributed',
  ).id
  fpEntity.cumulativeLiquidatorDeposited = metrics.getOrCreate(
    address,
    'cumulativeLiquidatorDeposited',
  ).id

  fpEntity.totalMints = counters.getOrCreate(address, 'totalMints').id
  fpEntity.totalRedemptions = counters.getOrCreate(address, 'totalRedemptions').id
  fpEntity.totalRedeemMassets = counters.getOrCreate(address, 'totalRedeemMassets').id
  fpEntity.totalSwaps = counters.getOrCreate(address, 'totalSwaps').id

  let bassets = feederPool.getBassets()
  let massetPersonal = bassets.value0[0]
  let fassetPersonal = bassets.value0[1]

  token.getOrCreate(fassetPersonal.addr)

  fpEntity.fasset = fassetPersonal.addr.toHexString()
  fpEntity.masset = massetPersonal.addr.toHexString()

  let bassetEntities = updateFeederPoolBassets(address)

  let basketEntity = new BasketEntity(id)
  basketEntity.maxBassets = bassetEntities.length
  basketEntity.bassets = [bassetEntities[0].id, bassetEntities[1].id]
  basketEntity.failed = false
  basketEntity.undergoingRecol = false
  basketEntity.save()
  fpEntity.basket = basketEntity.id

  fpEntity.price = integer.ZERO
  fpEntity.invariantK = integer.ZERO
  fpEntity.dailyAPY = decimal.ZERO

  fpEntity.save()

  return fpEntity as FeederPoolEntity
}

function createBassetMetric(bassetId: string, name: string, decimals: i32): string {
  return metrics.getOrCreateByIdWithDecimals(bassetId + '.' + name, decimals).id
}

function createBassetCounter(bassetId: string, name: string): string {
  return counters.getOrCreateById(bassetId + '.' + name).id
}

export function getFPBassetId(fpAddress: Address, bassetAddress: Address): string {
  return fpAddress.toHexString() + '.' + bassetAddress.toHexString()
}

export function updateFeederPoolBassets(address: Address): Array<BassetEntity> {
  let feederPool = FeederPoolExtended.bind(address)
  let result = feederPool.getBassets()
  let bassetsPersonal = result.value0
  let bassetsData = result.value1

  let arr = new Array<BassetEntity>()
  let length = bassetsPersonal.length

  for (let i = 0; i < length; i++) {
    let bassetData = bassetsData[i]
    let bassetPersonal = bassetsPersonal[i]

    let bassetId = getFPBassetId(address, bassetPersonal.addr)
    arr.push(new BassetEntity(bassetId))

    let tokenEntity = token.getOrCreate(bassetPersonal.addr)
    let decimals = tokenEntity.decimals

    arr[i].token = tokenEntity.id
    arr[i].ratio = bassetData.ratio
    arr[i].removed = false

    arr[i].vaultBalance = createBassetMetric(bassetId, 'vaultBalance', decimals)
    metrics.updateByIdWithDecimals(arr[i].vaultBalance, bassetData.vaultBalance, decimals)

    arr[i].isTransferFeeCharged = bassetPersonal.hasTxFee
    arr[i].status = mapBassetStatus(bassetPersonal.status)

    arr[i].totalSupply = createBassetMetric(bassetId, 'totalSupply', decimals)
    arr[i].cumulativeMinted = createBassetMetric(bassetId, 'cumulativeMinted', decimals)
    arr[i].cumulativeRedeemed = createBassetMetric(bassetId, 'cumulativeRedeemed', decimals)
    arr[i].cumulativeFeesPaid = createBassetMetric(bassetId, 'cumulativeFeesPaid', decimals)
    arr[i].cumulativeSwappedAsOutput = createBassetMetric(
      bassetId,
      'cumulativeSwappedAsOutput',
      decimals,
    )

    arr[i].totalMints = createBassetCounter(bassetId, 'totalMints')
    arr[i].totalRedemptions = createBassetCounter(bassetId, 'totalRedemptions')
    arr[i].totalSwapsAsInput = createBassetCounter(bassetId, 'totalSwapsAsInput')
    arr[i].totalSwapsAsOutput = createBassetCounter(bassetId, 'totalSwapsAsOutput')
    arr[i].save()
  }

  return arr
}
