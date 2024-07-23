/* eslint-disable @typescript-eslint/ban-ts-comment */
import { HMAC } from "@stablelib/hmac"
import { randomBytes } from "@stablelib/random"
import { SHA256 } from "@stablelib/sha256"
import { beforeEach, describe, expect, test } from "vitest"
import { createKey } from "../src/index.js"
import { getKeyComponents, hmacSecret } from "../src/utils.js"

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

  describe("hashOrHmacSecret", () => {
    test("should return expected HMAC-SHA256", async (context) => {
      const secret = randomBytes(32)
      const hmacKey = randomBytes(32)

      const h = new HMAC(SHA256, hmacKey)
      h.update(secret)

      expect(hmacSecret(secret, hmacKey)).toBeInstanceOf(Uint8Array)
      expect(hmacSecret(secret, hmacKey)).toEqual(h.digest())
    })
  })

  describe("getKeyComponents", () => {
    test("should return expected key components", async (context) => {
      const testPrefix = "mycompany_test_key"
      const testId = "01GVBCBRKCB5MZKZ9YZX2VA1F4"
      const testSecret = "21DVujAuSVV2TcL81fsN7MfrvnrY6hjEQfSCzs2rvsimJLmrLP"
      const testKey = `${testPrefix}_${testId}_${testSecret}`

      const { prefix, id, secret } = getKeyComponents(testKey)

      expect(prefix).toBe(testPrefix)
      expect(id).toBe(testId)
      expect(secret).toBe(testSecret)
    })

    test("should throw if key has too few parts", async (context) => {
      expect(async () => {
        getKeyComponents(
          "01GVBCBRKCB5MZKZ9YZX2VA1F4_21DVujAuSVV2TcL81fsN7MfrvnrY6hjEQfSCzs2rvsimJLmrLP"
        )
      }).rejects.toThrowError("Invalid key")
    })
  })
})
