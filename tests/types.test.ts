/* eslint-disable @typescript-eslint/ban-ts-comment */
import { base58check } from "@scure/base"
import { randomBytes } from "@stablelib/random"
import { hash } from "@stablelib/sha256"
import { ulid } from "ulidx"
import { beforeEach, describe, expect, test } from "vitest"
import { createKey } from "../src/index"
import {
  HmacKeySchema,
  IdSchema,
  KeySchema,
  PrefixSchema,
  VerifierSchema,
} from "../src/types"

declare module "vitest" {
  export interface TestContext {
    hmacKey: Uint8Array
    prefix: string
    createdKey: {
      key: string
      server: {
        id: string
        verifier: Uint8Array
        timestamp: Date
      }
    }
  }
}

describe("type", () => {
  beforeEach(async (context) => {
    context.hmacKey = randomBytes(32)
    context.prefix = "mycompany_key"
    context.createdKey = createKey({
      prefix: context.prefix,
      hmacKey: context.hmacKey,
    })
  })

  describe("PrefixSchema", () => {
    test("should parse a valid prefix", async (context) => {
      expect(PrefixSchema.parse(context.prefix)).toBeTruthy()
    })
  })

  describe("IdSchema", () => {
    test("should parse a valid ID", async (context) => {
      expect(IdSchema.parse(ulid())).toBeTruthy()
    })
  })

  describe("VerifierSchema", () => {
    test("should parse a verifier", async (context) => {
      expect(
        VerifierSchema.parse(context.createdKey.server.verifier)
      ).toBeTruthy()
    })
  })

  describe("HmacKeySchema", () => {
    test("should parse an hmacKey", async (context) => {
      expect(HmacKeySchema.parse(context.hmacKey)).toBeTruthy()
    })
  })

  describe("KeySchema", () => {
    test("should parse a valid key", async (context) => {
      expect(KeySchema.parse(context.createdKey.key)).toBeTruthy()
    })

    test("should throw if key has an invalid character", async (context) => {
      expect(async () => {
        const keyObj = createKey({
          prefix: context.prefix,
          hmacKey: randomBytes(32),
        })
        await KeySchema.parse(keyObj.key.replace("_", "-"))
      }).rejects.toThrowError("Must use only valid [a-zA-Z0-9_] characters")
    })

    test("should throw if key has too few parts", async (context) => {
      expect(async () => {
        await KeySchema.parse(`ABC_123`)
      }).rejects.toThrowError(
        "Must have at least 3 parts and at most 5 parts, separated by _"
      )
    })

    test("should throw if key has too many parts", async (context) => {
      expect(async () => {
        await KeySchema.parse(
          `a_b_c_d_e_f_g_${ulid()}_${base58check(hash).encode(randomBytes(32))}`
        )
      }).rejects.toThrowError(
        "Must have at least 3 parts and at most 5 parts, separated by _"
      )
    })

    test("should throw if ULID ID has too many parts", async (context) => {
      expect(async () => {
        await KeySchema.parse(
          `a_b_c_d_e_f_g_${ulid()}_${base58check(hash).encode(randomBytes(32))}`
        )
      }).rejects.toThrowError(
        "Must have at least 3 parts and at most 5 parts, separated by _"
      )
    })
  })
})
