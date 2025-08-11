// utils/splitAddressPredictor.ts
import { Address, encodeAbiParameters, keccak256, encodePacked, getAddress } from 'viem';

export interface SplitParams {
  recipients: Address[];
  allocations: bigint[];
  totalAllocation: bigint;
  distributionIncentive: number;
}

/**
 * Replicates SplitFactoryV2._getSalt()
 * Uses bytes.concat which is direct concatenation (not packed encoding)
 */
function getSalt(splitParams: SplitParams, owner: Address, salt: string): `0x${string}` {
  // Encode the struct and owner according to Solidity ABI encoding
  const encodedData = encodeAbiParameters(
    [
      {
        components: [
          { name: 'recipients', type: 'address[]' },
          { name: 'allocations', type: 'uint256[]' },
          { name: 'totalAllocation', type: 'uint256' },
          { name: 'distributionIncentive', type: 'uint16' },
        ],
        type: 'tuple',
      },
      { name: 'owner', type: 'address' },
    ],
    [splitParams, owner],
  );

  // Ensure salt is properly formatted
  const saltHex = salt.startsWith('0x') ? salt : `0x${salt}`;

  // bytes.concat in Solidity is direct concatenation
  const concatenated = `0x${encodedData.slice(2)}${saltHex.slice(2)}`;

  return keccak256(concatenated as `0x${string}`);
}

/**
 * Replicates Clone.initCodeHash() assembly operations exactly
 * The assembly hashes 113 bytes (0x71) starting from offset 0x0f
 */
function getInitCodeHash(implementation: Address): `0x${string}` {
  // Initialize 256 bytes of memory
  const memory = new Uint8Array(256);

  /**
   * Replicate Solidity mstore behavior:
   * - mstore writes a 32-byte word to memory
   * - The value is right-padded with zeros to 32 bytes
   * - The entire 32-byte word is written starting at the specified position
   */
  const mstore = (position: number, data: string) => {
    const cleanHex = data.startsWith('0x') ? data.slice(2) : data;

    // In EVM memory words are big‑endian; the value occupies the least‑significant
    // bytes, so we must *left‑pad* with zeros to 32 bytes.
    const paddedHex = cleanHex.padStart(64, '0');

    // Write all 32 bytes starting at position
    for (let i = 0; i < 32; i++) {
      const byte = parseInt(paddedHex.substr(i * 2, 2), 16);
      memory[position + i] = byte;
    }
  };

  // Apply mstore operations in the exact order from the assembly
  // The order matters because later stores overwrite earlier ones

  // mstore(0x51, 0x5af43d3d93803e605757fd5bf3) - 13 bytes value
  mstore(0x51, '5af43d3d93803e605757fd5bf3');

  // mstore(0x44, _implementation) - 20 bytes address
  const implHex = implementation.slice(2); // Remove 0x prefix
  mstore(0x44, implHex);

  // mstore(0x30, 0x593da1005b3d3d3d3d363d3d37363d73) - 16 bytes value
  mstore(0x30, '593da1005b3d3d3d3d363d3d37363d73');

  // mstore(0x20, keccak256("ReceiveETH(uint256)")) - 32 bytes
  mstore(0x20, '9e4ac34f21c619cefc926c8bd93b54bf5a39c7ab2127a895af1cc0691d7e3dff');

  // mstore(0x00, 0x60593d8160093d39f336602c57343d527f) - 17 bytes value
  mstore(0x00, '60593d8160093d39f336602c57343d527f');

  // Extract 113 bytes (0x71) from offset 0x0f - matching the assembly exactly
  const initcode = memory.slice(0x0f, 0x0f + 0x71);

  // Convert to hex string for keccak256
  const initcodeHex = `0x${Array.from(initcode)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')}`;

  return keccak256(initcodeHex as `0x${string}`);
}

/**
 * Predicts the deterministic address of a Split V2 contract
 * This exactly replicates the Splits protocol's custom Clone library behavior
 *
 * @param splitParams - The split configuration parameters
 * @param owner - The owner address for the split
 * @param salt - Additional salt for CREATE2
 * @param deployer - The address that will deploy the contract (critical!)
 * @param splitWalletImplementation - The SplitWalletV2 implementation address
 * @returns The predicted contract address
 */
export function predictSplitContractAddress({
  splitParams,
  owner,
  salt,
  deployer,
  splitWalletImplementation,
}: {
  splitParams: SplitParams;
  owner: Address;
  salt: string;
  deployer: Address;
  splitWalletImplementation: Address;
}): Address {
  // Step 1: Generate the final salt using the factory's _getSalt logic
  const finalSalt = getSalt(splitParams, owner, salt);

  // Step 2: Generate the initcode hash using Clone library's custom assembly
  const initCodeHashValue = getInitCodeHash(splitWalletImplementation);

  // Step 3: Calculate CREATE2 address using standard formula
  const create2Hash = keccak256(
    encodePacked(
      ['bytes1', 'address', 'bytes32', 'bytes32'],
      ['0xff', deployer, finalSalt, initCodeHashValue],
    ),
  );

  // Return the last 20 bytes as the address
  return getAddress(`0x${create2Hash.slice(26)}`);
}
