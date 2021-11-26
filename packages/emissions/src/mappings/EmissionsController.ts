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
import { EpochModel } from '../models/EpochModel'

export function handleAddedDial(event: AddedDial): void {
  // Sensible time to create the EmissionsController if it doesn't exist already
  EmissionsControllerModel.getOrCreate(event.address)

  DialModel.getOrCreate(event.address, event.params.id)
}

export function handleUpdatedDial(event: UpdatedDial): void {
  DialModel.updateDisabled(event.address, event.params.id, event.params.diabled)
}

export function handleAddStakingContract(event: AddStakingContract): void {
  EmissionsControllerModel.addStakingContract(event.address, event.params.stakingContract)
}

export function handlePeriodRewards(event: PeriodRewards): void {
  EmissionsControllerModel.updateLastEpoch(event.address)
  DialModel.addBalances(event.address, event.params.amounts)

  // TODO update voteHistory
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
}

export function handleVotesCast(event: VotesCast): void {
  // event.params.from
  // event.params.to
  // event.params.amount
  // TODO
  // if (event.params.from.notEqual(address.ZERO_ADDRESS)) {
  //   PreferenceModel.updateForVoter(event.address, event.params.from)
  // }
  //
  // if (event.params.to.notEqual(address.ZERO_ADDRESS)) {
  //   PreferenceModel.updateForVoter(event.address, event.params.to)
  // }
}

export function handleSourcesPoked(event: SourcesPoked): void {
  VoterModel.updateSourcesPoked(event.address, event.params.voter, event.block.timestamp)
}
