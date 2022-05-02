import { AllocationInput, TokenAllocation } from "../../../daoData/useDeployDAO";
import { TextButton } from '../../ui/forms/Button';
import Input from "../../ui/forms/Input";

interface TokenAllocationProps {
  index: number;
  tokenAllocation: TokenAllocation;
  errorMap: Map<number, AllocationInput>
  updateTokenAllocation: (index: number, tokenAllocation: TokenAllocation) => void;
  removeTokenAllocation: (index: number) => void;
}

const TokenAllocationInput = ({ index, tokenAllocation, errorMap, updateTokenAllocation, removeTokenAllocation }: TokenAllocationProps) => {
  
  const updateAddress = (address: string) => {
    updateTokenAllocation(index, {
      address: address,
      amount: tokenAllocation.amount,
    });
  };

  const updateAmount = (amount: string) => {
    updateTokenAllocation(index, {
      address: tokenAllocation.address,
      amount: Number(amount),
    });
  };

  return (
    <>
      <Input
        containerClassName="col-start-1 col-helperspan-4 md:col-span-5 w-full"
        type="text"
        value={tokenAllocation.address || ""}
        onChange={(event) => updateAddress(event.target.value)}
        errorMessage={errorMap.get(index)?.error || ""}
      />
      <Input
        containerClassName="col-span-2 md:pt-0"
        type="number"
        value={tokenAllocation.amount || ""}
        onChange={(event) => updateAmount(event.target.value)}
        isWholeNumberOnly
      />
      <div className="md:col-span-1">
        <TextButton type="button" onClick={() => removeTokenAllocation(index)} label="Remove" className="px-0 mx-0"/>
      </div>
    </>
  );
};

export default TokenAllocationInput;
