import { Address } from 'viem';

export type NetworkPrefix = 'base' | 'eth' | 'oeth' | 'matic' | 'sep';

export type DAOKey = `${NetworkPrefix}:${Address}`;

export enum DAOState {
  freezeInit = 'stateFreezeInit',
  frozen = 'stateFrozen',
}
