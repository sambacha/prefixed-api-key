import { base58check } from '@scure/base';
import { concat } from '@stablelib/bytes';
import { equal } from '@stablelib/hmac';
import { randomBytes } from '@stablelib/random';
import { hash } from '@stablelib/sha256';
import { encode } from '@stablelib/utf8';
import { decodeTime, ulid } from 'ulidx';
import { fromZodError } from 'zod-validation-error';

import {
  CreateOptions,
  CreateOptionsSchema,
  Key,
  KeySchema,
  VerifyOptions,
  VerifyOptionsSchema,
} from './types.js';

import { getKeyComponents, hmacSecret } from './utils.js';
/**
 * Create a new API key.
 * @param options - Options to create a new API key
 * @param options.hmacKey - 32 Byte HMAC SHA-256 secret key for signing the verifier
 * @param options.prefix - Prefix to use for the API key [a-z0-9_]
 * @returns The API key, and the server side components
 * @throws Error if the options are invalid
 */
export function createKey(options: CreateOptions): {
  key: string;
  server: {
    id: string;
    verifier: Uint8Array;
    timestamp: Date;
  };
} {
  const createOptions = CreateOptionsSchema.safeParse(options);
  if (!createOptions.success) {
    const zodValidationError = fromZodError(createOptions.error);
    throw new Error(zodValidationError.message, { cause: createOptions.error });
  }

  const { prefix, hmacKey } = createOptions.data;

  // Generate a ULID to serve as a random ID. Both the client and server will know this.
  const id = ulid();
  const idBytes = encode(id);

  // Generate a random 32 byte secret. Only the client knows this.
  const secret = randomBytes(32);
  const secretBase58 = base58check(hash).encode(secret);

  // Generate a verifier. This is either the HMAC-SHA256 of the ID and secret,
  // or the SHA-256 of the ID and secret. Both constructions bind the ID and
  // secret together by concatenating them. The HMAC construction also binds
  // the HMAC key to the ID and secret. The HMAC key is only known to the server.
  const verifier = hmacSecret(concat(idBytes, secret), hmacKey);

  // Extract the timestamp from the ID ULID. This is the time that the key was created.
  // It is provided as a convenience so the createdAt date can be stored in a DB and
  // will match the timestamp in the key ID.
  const timestamp = new Date(decodeTime(id));

  const key = `${prefix}_${id}_${secretBase58}`;

  // Construct the response object so it is clear which parts are for the client
  // and which are for the server to receive.
  return {
    key: key,
    server: {
      id,
      verifier,
      timestamp,
    },
  };
}

/**
 * Extracts and validates the ID from a key. Use this to find the verifier for a key in a DB.
 * @param key - key to extract the ID from
 * @returns the ID component of the key
 * @throws Error if the key is invalid
 */
export function getKeyId(key: Key): string {
  const parsedKey = KeySchema.safeParse(key);
  if (!parsedKey.success) {
    const zodValidationError = fromZodError(parsedKey.error);
    throw new Error(zodValidationError.message, { cause: parsedKey.error });
  }

  const { id } = getKeyComponents(key);

  return id;
}

/**
 * Verify that the calculated client secret HMAC-SHA256 matches the server stored verifier.
 * @param options
 * @param options.hmacKey - server 32 Byte HMAC-SHA256 secret key
 * @param options.key - client provided key to verify
 * @param options.verifier - server stored HMAC-SHA256 value to match against
 * @param options.isAfter - optional date to check that the key was created after
 * @param options.isBefore - optional date to check that the key was created before
 * @returns true if the client HMAC-SHA256 matches the server stored value
 *          false if the client HMAC-SHA256 does not match the server stored value
 * @throws Error if the options are invalid
 */
export function verifyKey(options: VerifyOptions): boolean {
  const verifyOptions = VerifyOptionsSchema.safeParse(options);
  if (!verifyOptions.success) {
    const zodValidationError = fromZodError(verifyOptions.error);
    throw new Error(zodValidationError.message, { cause: verifyOptions.error });
  }

  const { hmacKey, isAfter, isBefore, key, verifier } = verifyOptions.data;

  const { id, secret } = getKeyComponents(key);

  const idTimestamp = decodeTime(id);

  if (isAfter && idTimestamp < isAfter.getTime()) {
    return false;
  }

  if (isBefore && idTimestamp > isBefore.getTime()) {
    return false;
  }

  const idBytes = encode(id);
  const secretBytes = base58check(hash).decode(secret);

  const newVerifier = hmacSecret(concat(idBytes, secretBytes), hmacKey);

  // constant-time comparison
  return equal(newVerifier, verifier);
}
