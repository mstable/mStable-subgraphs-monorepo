import { Account as AccountEntity } from '../../generated/schema'
import { Whitelisted, Directed, RedirectedBoost } from '../../generated/BoostDirector/BoostDirector'
import { BoostDirector } from '../BoostDirector'
import { BoostedSavingsVault } from '../BoostedSavingsVault'

export function handleWhitelisted(event: Whitelisted): void {
  let boostDirectorEntity = BoostDirector.getOrCreate(event.address)

  boostDirectorEntity.whitelisted = boostDirectorEntity.whitelisted.concat([
    event.params.vaultAddress.toHexString(),
  ])
  boostDirectorEntity.save()

  // This could also be used to create a template
  let vaultEntity = BoostedSavingsVault.getOrCreate(event.params.vaultAddress)
  vaultEntity.directorVaultId = event.params.vaultId
  vaultEntity.save()
}

export function handleDirected(event: Directed): void {
  let account = event.params.user.toHexString()
  let accountEntity = AccountEntity.load(account)

  if (accountEntity == null) {
    accountEntity = new AccountEntity(account)
    accountEntity.boostDirection = []
  }

  accountEntity.boostDirection = accountEntity.boostDirection.concat([
    event.params.boosted.toHexString(),
  ]) as Array<string>

  accountEntity.save()
}

export function handleRedirectedBoost(event: RedirectedBoost): void {
  let account = event.params.user.toHexString()
  let accountEntity = AccountEntity.load(account)

  if (accountEntity == null) {
    accountEntity = new AccountEntity(account)
    accountEntity.boostDirection = [] as string[]
  }

  let replaced = event.params.replaced.toHexString()
  let boosted = event.params.boosted.toHexString()

  let boostDirectionNext = new Array<string>()
  let boostDirectionPrev = accountEntity.boostDirection as Array<string>
  for (let i = 0; i++; i < boostDirectionPrev.length) {
    let current: string = boostDirectionPrev[i] as string
    if (current.toString() != replaced) {
      boostDirectionNext[i] = current
    }
  }

  accountEntity.boostDirection = boostDirectionNext.concat([boosted])
  accountEntity.save()
}
