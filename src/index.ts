import bs58 from "bs58"
import padStart from "lodash/padStart"
import { equal } from "@stablelib/constant-time"
import { randomBytes } from "@stablelib/random"
import { hash } from "@stablelib/sha256"
import { encode } from "@stablelib/hex"

export interface GenerateAPIKeyOptions {
  keyPrefix: string
  shortTokenPrefix?: string
  shortTokenLength?: number
  longTokenLength?: number
}

export interface APIKey {
  longToken: string
  longTokenHash: string
  prefix: string
  shortToken: string
  token: string
}

// Alphabet used for base58 encoding
// 123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz
// See : https://www.npmjs.com/package/base-x
export const BASE_58_REGEX = /^[1-9A-HJ-NP-Za-km-z]+$/

export const HEX_REGEX = /^[0-9a-f]+$/

export const PREFIX_MIN_LENGTH = 1

export const PREFIX_MAX_LENGTH = 64

export const SHORT_TOKEN_MIN_BYTES = 4

export const SHORT_TOKEN_DEFAULT_BYTES = 8

export const SHORT_TOKEN_MAX_BYTES = 24

export const LONG_TOKEN_MIN_BYTES = 4

export const LONG_TOKEN_DEFAULT_BYTES = 24

export const LONG_TOKEN_MAX_BYTES = 24

export const PREFIX_REGEX = /^[a-z0-9_]{1,64}$/

export const SHORT_TOKEN_PREFIX_REGEX = /^[a-z0-9]{1,16}$/

export const SHORT_TOKEN_REGEX = /^[a-zA-Z0-9]+$/

export const TOKEN_SEGMENTS_MIN_LENGTH = 3

export const TOKEN_SEGMENTS_MAX_LENGTH = 10

// Split and validate a token, returning an object
// with all sub-components present and valid.
export function parseToken(token: string): APIKey {
  if (!token || typeof token !== "string") {
    throw new Error(`Invalid token : must be a string : ${typeof token}`)
  }

  const splitToken = token.split("_")
  const splitTokenLength = splitToken.length

  if (splitTokenLength < TOKEN_SEGMENTS_MIN_LENGTH) {
    throw new Error(`Invalid token : too few segments : ${splitTokenLength}`)
  }

  if (splitTokenLength > TOKEN_SEGMENTS_MAX_LENGTH) {
    throw new Error(`Invalid token : too many segments : ${splitTokenLength}`)
  }

  const longToken = splitToken[splitTokenLength - 1]

  // Check that the longToken is a valid base58 string
  if (!BASE_58_REGEX.test(longToken)) {
    throw new Error(
      `Invalid token : longToken is not a valid base58 string : ${longToken}`
    )
  }

  const longTokenHash = hashLongToken(longToken)

  const shortToken = splitToken[splitTokenLength - 2]

  // Check that the shortToken is a valid base58 string
  if (!SHORT_TOKEN_REGEX.test(shortToken)) {
    throw new Error(
      `Invalid token : shortToken is not a valid string : ${shortToken}`
    )
  }

  // Reconstruct the entire prefix
  const prefix = splitToken.slice(0, splitTokenLength - 2).join("_")

  return {
    longToken,
    longTokenHash,
    prefix,
    shortToken,
    token: `${prefix}_${shortToken}_${longToken}`,
  }
}

export function checkAPIKey(
  token: string,
  expectedLongTokenHash: string
): boolean {
  const parsedToken = parseToken(token)

  if (!HEX_REGEX.test(expectedLongTokenHash)) {
    throw new Error(
      `Invalid expectedLongTokenHash : not a valid hex string : ${expectedLongTokenHash}`
    )
  }

  const hashedLongTokenUint8Array = new TextEncoder().encode(
    hashLongToken(parsedToken.longToken)
  )

  const expectedLongTokenHashUint8Array = new TextEncoder().encode(
    expectedLongTokenHash
  )

  // constant-time comparison
  return equal(hashedLongTokenUint8Array, expectedLongTokenHashUint8Array)
}

export function extractLongToken(token: string) {
  const parsedToken = parseToken(token)
  return parsedToken.longToken
}

export function extractLongTokenHash(token: string) {
  const parsedToken = parseToken(token)
  return parsedToken.longTokenHash
}

export function extractShortToken(token: string) {
  const parsedToken = parseToken(token)
  return parsedToken.shortToken
}

export function generateAPIKey(options: GenerateAPIKeyOptions): APIKey {
  if (!options) {
    throw new Error("options object is required")
  }

  const { keyPrefix, shortTokenPrefix, shortTokenLength, longTokenLength } =
    options

  if (
    !keyPrefix ||
    typeof keyPrefix !== "string" ||
    !PREFIX_REGEX.test(keyPrefix)
  ) {
    throw new Error(
      "keyPrefix is required and must contain no more than 64 lowercase letter, number, or underscore (_) characters"
    )
  }

  if (
    shortTokenPrefix &&
    (typeof shortTokenPrefix !== "string" ||
      !SHORT_TOKEN_PREFIX_REGEX.test(shortTokenPrefix))
  ) {
    throw new Error(
      "shortTokenPrefix must contain no more than 16 lowercase letter or number characters"
    )
  }

  if (
    shortTokenLength &&
    (typeof shortTokenLength !== "number" ||
      shortTokenLength < SHORT_TOKEN_MIN_BYTES ||
      shortTokenLength > SHORT_TOKEN_MAX_BYTES)
  ) {
    throw new Error(
      `shortTokenLength must be a number between ${SHORT_TOKEN_MIN_BYTES} and ${SHORT_TOKEN_MAX_BYTES} : ${shortTokenLength}`
    )
  }

  if (
    longTokenLength &&
    (typeof longTokenLength !== "number" ||
      longTokenLength < LONG_TOKEN_MIN_BYTES ||
      longTokenLength > LONG_TOKEN_MAX_BYTES)
  ) {
    throw new Error(
      `longTokenLength must be a number between ${LONG_TOKEN_MIN_BYTES} and ${LONG_TOKEN_MAX_BYTES} : ${longTokenLength}`
    )
  }

  // You need ~0.732 * length bytes, but it's fine to have more bytes
  const shortTokenBytes = randomBytes(
    shortTokenLength ?? SHORT_TOKEN_DEFAULT_BYTES
  )
  const longTokenBytes = randomBytes(
    longTokenLength ?? LONG_TOKEN_DEFAULT_BYTES
  )

  let shortToken = padStart(
    bs58.encode(shortTokenBytes),
    shortTokenLength,
    "0"
  ).slice(0, shortTokenLength)

  const longToken = padStart(
    bs58.encode(longTokenBytes),
    longTokenLength,
    "0"
  ).slice(0, longTokenLength)

  const longTokenHash = hashLongToken(longToken)

  shortToken = `${shortTokenPrefix ? shortTokenPrefix : ""}${shortToken}`.slice(
    0,
    shortTokenLength
  )

  const token = `${keyPrefix}_${shortToken}_${longToken}`

  const apiKey: APIKey = {
    longToken,
    longTokenHash,
    prefix: keyPrefix,
    shortToken,
    token,
  }

  return apiKey
}

export function getTokenComponents(token: string) {
  return parseToken(token)
}

export function hashLongToken(longToken: string) {
  if (
    !longToken ||
    typeof longToken !== "string" ||
    !BASE_58_REGEX.test(longToken)
  ) {
    throw new Error(`Invalid longToken : ${longToken}`)
  }

  const hashedLongToken = hash(new TextEncoder().encode(longToken))
  return encode(hashedLongToken, true) // true = lowercase hex
}
