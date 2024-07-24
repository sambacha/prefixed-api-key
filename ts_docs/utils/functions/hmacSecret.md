[**@truestamp/prefixed-api-key**](../../README.md) • **Docs**

***

[@truestamp/prefixed-api-key](../../modules.md) / [utils](../README.md) / hmacSecret

# Function: hmacSecret()

> **hmacSecret**(`secret`, `hmacKey`): `Uint8Array`

HMAC-SHA256(key, id || secret)

## Parameters

• **secret**: `Uint8Array`

32 Byte Uint8Array

• **hmacKey**: `Uint8Array`

32 Byte Uint8Array

## Returns

`Uint8Array`

Uint8Array of length 32

## Defined in

[src/utils.ts:12](https://github.com/truestamp/prefixed-api-key/blob/a442a9135df9692910e0ddbc7baa293fbe409002/src/utils.ts#L12)
