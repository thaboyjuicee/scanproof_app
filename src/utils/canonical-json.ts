type CanonicalPrimitive = string | number | boolean | null;
type CanonicalValue = CanonicalPrimitive | CanonicalValue[] | { [key: string]: CanonicalValue };

const isObject = (value: unknown): value is { [key: string]: CanonicalValue } => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

export const canonicalJsonStringify = (value: CanonicalValue): string => {
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJsonStringify(item)).join(',')}]`;
  }

  if (isObject(value)) {
    const sortedKeys = Object.keys(value).sort();
    const entries = sortedKeys.map((key) => `"${key}":${canonicalJsonStringify(value[key])}`);
    return `{${entries.join(',')}}`;
  }

  return JSON.stringify(value);
};
