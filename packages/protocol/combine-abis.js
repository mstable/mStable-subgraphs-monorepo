const fs = require('fs')
const path = require('path')

const mapAbi = (_abi, prefix) => {
  const abi = Array.isArray(_abi) ? _abi : _abi.abi
  return prefix ? abi.map(({ name, ...entry }) => ({ name: `${prefix}_${name}`, ...entry })) : abi
}

/**
 * Combine ABIs to handle events defined in libraries or
 * previous proxy implementations
 */
const main = async () => {
  const mergeSets = [
    {
      contractName: 'MassetExtended',
      sourceABI:
        '../../node_modules/@mstable/protocol/build/contracts/masset/Masset.sol/Masset.json',
      otherABIs: [
        './abis/LegacyMasset.json',
        '../../node_modules/@mstable/protocol/build/contracts/masset/Manager.sol/Manager.json',
      ],
    },
  ]

  await Promise.all(
    mergeSets.map(async ({ contractName, sourceABI, otherABIs }) => {
      const source = JSON.parse(await fs.promises.readFile(sourceABI, { encoding: 'utf8' }))

      const others = await Promise.all(
        otherABIs.map(async filePath => {
          const contents = await fs.promises.readFile(filePath, { encoding: 'utf8' })
          const parsed = JSON.parse(contents)
          const prefix = filePath.match(/\/(\w+)\.json$/)[1]
          return [parsed, prefix]
        }),
      )

      const entries = [...others.flatMap(([abi, prefix]) => mapAbi(abi, prefix)), ...mapAbi(source)]

      const merged = { contractName, abi: entries }

      const mergedJson = JSON.stringify(merged, null, 2)

      await fs.promises.writeFile(path.join('./abis', `${contractName}.json`), mergedJson)
    }),
  )
}

main()
  .then(() => {
    process.exit(0)
  })
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
