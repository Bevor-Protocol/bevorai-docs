import { useRenderContext } from 'fumadocs-openapi/ui';
import { useMemo } from 'react';

type KeyName = 'server-url' | `auth-${string}`;

export function useStorageKey() {
  const { storageKeyPrefix } = useRenderContext();

  return useMemo(
    () => ({
      of: (name: KeyName) => getStorageKey(storageKeyPrefix, name),
      AuthField: (schemeId: string) => getStorageKey(storageKeyPrefix, `auth-${schemeId}`),
    }),
    [storageKeyPrefix],
  );
}

function getStorageKey(prefix = 'fumadocs-openapi-', name: KeyName) {
  return prefix + name;
}
