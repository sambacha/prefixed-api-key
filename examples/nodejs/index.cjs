/* eslint-disable @typescript-eslint/no-var-requires */

// USAGE : node examples/nodejs/index.cjs

const {
  checkAPIKey,
  extractLongToken,
  extractShortToken,
  hashLongToken,
  generateAPIKey,
  getTokenComponents,
} = require("../../dist/index.js")

const key = generateAPIKey({ keyPrefix: "mycompany" })
console.log("key", key)

const shortToken = extractShortToken(key.token)
console.log("shortToken", shortToken)

const longToken = extractLongToken(key.token)
console.log("longToken", longToken)

const hashedLongToken = hashLongToken(longToken)
console.log("hashedLongToken", hashedLongToken)

const components = getTokenComponents(key.token)
console.log("components", components)

const isValid = checkAPIKey(key.token, key.longTokenHash)
console.log("isValid", isValid)
