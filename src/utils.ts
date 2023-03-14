import { HMAC } from "@stablelib/hmac"
import { SHA256 } from "@stablelib/sha256"
import { Id, Prefix } from "./types"

/**
 *  HMAC-SHA256(key, id || secret)

 * @param secret 32 Byte Uint8Array
 * @param hmacKey 32 Byte Uint8Array
 * @returns Uint8Array of length 32
 */
export function hmacSecret(
  secret: Uint8Array,
  hmacKey: Uint8Array
): Uint8Array {
  const h = new HMAC(SHA256, hmacKey)
  h.update(secret)
  return h.digest()
}

/**
 * Use a regex to split the key into 3 parts, the prefix, the ID, and the secret. The
 * three parts of the key are separated by underscores. The last part is the secret,
 * the penultimate part is the id, and everything prior to that is the prefix. Since
 * this is a private function, we can assume that the key has already been checked for
 * valid shape.
 * @param key - API key
 * @returns Object with prefix, id, and secret
 * @throws Error if the key is invalid
 * */
export function getKeyComponents(key: string): {
  prefix: Prefix
  id: Id
  secret: string
} {
  const splitKey = key.match(/(.*)_(.*)_(.*)/)
  if (!splitKey || splitKey.length !== 4) {
    throw new Error("Invalid key")
  }

  const prefix = splitKey[1]
  const id = splitKey[2]
  const secret = splitKey[3]

  return { prefix, id, secret }
}
