import { Address, BigInt, Bytes } from '@graphprotocol/graph-ts'

import {
  MerkleDrop as MerkleDropContract,
  Claimed,
  TrancheAdded,
  TrancheExpired,
  RemovedFunder,
  Whitelisted,
} from '../../generated/MerkleDrop/MerkleDrop'
import { MerkleDrop, MerkleDropClaim, MerkleDropTranche } from '../../generated/schema'

function getOrCreateMerkleDrop(address: Address): MerkleDrop {
  let id = address.toHexString()

  let merkleDrop = MerkleDrop.load(id)

  if (merkleDrop != null) {
    return merkleDrop as MerkleDrop
  }

  merkleDrop = new MerkleDrop(id)

  let contract = MerkleDropContract.bind(address)

  merkleDrop.token = contract.token().toHexString()
  merkleDrop.funders = []

  merkleDrop.save()

  return merkleDrop as MerkleDrop
}

function getOrCreateMerkleDropClaim(
  address: Address,
  account: Address,
  tranche: BigInt,
  balance: BigInt,
): MerkleDropClaim {
  let id = address.toHexString() + '-' + account.toHexString() + tranche.toString()
  let claim = MerkleDropClaim.load(id)

  if (claim != null) {
    return claim as MerkleDropClaim
  }

  claim = new MerkleDropClaim(id)

  claim.account = account
  claim.tranche = getTrancheId(address, tranche)
  claim.merkleDrop = address.toHexString()
  claim.balance = balance

  claim.save()

  return claim as MerkleDropClaim
}

function getTrancheId(address: Address, trancheNumber: BigInt): string {
  return address.toHexString() + '-' + trancheNumber.toString()
}

function getMerkleDropTranche(address: Address, trancheNumber: BigInt): MerkleDropTranche {
  let id = getTrancheId(address, trancheNumber)

  let tranche = MerkleDropTranche.load(id)

  return tranche as MerkleDropTranche
}

function createMerkleDropTranche(
  address: Address,
  trancheNumber: BigInt,
  totalAmount: BigInt,
  merkleRoot: Bytes,
): MerkleDropTranche {
  let id = getTrancheId(address, trancheNumber)

  let tranche = new MerkleDropTranche(id)

  tranche.merkleDrop = address.toHexString()
  tranche.merkleRoot = merkleRoot
  tranche.trancheNumber = trancheNumber.toI32()
  tranche.totalAmount = totalAmount
  tranche.expired = false

  tranche.save()

  return tranche
}

export function handleClaimed(event: Claimed): void {
  getOrCreateMerkleDropClaim(
    event.address,
    event.params.claimant,
    event.params.week,
    event.params.balance,
  )
}

export function handleTrancheAdded(event: TrancheAdded): void {
  createMerkleDropTranche(
    event.address,
    event.params.tranche,
    event.params.totalAmount,
    event.params.merkleRoot,
  )
}

export function handleTrancheExpired(event: TrancheExpired): void {
  let tranche = getMerkleDropTranche(event.address, event.params.tranche)

  tranche.expired = true

  tranche.save()
}

export function handleRemovedFunder(event: RemovedFunder): void {
  let merkleDrop = getOrCreateMerkleDrop(event.address)

  merkleDrop.funders = merkleDrop.funders.filter(funder => funder.notEqual(event.params._address))

  merkleDrop.save()
}

export function handleWhitelisted(event: Whitelisted): void {
  let merkleDrop = getOrCreateMerkleDrop(event.address)

  let funders = merkleDrop.funders

  funders.push(event.params._address)

  merkleDrop.funders = funders as Bytes[]

  merkleDrop.save()
}
