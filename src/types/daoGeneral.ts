import { Address } from 'viem';
import { NetworkPrefix } from './network';

export type DAOKey = `${NetworkPrefix}:${Address}`;

export enum DAOState {
  freezeInit = 'stateFreezeInit',
  frozen = 'stateFrozen',
}
