import { keccak256, toHex } from 'viem';

export const ROLES = {
  TRANSFER_FROM_ROLE: keccak256(toHex('TRANSFER_FROM_ROLE')),
  TRANSFER_TO_ROLE: keccak256(toHex('TRANSFER_TO_ROLE')),
  MINTER_ROLE: keccak256(toHex('MINTER_ROLE')),
};
