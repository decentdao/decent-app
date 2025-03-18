export interface BigIntValuePair {
  /** A stringified, user-parseable, decimal representation of `bigintValue`. */
  value: string;

  /** The actual, unformatted `bigint` value. */
  bigintValue?: bigint;
}

export type WithError = { error?: string };

declare module 'abitype' {
  export interface Register {
    addressType: `0x${string}`;
    bytesType: `0x${string}`;
  }
}
