[**@truestamp/prefixed-api-key**](../../README.md) • **Docs**

***

[@truestamp/prefixed-api-key](../../modules.md) / [index](../README.md) / verifyKey

# Function: verifyKey()

> **verifyKey**(`options`): `boolean`

Verify that the calculated client secret HMAC-SHA256 matches the server stored verifier.

## Parameters

• **options**

• **options.hmacKey**: `Uint8Array` = `HmacKeySchema`

server 32 Byte HMAC-SHA256 secret key

• **options.isAfter?**: `Date` = `...`

optional date to check that the key was created after

• **options.isBefore?**: `Date` = `...`

optional date to check that the key was created before

• **options.key**: `string` = `KeySchema`

client provided key to verify

• **options.verifier**: `Uint8Array` = `VerifierSchema`

server stored HMAC-SHA256 value to match against

## Returns

`boolean`

true if the client HMAC-SHA256 matches the server stored value
         false if the client HMAC-SHA256 does not match the server stored value

## Throws

Error if the options are invalid

## Defined in

[src/index.ts:107](https://github.com/truestamp/prefixed-api-key/blob/a442a9135df9692910e0ddbc7baa293fbe409002/src/index.ts#L107)
