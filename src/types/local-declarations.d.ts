export {};
// safe packages overriden this addressType which brings type errors
//   here we do this to bring back the original addressType.
// doc: https://abitype.dev/config#configuration
// safe related pr: https://github.com/safe-global/safe-core-sdk/pull/1132
declare module 'abitype' {
  interface Register {
    addressType: `0x${string}`;
    bytesType: {
      inputs: `0x${string}`;
      outputs: `0x${string}`;
    };
  }
}
