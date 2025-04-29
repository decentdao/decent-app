export const bigintSerializer = (_: string, value: any) => {
  if (typeof value === 'bigint') {
    // need to convert bigint to string
    return value.toString();
  }
  return value;
};
