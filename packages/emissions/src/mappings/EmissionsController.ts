import { BigInt } from '@graphprotocol/graph-ts'
import { address } from '@mstable/subgraph-utils'

import {
  AddedDial,
  AddStakingContract,
  DistributedReward,
  DonatedRewards,
  PeriodRewards,
  PreferencesChanged,
  SourcesPoked,
  UpdatedDial,
  VotesCast,
} from '../../generated/EmissionsController/EmissionsController'

import { EmissionsControllerModel } from '../models/EmissionsControllerModel'
import { DialModel } from '../models/DialModel'
import { PreferenceModel } from '../models/PreferenceModel'
import { VoterModel } from '../models/VoterModel'
import { DialVotesForEpochModel } from '../models/DialVotesForEpochModel'

export function handleAddedDial(event: AddedDial): void {
  // Sensible time to create the EmissionsController if it doesn't exist already
  EmissionsControllerModel.getOrCreate(event.address)

  DialModel.getOrCreate(event.address, event.params.dialId)
}

export function handleUpdatedDial(event: UpdatedDial): void {
  DialModel.updateDisabled(event.address, event.params.dialId, event.params.disabled)
}

export function handleAddStakingContract(event: AddStakingContract): void {
  EmissionsControllerModel.addStakingContract(event.address, event.params.stakingContract)
}

export function handlePeriodRewards(event: PeriodRewards): void {
  let lastEpoch = EmissionsControllerModel.updateLastEpoch(event.address)
  DialModel.addBalances(event.address, event.params.amounts)

  for (let dialId = 0; dialId < event.params.amounts.length; dialId++) {
    DialVotesForEpochModel.updateVotes(
      event.address,
      BigInt.fromI32(dialId),
      BigInt.fromI32(lastEpoch.weekNumber),
    )
  }
}

export function handleDonatedRewards(event: DonatedRewards): void {
  DialModel.addBalance(event.address, event.params.dialId, event.params.amount)
}

export function handleDistributedReward(event: DistributedReward): void {
  DialModel.addBalance(event.address, event.params.dialId, event.params.amount)
}

export function handlePreferencesChanged(event: PreferencesChanged): void {
  PreferenceModel.updateForVoter(event.address, event.params.voter, event.params.preferences)
  VoterModel.updateSourcesPoked(event.address, event.params.voter, event.block.timestamp)
  VoterModel.updateLastEpoch(event.address, event.params.voter)
  DialModel.updateDialsForPreferences(event.address, event.params.preferences)
}

export function handleVotesCast(event: VotesCast): void {
  if (event.params.from.notEqual(address.ZERO_ADDRESS)) {
    PreferenceModel.removeVotesCast(event.address, event.params.from, event.params.amount)
  }
  if (event.params.to.notEqual(address.ZERO_ADDRESS)) {
    PreferenceModel.incrementVotesCast(event.address, event.params.to, event.params.amount)
  }
}

export function handleSourcesPoked(event: SourcesPoked): void {
  VoterModel.updateSourcesPoked(event.address, event.params.voter, event.block.timestamp)
  VoterModel.updateVotePreferences(event.address, event.params.voter)
  VoterModel.updateLastEpoch(event.address, event.params.voter)
}
