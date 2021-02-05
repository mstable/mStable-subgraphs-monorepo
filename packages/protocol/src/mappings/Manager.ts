import { AmpData as AmpDataEntity } from '../../generated/schema'

import { RampA, StopRampA } from '../../generated/mBTC.Manager/Manager'

export function handleRampA(event: RampA): void {
  let id = event.address.toHexString()

  let ampDataEntity = AmpDataEntity.load(id) as AmpDataEntity
  ampDataEntity.initialA = event.params.oldA
  ampDataEntity.initialATime = event.params.initialTime
  ampDataEntity.futureA = event.params.newA
  ampDataEntity.futureATime = event.params.futureTime
  ampDataEntity.save()
}

export function handleStopRampA(event: StopRampA): void {
  let id = event.address.toHexString()

  let ampDataEntity = AmpDataEntity.load(id) as AmpDataEntity
  ampDataEntity.initialA = event.params.a
  ampDataEntity.initialATime = event.params.t
  ampDataEntity.futureA = event.params.a
  ampDataEntity.futureATime = event.params.t
  ampDataEntity.save()
}
