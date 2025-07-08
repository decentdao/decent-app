export function isNonEmpty(val: any) {
  if (val === undefined || val === null) return false;
  if (Array.isArray(val)) return val.length > 0;
  if (typeof val === 'object') return Object.keys(val).length > 0;
  return Boolean(val);
}
