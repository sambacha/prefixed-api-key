import { bench, describe } from "vitest"

import { checkAPIKey, generateAPIKey } from "../src/index"

bench("generateAPIKey", () => {
  generateAPIKey({ keyPrefix: "my_company" })
})

bench("checkAPIKey", () => {
  checkAPIKey(
    "my_company_BRTRKFsL_51FwqftsmMDHHbJAMEXXHCgG",
    "d70d981d87b449c107327c2a2afbf00d4b58070d6ba571aac35d7ea3e7c79f37"
  )
})
