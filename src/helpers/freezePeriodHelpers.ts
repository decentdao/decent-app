const secondsLeftInFreezePeriod = (
  freezeProposalCreatedTime: bigint,
  freezePeriod: bigint,
  currentTime: bigint,
): bigint => {
  const secondsLeft = freezeProposalCreatedTime + freezePeriod - currentTime;
  return secondsLeft;
};

const secondsLeftInFreezeProposalPeriod = (
  freezeProposalCreatedTime: bigint,
  freezeProposalPeriod: bigint,
  currentTime: bigint,
): bigint => {
  const secondsLeft = freezeProposalCreatedTime + freezeProposalPeriod - currentTime;
  return secondsLeft;
};

export const isWithinFreezePeriod = (
  freezeProposalCreatedTime: bigint,
  freezePeriod: bigint,
  currentTime: bigint,
): boolean => {
  const secondsLeft = secondsLeftInFreezePeriod(
    freezeProposalCreatedTime,
    freezePeriod,
    currentTime,
  );

  return secondsLeft > 0n;
};

export const isWithinFreezeProposalPeriod = (
  freezeProposalCreatedTime: bigint,
  freezeProposalPeriod: bigint,
  currentTime: bigint,
): boolean => {
  const secondsLeft = secondsLeftInFreezeProposalPeriod(
    freezeProposalCreatedTime,
    freezeProposalPeriod,
    currentTime,
  );

  return secondsLeft > 0n;
};
