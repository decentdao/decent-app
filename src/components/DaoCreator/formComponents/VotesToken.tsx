import { useTranslation } from 'react-i18next';
import { ICreationStepProps, TokenCreationType } from '../../../types';
import { InputSection } from '../../input/InputSection';
import { TextInput, BigIntTextInput } from '../../input/TextInput';
import { CreateDAOPresenter } from '../presenters/CreateDAOPresenter';

export function VotesToken(props: ICreationStepProps) {
  const { values, handleChange, setFieldValue } = props;
  const { t } = useTranslation('daoCreate');

  const newToken = values.erc20Token.tokenCreationType == TokenCreationType.NEW;

  const { tokenName, tokenSymbol, tokenSupply } = CreateDAOPresenter.tokenConfig(
    t,
    values.erc20Token.tokenCreationType,
    values.erc20Token.tokenSupply.bigintValue,
    name => {
      if (newToken) {
        setFieldValue('erc20Token.tokenName', name);
      }
    },
    event => {
      if (newToken) {
        handleChange(event);
      }
    },
    supply => {
      if (newToken) {
        setFieldValue('erc20Token.tokenSupply', supply);
      }
    },
  );

  const section = CreateDAOPresenter.section(t('titleTokenParams'));
  return (
    <InputSection {...section}>
      <TextInput {...tokenName} />
      <TextInput {...tokenSymbol} />
      <BigIntTextInput {...tokenSupply} />
    </InputSection>
  );
}
