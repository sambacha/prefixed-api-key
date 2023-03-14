import { base58check } from "@scure/base"
import { randomBytes } from "@stablelib/random"
import { hash } from "@stablelib/sha256"
import { bench } from "vitest"
import { createKey, getKeyId, verifyKey } from "../src/index"

const hmacKey = randomBytes(32)

bench("create", () => {
  createKey({ prefix: "my_company", hmacKey })
})

bench("getKeyId", () => {
  getKeyId(
    "mycompany_key_01GV6RTXBNP68214TTJGNFH25R_ZYDW9ZFcZLT51WPE4yxU3WAK1g4A5bS46SDuTH8SHzVtKrH5h"
  )
})

bench("verify", () => {
  const verifier = base58check(hash).decode(
    "RG2F9aD1sJ1ojxyhrxt6VHHyT3C5nXY1poiPaQsKY9trYxngG"
  )
  verifyKey({
    key: "mycompany_key_01GV6RTXBNP68214TTJGNFH25R_ZYDW9ZFcZLT51WPE4yxU3WAK1g4A5bS46SDuTH8SHzVtKrH5h",
    verifier,
    hmacKey,
  })
})
