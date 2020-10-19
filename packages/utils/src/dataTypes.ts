import { Address, BigDecimal, BigInt, Bytes } from '@graphprotocol/graph-ts'

export namespace bytes {
  const ADDRESS_LENGTH = 20

  export function toAddress(address: Bytes): Address {
    // @ts-ignore
    return Address.fromHexString(address.toHex()).subarray(-ADDRESS_LENGTH) as Address
  }

  export function toSignedInt(
    value: Bytes,
    signed: boolean = false,
    bigEndian: boolean = true,
  ): BigInt {
    return BigInt.fromSignedBytes(bigEndian ? (value.reverse() as Bytes) : value)
  }

  export function toUnsignedInt(value: Bytes, bigEndian: boolean = true): BigInt {
    return BigInt.fromUnsignedBytes(bigEndian ? (value.reverse() as Bytes) : value)
  }
}

export namespace decimal {
  export const DEFAULT_DECIMALS = 18

  export let ZERO = BigDecimal.fromString('0')
  export let ONE = BigDecimal.fromString('1')

  let WAD = BigInt.fromI32(10)
    .pow(18)
    .toBigDecimal()
  let RAY = BigInt.fromI32(10)
    .pow(27)
    .toBigDecimal()
  let RAD = BigInt.fromI32(10)
    .pow(45)
    .toBigDecimal()

  export function fromNumber(value: f64): BigDecimal {
    return fromString(value.toString())
  }

  export function fromString(value: string): BigDecimal {
    return BigDecimal.fromString(value)
  }

  export function convert(value: BigInt, decimals: number = DEFAULT_DECIMALS): BigDecimal {
    let precision = BigInt.fromI32(10)
      .pow(<u8>decimals)
      .toBigDecimal()

    return value.divDecimal(precision)
  }

  export function fromRad(value: BigInt): BigDecimal {
    return value.divDecimal(RAD)
  }

  export function toRad(value: BigDecimal): BigInt {
    return value.times(RAD).truncate(0).digits
  }

  export function fromRay(value: BigInt): BigDecimal {
    return value.divDecimal(RAY)
  }

  export function toRay(value: BigDecimal): BigInt {
    return value.times(RAY).truncate(0).digits
  }

  export function fromWad(value: BigInt): BigDecimal {
    return value.divDecimal(WAD)
  }

  export function toWad(value: BigDecimal): BigInt {
    return value.times(WAD).truncate(0).digits
  }
}

export namespace integer {
  export let ZERO = BigInt.fromI32(0)
  export let ONE = BigInt.fromI32(1)
  export let RATIO = BigInt.fromI32(100000000)
  export let SCALE = BigInt.fromI32(10).pow(18 as u8)

  export function fromNumber(value: i32): BigInt {
    return BigInt.fromI32(value)
  }

  export function fromString(value: string): BigInt {
    return fromNumber(parseI32(value))
  }

  export function toRatio(value: BigInt, ratio: BigInt): BigInt {
    return value.times(ratio).div(RATIO)
  }

  export function fromRatio(value: BigInt, ratio: BigInt): BigInt {
    return value.times(RATIO).div(ratio)
  }
}

export namespace address {
  export let ZERO_ADDRESS = Address.fromString('0x0000000000000000000000000000000000000000')
}
