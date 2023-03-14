import { base58check } from "@scure/base"
import { hash } from "@stablelib/sha256"
import { isValid } from "ulidx"
import { z } from "zod"

// Base32 Alphabet
// "0123456789ABCDEFGHJKMNPQRSTVWXYZ"
// See : https://www.npmjs.com/package/base-x
const BASE_32_REGEX = /^[0-9ABCDEFGHJKMNPQRSTVWXYZ]+$/i

const PREFIX_REGEX = /^[a-z0-9]{1,16}(_[a-z0-9]{1,16}){0,2}$/
// What does this regex do?
//
// ^ - start of string
// [a-z0-9]{1,16} - prefix, 1-16 characters, lowercase letters and numbers
// (_[a-z0-9]{1,16}){0,2} - optional suffix, 1-16 characters, lowercase letters and numbers
// $ - end of string

export const PrefixSchema = z.string().regex(PREFIX_REGEX, {
  message: "Must be a valid prefix (a-z0-9_)",
})

export type Prefix = z.infer<typeof PrefixSchema>

export const IdSchema = z.string().regex(BASE_32_REGEX, {
  message: "Must be a valid Base32 (Crockford) encoded string",
})

export type Id = z.infer<typeof IdSchema>

// 32 Byte Verifier
export const VerifierSchema = z.instanceof(Uint8Array).refine(
  (value) => {
    return value.length === 32
  },
  {
    message: "Must be a 32 byte Uint8Array",
  }
)

export type Verifier = z.infer<typeof VerifierSchema>

// 32 Byte HMAC Key
// See : https://crypto.stackexchange.com/questions/34864/key-size-for-hmac-sha256
export const HmacKeySchema = z.instanceof(Uint8Array).refine(
  (value) => {
    return value.length === 32
  },
  {
    message: "Must be a 32 byte Uint8Array",
  }
)

export type HmacKey = z.infer<typeof HmacKeySchema>

export const KeySchema = z
  .string()
  .refine(
    (value) => {
      // test the whole key to make sure it only contains valid characters
      const regex = /^[a-zA-Z0-9_]+$/
      return regex.test(value)
    },
    {
      message: "Must use only valid [a-zA-Z0-9_] characters",
    }
  )
  .refine(
    (value) => {
      const splitKey = value.split("_")
      if (splitKey.length < 3 || splitKey.length > 8) {
        return false
      }
      return true
    },
    {
      message: "Must have at least 3 parts and at most 5 parts, separated by _",
    }
  )
  .refine(
    (value) => {
      // test the beginning of the key
      const prefixRegex = /^[a-z0-9]{1,16}(_[a-z0-9]{1,16}){0,2}_/
      return prefixRegex.test(value)
    },
    {
      message:
        "Must have a valid prefix with between 1 and 3 character groups separated with '_', each with minimum 1 and maximum 16 [a-z0-9] characters",
    }
  )
  .refine(
    (value) => {
      const splitKey = value.split("_")
      const id = splitKey[splitKey.length - 2]
      return isValid(id)
    },
    {
      message: "Must have a valid ULID as the ID",
    }
  )
  .refine(
    (value) => {
      try {
        const splitKey = value.split("_")
        const secret = splitKey[splitKey.length - 1]
        const decoded = base58check(hash).decode(secret)
        return decoded.length === 32
      } catch (error) {
        return false
      }
    },
    {
      message: "Must have a valid 32 byte Base58Check encoded secret",
    }
  )

export type Key = z.infer<typeof KeySchema>

export const CreateOptionsSchema = z
  .object({
    hmacKey: HmacKeySchema,
    prefix: PrefixSchema,
  })
  .strict()

export type CreateOptions = z.infer<typeof CreateOptionsSchema>

export const VerifyOptionsSchema = z
  .object({
    hmacKey: HmacKeySchema, // server secret
    key: KeySchema, // client provided value
    verifier: VerifierSchema, // server stored value to match against
    isAfter: z.date().optional(),
    isBefore: z.date().optional(),
  })
  .strict()
  .refine(
    (value) => {
      if (value.isAfter && value.isBefore) {
        return value.isAfter < value.isBefore
      }
      return true
    },
    {
      message: "isAfter must be before isBefore",
    }
  )
  .refine(
    (value) => {
      if (value.isAfter) {
        const now = new Date()
        return value.isAfter < now
      }
      return true
    },
    {
      message: "isAfter must be in the past",
    }
  )

export type VerifyOptions = z.infer<typeof VerifyOptionsSchema>
