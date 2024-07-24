[**@truestamp/prefixed-api-key**](../../README.md) • **Docs**

***

[@truestamp/prefixed-api-key](../../modules.md) / [index](../README.md) / createKey

# Function: createKey()

> **createKey**(`options`): `object`

Create a new API key.

## Parameters

• **options**

Options to create a new API key

• **options.hmacKey**: `Uint8Array` = `HmacKeySchema`

32 Byte HMAC SHA-256 secret key for signing the verifier

• **options.prefix**: `string` = `PrefixSchema`

Prefix to use for the API key [a-z0-9_]

## Returns

`object`

The API key, and the server side components

### key

> **key**: `string`

### server

> **server**: `object`

### server.id

> **id**: `string`

### server.timestamp

> **timestamp**: `Date`

### server.verifier

> **verifier**: `Uint8Array`

## Throws

Error if the options are invalid

## Defined in

[src/index.ts:28](https://github.com/truestamp/prefixed-api-key/blob/a442a9135df9692910e0ddbc7baa293fbe409002/src/index.ts#L28)
