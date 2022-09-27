import { BigNumber } from 'ethers';
import { Transaction } from '../../../../controller/Modules/injectors/TreasuryInjectorContext';
import {
  ERC20TokenEvent,
  TokenDepositEvent,
  TokenWithdrawEvent,
  TokenEventType,
} from '../../../../providers/treasury/types';
import ContentBox from '../../../ui/ContentBox';
import ContentBoxTitle from '../../../ui/ContentBoxTitle';
import EtherscanTransactionLink from '../../../ui/EtherscanTransactionLink';

type TransactionCardProps = {
  transaction: Transaction;
};

function TransactionCard({ transaction }: TransactionCardProps) {
  const showAmount = () => {
    const nativeTransaction = transaction as TokenDepositEvent | TokenWithdrawEvent;
    if (nativeTransaction.amount?.toString) {
      return nativeTransaction.amount.toString();
    } else if (nativeTransaction.amount) {
      return nativeTransaction.amount;
    }

    const tokenTransaction = transaction as ERC20TokenEvent;
    if (tokenTransaction.amounts) {
      return tokenTransaction.amounts.map((amount: BigNumber) => amount.toString());
    }
  };

  return (
    <ContentBox key={transaction.transactionHash}>
      <ContentBoxTitle>
        <>
          {transaction.eventType === TokenEventType.DEPOSIT ? 'Received' : 'Sent'} {showAmount()}
        </>
      </ContentBoxTitle>
      <EtherscanTransactionLink txHash={transaction.transactionHash}>
        View on Etherscan
      </EtherscanTransactionLink>
    </ContentBox>
  );
}

export default TransactionCard;
