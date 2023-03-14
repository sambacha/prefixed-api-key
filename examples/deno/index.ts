// USAGE : deno run examples/deno/index.ts

//@deno-types="../../dist/index.d.ts"
import { createKey, getKeyId, verifyKey } from "../../dist/index.mjs"

const hmacKey = crypto.getRandomValues(new Uint8Array(32))

// simulate client
const client: { key?: string } = {}

// simulate server DB
const DB: Record<string, any> = {}

// server : generate a new key for the client
const created = createKey({
  prefix: "mycompany_key",
  hmacKey,
})

console.log("created", created)

// server : store the id and clientSecretHashOrHmac in the database
// along with the user's ID whom it represents.
DB[created.server.id] = {
  id: created.server.id,
  verifier: created.server.verifier, // Uint8Array, encode to base64 or hex for storage if desired
  userId: "123",
  createdAt: created.server.timestamp,
}
console.log("DB", DB)

// client : send the key to the client
client.key = created.key
console.log("client", client)

// ... time passes ...
// client : sends the key to the server in 'Authorization: Bearer KEY' request.

// server : extract the ID from the Key
const keyId = getKeyId(client.key)

// server : query the DB for the key (SELECT * FROM keys WHERE id = keyId)
const dbRecord = DB[keyId]

// Verify that the clientSecretHashOrHmac, newly calculated from the client.key,
// matches the one stored in the DB. If they match, the client is authenticated.
const verified = verifyKey({
  key: client.key,
  verifier: dbRecord.verifier,
  hmacKey, // Must be the same as used in createKey()
})
console.log("verified", verified)
