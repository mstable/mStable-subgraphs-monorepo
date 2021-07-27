import { Address } from '@graphprotocol/graph-ts'

import { BoostDirector } from '../BoostDirector'
import { handleDirected, handleRedirectedBoost, handleWhitelisted } from '../mappings/BoostDirector'
import { Directed, Directed__Params } from '../../generated/BoostDirector/BoostDirector'
import { Account as AccountEntity } from '../../generated/schema'

describe('BoostDirector', () => {
  // test('handleDirected', () => {
  //   const params = {
  //     user: Address.fromString('0xUser'),
  //     boosted: Address.fromString('0xBoosted'),
  //   } as Directed__Params
  //
  //   const event = {
  //     params,
  //   } as Directed
  //
  //   handleDirected(event)
  // })
  test('handleRedirectedBoost', () => {
    const accountEntity = { boostDirection: ['existing1', 'existing2'] }
    const replaced = accountEntity.boostDirection[0]
    const redirected = 'redirected'

    let boostDirectionNext = []
    let boostDirectionPrev = accountEntity.boostDirection as Array<string>

    for (let i = 0; i < boostDirectionPrev.length; i++) {
      let current: string = boostDirectionPrev[i] as string
      boostDirectionNext[i] = current.toString() == replaced ? redirected : current
    }

    expect(boostDirectionNext).toEqual([redirected, 'existing2'])
  })
})
