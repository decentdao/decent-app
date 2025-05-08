export interface BigIntValuePair {
  /** A stringified, user-parseable, decimal representation of `bigintValue`. */
  value: string;

  /** The actual, unformatted `bigint` value. */
  bigintValue?: bigint;
}
