import { TokenBalance } from '../types';

export function filterTokenList(tokens: TokenBalance[]) {
  return tokens.filter(
    asset => !asset.possibleSpam && !asset.nativeToken && parseFloat(asset.balance) > 0,
  );
}
