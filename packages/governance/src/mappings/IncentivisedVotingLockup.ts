import {
  Deposit,
  Withdraw,
  Ejected,
  Expired,
  RewardAdded,
  RewardPaid,
} from '../../generated/IncentivisedVotingLockup/IncentivisedVotingLockup'
import {
  expireIncentivisedVotingLockup,
  updateLockupGlobals,
  increaseTotalValue,
  decreaseTotalValue,
} from '../models/IncentivisedVotingLockup'
import {
  withdrawUserLockup,
  depositUserLockup,
  resetUserLockup,
} from '../models/UserLockup'
import { updateStakingReward } from '../models/StakingReward'
import { updateStakingBalance } from '../models/StakingBalance'
import {
  getOrCreateClaimTransaction,
  getOrCreateEjectTransaction,
  getOrCreateWithdrawTransaction,
  handleDepositTransaction,
} from '../models/Transaction'

export function handleDeposit(event: Deposit): void {
  updateLockupGlobals(event.address)

  depositUserLockup(event)
  increaseTotalValue(event.address, event.params.value)

  updateStakingReward(event.address, event.params.provider)
  updateStakingBalance(event.address, event.params.provider)

  handleDepositTransaction(event)
}

export function handleWithdraw(event: Withdraw): void {
  updateLockupGlobals(event.address)

  withdrawUserLockup(event)
  decreaseTotalValue(event.address, event.params.value)

  updateStakingReward(event.address, event.params.provider)
  updateStakingBalance(event.address, event.params.provider)

  getOrCreateWithdrawTransaction(event)
}

export function handleEjected(event: Ejected): void {
  updateLockupGlobals(event.address)

  resetUserLockup(event)

  updateStakingReward(event.address, event.params.ejected)
  updateStakingBalance(event.address, event.params.ejected)

  getOrCreateEjectTransaction(event)
}

export function handleExpired(event: Expired): void {
  expireIncentivisedVotingLockup(event.address)
}

export function handleRewardAdded(event: RewardAdded): void {
  updateLockupGlobals(event.address)
}

export function handleRewardPaid(event: RewardPaid): void {
  updateLockupGlobals(event.address)

  updateStakingReward(event.address, event.params.user)

  getOrCreateClaimTransaction(event)
}
