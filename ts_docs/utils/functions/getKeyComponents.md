[**@truestamp/prefixed-api-key**](../../README.md) • **Docs**

***

[@truestamp/prefixed-api-key](../../modules.md) / [utils](../README.md) / getKeyComponents

# Function: getKeyComponents()

> **getKeyComponents**(`key`): `object`

Use a regex to split the key into 3 parts, the prefix, the ID, and the secret. The
three parts of the key are separated by underscores. The last part is the secret,
the penultimate part is the id, and everything prior to that is the prefix. Since
this is a private function, we can assume that the key has already been checked for
valid shape.

## Parameters

• **key**: `string`

API key

## Returns

`object`

Object with prefix, id, and secret

### id

> **id**: [`Id`](../../types/type-aliases/Id.md)

### prefix

> **prefix**: [`Prefix`](../../types/type-aliases/Prefix.md)

### secret

> **secret**: `string`

## Throws

Error if the key is invalid

## Defined in

[src/utils.ts:31](https://github.com/truestamp/prefixed-api-key/blob/a442a9135df9692910e0ddbc7baa293fbe409002/src/utils.ts#L31)
