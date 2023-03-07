import { randomBytes, createHash } from "node:crypto"
import { promisify } from "node:util"
import bs58 from "bs58"
import padStart from "lodash/padStart"

export interface GenerateAPIKeyOptions {
  keyPrefix?: string
  shortTokenPrefix?: string
  shortTokenLength?: number
  longTokenLength?: number
}

export function checkAPIKey(
  token: string,
  expectedLongTokenHash: string
): boolean {
  return hashLongToken(extractLongToken(token)) === expectedLongTokenHash
}

export function extractLongToken(token: string) {
  return token.split("_").slice(-1)?.[0]
}

export function extractLongTokenHash(token: string) {
  return hashLongToken(extractLongToken(token))
}

export function extractShortToken(token: string) {
  return token.split("_")?.[1]
}

export async function generateAPIKey({
  keyPrefix,
  shortTokenPrefix = "",
  shortTokenLength = 8,
  longTokenLength = 24,
}: GenerateAPIKeyOptions = {}) {
  if (!keyPrefix) return {}

  const generatedRandomBytes = promisify(randomBytes)
  const [shortTokenBytes, longTokenBytes] = await Promise.all([
    // you need ~0.732 * length bytes, but it's fine to have more bytes
    generatedRandomBytes(shortTokenLength),
    generatedRandomBytes(longTokenLength),
  ])

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

  shortToken = (shortTokenPrefix + shortToken).slice(0, shortTokenLength)

  const token = `${keyPrefix}_${shortToken}_${longToken}`

  return { shortToken, longToken, longTokenHash, token }
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
  return createHash("sha256").update(longToken).digest("hex")
}
