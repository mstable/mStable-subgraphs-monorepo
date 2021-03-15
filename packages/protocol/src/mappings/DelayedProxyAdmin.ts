import { Address, log } from '@graphprotocol/graph-ts'

import { Upgraded } from '../../generated/DelayedProxyAdmin/DelayedProxyAdmin'
import { Masset } from '../../generated/Masset/Masset'

import { Basket as BasketEntity, AmpData as AmpDataEntity } from '../../generated/schema'

import { getOrCreateMasset } from '../Masset'
import { updateBasket } from '../Basket'

export function handleUpgraded(event: Upgraded): void {
  log.debug('handleUpgraded', [])

  let musdV3Impl = Address.fromString('0x15b2838cd28cc353afbe59385db3f366d8945aee')
  let musdProxy = Address.fromString('0xe2f2a5c287993345a840db3b0845fbc70f5935a5')

  let musdV3Impl_ropsten = Address.fromString('0xfeae5ac0814cbf0a9a9a7914e9035e5f04c9525c')
  let musdProxy_ropsten = Address.fromString('0xacb27dbd461d892420e7d5be501bfaf86beb0e0d')

  let isMusdV3Upgrade: boolean =
    (event.params.newImpl.equals(musdV3Impl) && event.params.proxy.equals(musdProxy)) ||
    (event.params.newImpl.equals(musdV3Impl_ropsten) && event.params.proxy.equals(musdProxy_ropsten))

  log.debug('isMusdV3Upgrade {}', [isMusdV3Upgrade ? 'yes' : 'no'])

  if (isMusdV3Upgrade) {
    upgradeMusdV3(event.params.proxy)
  }
}

function upgradeMusdV3(address: Address): void {
  let masset = Masset.bind(address)
  let massetEntity = getOrCreateMasset(address)

  let basketEntity = BasketEntity.load(massetEntity.id) as BasketEntity
  basketEntity.unset('collateralisationRatio')
  basketEntity.save()

  let weightLimits = masset.try_weightLimits()
  if (!weightLimits.reverted) {
    massetEntity.hardMin = weightLimits.value.value0
    massetEntity.hardMax = weightLimits.value.value1

    let ampData = masset.ampData()
    let ampDataEntity = new AmpDataEntity(massetEntity.id)
    ampDataEntity.currentA = ampData.value0
    ampDataEntity.targetA = ampData.value1
    ampDataEntity.startTime = ampData.value2
    ampDataEntity.rampEndTime = ampData.value3
    ampDataEntity.save()
    massetEntity.ampData = ampDataEntity.id

    updateBasket(address)
  }
}
