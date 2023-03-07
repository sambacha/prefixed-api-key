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
  shortToken: string
  longToken: string
  longTokenHash: string
  token: string
}

export function checkAPIKey(
  token: string,
  expectedLongTokenHash: string
): boolean {
  const hashedLongTokenUint8Array = new TextEncoder().encode(
    hashLongToken(extractLongToken(token))
  )
  const expectedLongTokenHashUint8Array = new TextEncoder().encode(
    expectedLongTokenHash
  )

  return equal(hashedLongTokenUint8Array, expectedLongTokenHashUint8Array)
}

export function extractLongToken(token: string) {
  // Work backwards from the end of the token so we can handle tokens with
  // multiple underscores in the prefix. Split the token on '_'
  // and return the last item.
  return token.split("_").slice(-1)?.[0]
}

export function extractLongTokenHash(token: string) {
  return hashLongToken(extractLongToken(token))
}

export function extractShortToken(token: string) {
  // Work backwards from the end of the token so we can handle tokens with
  // multiple underscores in the prefix. Split the token on '_'
  // and return the second to last item.
  return token.split("_").slice(-2, -1)?.[0]
}

export async function generateAPIKey(
  options: GenerateAPIKeyOptions
): Promise<APIKey> {
  if (!options) {
    throw new Error("options object is required")
  }

  const { keyPrefix, shortTokenPrefix, shortTokenLength, longTokenLength } =
    options

  if (
    !keyPrefix ||
    typeof keyPrefix !== "string" ||
    !/^[a-z0-9_]+$/.test(keyPrefix)
  ) {
    throw new Error(
      "keyPrefix is required and must only contain lowercase letters and numbers (a-z), or underscore (_)"
    )
  }

  if (
    shortTokenPrefix &&
    (typeof shortTokenPrefix !== "string" ||
      !/^[a-z0-9]+$/.test(shortTokenPrefix))
  ) {
    throw new Error(
      "shortTokenPrefix must only contain lowercase letters and numbers"
    )
  }

  if (
    shortTokenLength &&
    (typeof shortTokenLength !== "number" ||
      shortTokenLength < 4 ||
      shortTokenLength > 24)
  ) {
    throw new Error("shortTokenLength must be a number between 4 and 24")
  }

  if (
    longTokenLength &&
    (typeof longTokenLength !== "number" ||
      longTokenLength < 4 ||
      longTokenLength > 24)
  ) {
    throw new Error("longTokenLength must be a number between 4 and 24")
  }

  // You need ~0.732 * length bytes, but it's fine to have more bytes
  const shortTokenBytes = randomBytes(shortTokenLength ?? 8) // default to 8
  const longTokenBytes = randomBytes(longTokenLength ?? 24) // default to 24

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
    shortToken,
    token,
  }

  return apiKey
}

export function getTokenComponents(token: string) {
  const longToken = extractLongToken(token)
  return {
    longToken,
    shortToken: extractShortToken(token),
    longTokenHash: hashLongToken(longToken),
    token,
  }
}

export function hashLongToken(longToken: string) {
  const hashedLongToken = hash(new TextEncoder().encode(longToken))
  return encode(hashedLongToken, true) // true = lowercase
}
