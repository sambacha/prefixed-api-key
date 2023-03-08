/* eslint-disable @typescript-eslint/ban-ts-comment */
import { beforeEach, describe, expect, test } from "vitest"

import {
  APIKey,
  checkAPIKey,
  extractLongToken,
  extractLongTokenHash,
  extractShortToken,
  generateAPIKey,
  getTokenComponents,
  hashLongToken,
  parseToken,
} from "../src/index"

declare module "vitest" {
  export interface TestContext {
    key: APIKey
  }
}

describe("function", () => {
  beforeEach(async (context) => {
    context.key = generateAPIKey({ keyPrefix: "my_company" })
  })

  describe("parseToken", () => {
    test("should return object with key properties", async (context) => {
      const { key } = context

      const parsedKey = parseToken(key.token)

      expect(parsedKey).not.toBeNull()
      expect(parsedKey).toHaveProperty("longToken")
      expect(parsedKey).toHaveProperty("longTokenHash")
      expect(parsedKey).toHaveProperty("prefix")
      expect(parsedKey).toHaveProperty("shortToken")
      expect(parsedKey).toHaveProperty("token")
    })

    test("should throw if token arg is not a string", async (context) => {
      expect(
        // @ts-expect-error
        async () => parseToken(undefined)
      ).rejects.toThrowError("Invalid token : must be a string : undefined")
    })

    test("should throw if too few segments", async (context) => {
      const { key } = context

      expect(async () =>
        parseToken(key.token.replace(/my_company_/g, ""))
      ).rejects.toThrowError("Invalid token : too few segments : 2")
    })

    test("should throw if too many segments", async (context) => {
      const { key } = context

      expect(async () =>
        parseToken(
          key.token.replace(
            /my_company_/g,
            "foo_bar_baz_qux_abc_123_456_8910_zxc_"
          )
        )
      ).rejects.toThrowError("Invalid token : too many segments : 11")
    })

    test("should throw if token is not strict Base 58", async (context) => {
      const { key } = context

      expect(async () =>
        parseToken(
          key.token + "!" // add invalid char
        )
      ).rejects.toThrowError(
        "Invalid token : longToken is not a valid base58 string"
      )
    })

    test("should throw if shortToken contains an invalid character", async (context) => {
      const { key } = context

      expect(async () =>
        parseToken("my_company_BRTR***KFsL_51FwqftsmMDHHbJAMEXXHCgG")
      ).rejects.toThrowError("Invalid token : shortToken is not a valid string")
    })
  })

  describe("generateAPIKey", () => {
    test("should return object with key properties", async (context) => {
      const { key } = context

      expect(key).not.toBeNull()
      expect(key).toHaveProperty("longToken")
      expect(key).toHaveProperty("longTokenHash")
      expect(key).toHaveProperty("shortToken")
      expect(key).toHaveProperty("token")
    })

    test("should accept and validate keyPrefix arg with chars [a-z0-9_]", async (context) => {
      const key = generateAPIKey({ keyPrefix: "my_company_1_2_three" })

      expect(key).not.toBeNull()
      expect(key).toHaveProperty("longToken")
      expect(key).toHaveProperty("longTokenHash")
      expect(key).toHaveProperty("shortToken")
      expect(key).toHaveProperty("token")
      expect(checkAPIKey(key.token, key.longTokenHash)).toEqual(true)
    })

    test("should accept and validate shortTokenPrefix arg with chars [a-z0-9]", async (context) => {
      const key = generateAPIKey({
        keyPrefix: "my_company",
        shortTokenPrefix: "myprefix123",
      })

      expect(key).not.toBeNull()
      expect(key).toHaveProperty("shortToken")
      expect(key.shortToken).toMatch(/^myprefix123/)
      expect(checkAPIKey(key.token, key.longTokenHash)).toEqual(true)
    })

    test("should accept and validate shortTokenLength arg with 4", async (context) => {
      const key = generateAPIKey({
        keyPrefix: "my_company",
        shortTokenLength: 4,
      })

      expect(key).not.toBeNull()
      expect(key).toHaveProperty("shortToken")
      expect(key.shortToken.length).toEqual(4)
      expect(checkAPIKey(key.token, key.longTokenHash)).toEqual(true)
    })

    test("should accept and validate shortTokenLength arg with 24", async (context) => {
      const key = generateAPIKey({
        keyPrefix: "my_company",
        shortTokenLength: 24,
      })

      expect(key).not.toBeNull()
      expect(key).toHaveProperty("shortToken")
      expect(key.shortToken.length).toEqual(24)
      expect(checkAPIKey(key.token, key.longTokenHash)).toEqual(true)
    })

    test("should accept and validate longTokenLength arg with 4", async (context) => {
      const key = generateAPIKey({
        keyPrefix: "my_company",
        longTokenLength: 4,
      })

      expect(key).not.toBeNull()
      expect(key).toHaveProperty("shortToken")
      expect(key.longToken.length).toEqual(4)
      expect(checkAPIKey(key.token, key.longTokenHash)).toEqual(true)
    })

    test("should accept and validate longTokenLength arg with 24", async (context) => {
      const key = generateAPIKey({
        keyPrefix: "my_company",
        longTokenLength: 24,
      })

      expect(key).not.toBeNull()
      expect(key).toHaveProperty("longToken")
      expect(key.longToken.length).toEqual(24)
      expect(checkAPIKey(key.token, key.longTokenHash)).toEqual(true)
    })

    test("should throw if no object arg is provided", async (context) => {
      // @ts-expect-error
      expect(async () => generateAPIKey()).rejects.toThrowError(
        "options object is required"
      )
    })

    test("should throw if keyPrefix arg is missing", async (context) => {
      // @ts-expect-error
      expect(async () => generateAPIKey({})).rejects.toThrowError(
        "keyPrefix is required"
      )
    })

    test("should throw if keyPrefix arg is not a string", async (context) => {
      expect(
        // @ts-expect-error
        async () => generateAPIKey({ keyPrefix: 1 })
      ).rejects.toThrowError("keyPrefix is required")
    })

    test("should throw if keyPrefix has an invalid character", async (context) => {
      expect(async () =>
        generateAPIKey({ keyPrefix: "foo*bar" })
      ).rejects.toThrowError("keyPrefix is required")
    })

    test("should throw if shortTokenPrefix has an invalid character", async (context) => {
      expect(async () =>
        generateAPIKey({
          keyPrefix: "my_company",
          shortTokenPrefix: "foo*bar",
        })
      ).rejects.toThrowError(
        "shortTokenPrefix must contain no more than 16 lowercase letter or number characters"
      )
    })

    test("should throw if shortTokenLength is not a number", async (context) => {
      // prettier-ignore
      expect(
        async () =>
        // @ts-ignore-error
        generateAPIKey({ keyPrefix: "my_company", shortTokenLength: "1" })
      ).rejects.toThrowError(
        "shortTokenLength must be a number between 4 and 24"
      )
    })

    test("should throw if shortTokenLength is < 4", async (context) => {
      expect(async () =>
        generateAPIKey({
          keyPrefix: "my_company",
          shortTokenLength: 3,
        })
      ).rejects.toThrowError(
        "shortTokenLength must be a number between 4 and 24"
      )
    })

    test("should throw if shortTokenLength is > 24", async (context) => {
      expect(async () =>
        generateAPIKey({
          keyPrefix: "my_company",
          shortTokenLength: 25,
        })
      ).rejects.toThrowError(
        "shortTokenLength must be a number between 4 and 24"
      )
    })

    test("should throw if longTokenLength is not a number", async (context) => {
      // prettier-ignore
      expect(
        async () =>
        // @ts-ignore-error
        generateAPIKey({ keyPrefix: "my_company", longTokenLength: "1" })
      ).rejects.toThrowError(
        "longTokenLength must be a number between 4 and 24 : 1"
      )
    })

    test("should throw if longTokenLength is < 4", async (context) => {
      expect(async () =>
        generateAPIKey({
          keyPrefix: "my_company",
          longTokenLength: 3,
        })
      ).rejects.toThrowError(
        "longTokenLength must be a number between 4 and 24 : 3"
      )
    })

    test("should throw if longTokenLength is > 24", async (context) => {
      expect(async () =>
        generateAPIKey({
          keyPrefix: "my_company",
          longTokenLength: 25,
        })
      ).rejects.toThrowError(
        "longTokenLength must be a number between 4 and 24 : 25"
      )
    })
  })

  describe("checkAPIKey", () => {
    test("should return true if long token hash matches", async (context) => {
      const { key } = context

      expect(checkAPIKey(key.token, key.longTokenHash)).toEqual(true)
    })

    test("should throw if long token hash does not match", async (context) => {
      const { key } = context

      expect(async () => checkAPIKey(key.token, "foo")).rejects.toThrowError(
        "Invalid expectedLongTokenHash : not a valid hex string : foo"
      )
    })
  })

  describe("extractLongToken", () => {
    test("should return long token", async (context) => {
      const { key } = context

      expect(extractLongToken(key.token)).toEqual(key.longToken)
    })
  })

  describe("extractLongTokenHash", () => {
    test("should return long token hash", async (context) => {
      const { key } = context

      expect(extractLongTokenHash(key.token)).toEqual(key.longTokenHash)
    })
  })

  describe("extractShortToken", () => {
    test("should return short token", async (context) => {
      const { key } = context

      expect(extractShortToken(key.token)).toEqual(key.shortToken)
    })
  })

  describe("getTokenComponents", () => {
    test("should return object with key components", async (context) => {
      const { key } = context

      expect(getTokenComponents(key.token)).toEqual(key)
    })

    test("should return correct components of a known token", async () => {
      const exampleKey = {
        shortToken: "BRTRKFsL",
        longToken: "51FwqftsmMDHHbJAMEXXHCgG",
        longTokenHash:
          "d70d981d87b449c107327c2a2afbf00d4b58070d6ba571aac35d7ea3e7c79f37",
        prefix: "my_company",
        token: "my_company_BRTRKFsL_51FwqftsmMDHHbJAMEXXHCgG",
      }

      expect(getTokenComponents(exampleKey.token)).toEqual(exampleKey)
    })
  })

  describe("hashLongToken", () => {
    test("should return hash of long token", async (context) => {
      const { key } = context

      expect(hashLongToken(key.longToken)).toEqual(key.longTokenHash)
    })

    test("should throw if longToken contains an invalid character", async (context) => {
      const { key } = context

      expect(
        async () => hashLongToken(key.longToken + "!") // add invalid character
      ).rejects.toThrowError("Invalid longToken")
    })
  })
})
