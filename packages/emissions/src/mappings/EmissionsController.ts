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
import { EmissionsController } from '../../generated/schema'
import { EmissionsControllerModel } from '../models/EmissionsControllerModel'
import { DialModel } from '../models/DialModel'
import { address } from '../../../utils'

export function handleAddedDial(event: AddedDial): void {
  let emissionsController = EmissionsControllerModel.getOrCreate(event.address)
  DialModel.getOrCreate(emissionsController, event.params.id)
}

export function handleUpdatedDial(event: UpdatedDial): void {
  let emissionsController = EmissionsControllerModel.getOrCreate(event.address)
  DialModel.updateDisabled(emissionsController, event.params.id, event.params.diabled)
}

export function handleAddStakingContract(event: AddStakingContract): void {
  let emissionsController = EmissionsControllerModel.getOrCreate(event.address)
  // TODO
  // emissionsController.addStakingContract(event.params.stakingContract)
}

export function handlePeriodRewards(event: PeriodRewards): void {
  // event.params.amounts
  // TODO
  // EmissionsControllerModel.updateDials(event.address)
}

export function handleDonatedRewards(event: DonatedRewards): void {
  // event.params.dialId
  // event.params.amount
  // TODO

  let emissionsController = EmissionsControllerModel.getOrCreate(event.address)
}

export function handleDistributedReward(event: DistributedReward): void {
  // event.params.dialId
  // event.params.amount
  // TODO

  let emissionsController = EmissionsControllerModel.getOrCreate(event.address)
}

export function handlePreferencesChanged(event: PreferencesChanged): void {
  // event.params.preferences
  // event.params.voter
  // TODO

  let emissionsController = EmissionsControllerModel.getOrCreate(event.address)
}

export function handleVotesCast(event: VotesCast): void {
  // event.params.from
  // event.params.to
  // event.params.amount
  // TODO

  let emissionsController = EmissionsControllerModel.getOrCreate(event.address)
}

export function handleSourcesPoked(event: SourcesPoked): void {
  // event.params.voter
  // TODO

  let emissionsController = EmissionsControllerModel.getOrCreate(event.address)
}
