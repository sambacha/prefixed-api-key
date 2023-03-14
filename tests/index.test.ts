/* eslint-disable @typescript-eslint/ban-ts-comment */
import { randomBytes } from "@stablelib/random"
import { isValid } from "ulidx"
import { beforeEach, describe, expect, test, vi } from "vitest"
import { createKey, getKeyId, verifyKey } from "../src/index"

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

describe("function", () => {
  beforeEach(async (context) => {
    context.hmacKey = randomBytes(32)
    context.prefix = "mycompany_key"
    context.createdKey = createKey({
      prefix: context.prefix,
      hmacKey: context.hmacKey,
    })
  })

  describe("createKey", () => {
    test("should return object with key properties", async (context) => {
      const { createdKey } = context

      expect(createdKey).not.toBeNull()
      expect(createdKey).toHaveProperty("key")
      expect(createdKey.key).toBeTypeOf("string")
      expect(createdKey).toHaveProperty("server")
      expect(createdKey.server).toBeInstanceOf(Object)
      expect(createdKey.server).toHaveProperty("id")
      expect(createdKey.server.id).toBeTypeOf("string")
      expect(isValid(createdKey.server.id)).toBeTruthy()
      expect(createdKey.server).toHaveProperty("timestamp")
      expect(createdKey.server.timestamp).toBeInstanceOf(Date)
      expect(createdKey.server).toHaveProperty("verifier")
      expect(createdKey.server.verifier).toBeInstanceOf(Uint8Array)
    })

    test("should accept a normal prefix", async (context) => {
      const createdKey = createKey({
        prefix: "a_test_prefix",
        hmacKey: context.hmacKey,
      })

      expect(createdKey).not.toBeNull()
      expect(createdKey).toHaveProperty("key")
      expect(createdKey.key).toContain("a_test_prefix")
    })

    test("should throw if prefix is empty", async (context) => {
      expect(async () =>
        createKey({ prefix: "", hmacKey: context.hmacKey })
      ).rejects.toThrowError(
        'Validation error: Must be a valid prefix (a-z0-9_) at "prefix"'
      )
    })

    test("should throw if prefix is not a string", async (context) => {
      expect(async () => {
        // @ts-expect-error
        createKey({ prefix: 123, hmacKey: context.hmacKey })
      }).rejects.toThrowError(
        'Validation error: Expected string, received number at "prefix"'
      )
    })

    test("should throw if prefix contains an invalid character", async (context) => {
      expect(async () =>
        createKey({ prefix: "foo-bar", hmacKey: context.hmacKey })
      ).rejects.toThrowError(
        'Validation error: Must be a valid prefix (a-z0-9_) at "prefix"'
      )
    })

    test("should throw if hmacKey too short", async (context) => {
      expect(async () =>
        createKey({ prefix: context.prefix, hmacKey: randomBytes(31) })
      ).rejects.toThrowError(
        'Validation error: Must be a 32 byte Uint8Array at "hmacKey"'
      )
    })

    test("should throw if hmacKey too long", async (context) => {
      expect(async () =>
        createKey({ prefix: context.prefix, hmacKey: randomBytes(33) })
      ).rejects.toThrowError(
        'Validation error: Must be a 32 byte Uint8Array at "hmacKey"'
      )
    })
  })

  describe("getKeyId", () => {
    test("should extract ID from key", async (context) => {
      const { createdKey } = context
      expect(createdKey.key).toContain(`_${getKeyId(createdKey.key)}_`)
    })

    test("should throw if the Key is malformed", async (context) => {
      expect(async () =>
        getKeyId(
          "my_cool_company_01GV6CCP76AG4J23E06E9WP4FN-6Gf7Pnv33XR3VXW54brSqP2bWNtCJu77NE9FudEHF1xSoMwmF" // an underscore was changed to a hyphen
        )
      ).rejects.toThrowError(
        "Validation error: Must use only valid [a-zA-Z0-9_] characters; Must have a valid ULID as the ID"
      )
    })

    test("should throw if the ID embedded in a Key has less than 26 characters", async (context) => {
      expect(async () =>
        getKeyId(
          "mycompany_key_01GV6CCP76AG4J23E06E9WP4F_2FuayFaeu14tHcGFLq8HiWQ8ZGoZo9brEsxZmgvGxaYMKbYGuZ" // the ID portion of this Key was changed to remove a trailing 'N'
        )
      ).rejects.toThrowError(
        "Validation error: Must have a valid ULID as the ID"
      )
    })

    test("should throw if the ID embedded in a Key has more than 26 characters", async (context) => {
      expect(async () =>
        getKeyId(
          "mycompany_key_01GV6CCP76AG4J23E06E9WP4FNF_2FuayFaeu14tHcGFLq8HiWQ8ZGoZo9brEsxZmgvGxaYMKbYGuZ" // the ID portion of this Key was changed to add an extra 'F'
        )
      ).rejects.toThrowError(
        "Validation error: Must have a valid ULID as the ID"
      )
    })
  })

  describe("verifyKey", () => {
    test("should return true if verifiers match", async (context) => {
      const { createdKey } = context

      expect(
        verifyKey({
          key: createdKey.key,
          verifier: createdKey.server.verifier,
          hmacKey: context.hmacKey,
        })
      ).toEqual(true)
    })

    test("should return false if verifiers do not match", async (context) => {
      const { createdKey } = context

      const invalidVerifier = randomBytes(32)

      expect(
        verifyKey({
          key: createdKey.key,
          verifier: invalidVerifier,
          hmacKey: context.hmacKey,
        })
      ).toEqual(false)
    })

    test("should throw if key validation error", async (context) => {
      const { createdKey } = context

      // prettier-ignore
      expect(async () => {
        // @ts-expect-error
        verifyKey({ key: 123, verifier: createdKey.server.verifier, hmacKey: context.hmacKey })
      }).rejects.toThrowError(
        'Validation error: Expected string, received number at "key"'
      )
    })

    test("should return true if isAfter < ID", async (context) => {
      const { createdKey } = context

      const pastDate = new Date(Date.now() - 1000)

      expect(
        verifyKey({
          key: createdKey.key,
          verifier: createdKey.server.verifier,
          hmacKey: context.hmacKey,
          isAfter: pastDate,
        })
      ).toEqual(true)
    })

    test("should return false if ID < isAfter", async (context) => {
      vi.useFakeTimers()
      const date = new Date(2023, 1, 1)
      vi.setSystemTime(date)
      const createdKey = createKey({
        prefix: "old_key",
        hmacKey: context.hmacKey,
      })
      vi.useRealTimers()

      expect(
        verifyKey({
          key: createdKey.key,
          verifier: createdKey.server.verifier,
          hmacKey: context.hmacKey,
          isAfter: new Date(Date.now() - 1_000), // one second ago
        })
      ).toEqual(false)
    })

    test("should return true if ID < isBefore", async (context) => {
      const { createdKey } = context

      const futureDate = new Date(Date.now() + 1000)

      expect(
        verifyKey({
          key: createdKey.key,
          verifier: createdKey.server.verifier,
          hmacKey: context.hmacKey,
          isBefore: futureDate,
        })
      ).toEqual(true)
    })

    test("should return true if isAfter < ID < isBefore", async (context) => {
      const hmacKey = randomBytes(32)
      const isAfter = new Date(2023, 1, 1)

      vi.useFakeTimers()
      const fakeDate = new Date(2023, 6, 1)
      vi.setSystemTime(fakeDate)
      // will be created with a ULID linked to fakeDate
      const createdKey = createKey({ prefix: "old_key", hmacKey: hmacKey })
      vi.useRealTimers()

      expect(
        verifyKey({
          key: createdKey.key,
          verifier: createdKey.server.verifier,
          hmacKey: hmacKey,
          isAfter: isAfter,
          isBefore: new Date(2023, 12, 31),
        })
      ).toEqual(true)
    })

    test("should return false if isAfter < isBefore < ID", async (context) => {
      const { createdKey } = context

      const pastDate = new Date(Date.now() - 10_000)
      const largerPastDate = new Date(Date.now() - 9_000)

      expect(
        verifyKey({
          key: createdKey.key,
          verifier: createdKey.server.verifier,
          hmacKey: context.hmacKey,
          isAfter: pastDate,
          isBefore: largerPastDate,
        })
      ).toEqual(false)
    })

    test("should return false if ID < isAfter < isBefore", async (context) => {
      vi.useFakeTimers()
      const fakeDate = new Date(2023, 1, 1)
      vi.setSystemTime(fakeDate)
      // will be created with a ULID linked to fakeDate
      const createdKey = createKey({
        prefix: "old_key",
        hmacKey: context.hmacKey,
      })
      vi.useRealTimers()

      const isAfterDate = new Date(Date.now() - 2_000)
      const isBeforeDate = new Date(Date.now() - 1_000)

      expect(
        verifyKey({
          key: createdKey.key,
          verifier: createdKey.server.verifier,
          hmacKey: context.hmacKey,
          isAfter: isAfterDate,
          isBefore: isBeforeDate,
        })
      ).toEqual(false)
    })

    test("should throw if isAfter > isBefore", async (context) => {
      const { createdKey } = context

      expect(async () => {
        verifyKey({
          key: createdKey.key,
          verifier: createdKey.server.verifier,
          hmacKey: context.hmacKey,
          isAfter: new Date(Date.now() - 1_000),
          isBefore: new Date(Date.now() - 2_000),
        })
      }).rejects.toThrowError(
        "Validation error: isAfter must be before isBefore"
      )
    })
  })
})
