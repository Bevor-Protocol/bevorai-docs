"use client";

import { useEffect, useLayoutEffect, useState } from "react";

const groupListeners = new Map<string, Set<(value: string) => void>>();

const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export const useSharedSelection = (groupId: string) => {
  const [value, setValue] = useState<string>();

  useIsomorphicLayoutEffect(() => {
    const stored = sessionStorage.getItem(groupId);
    if (stored) setValue(stored);

    const listeners = groupListeners.get(groupId) ?? new Set();
    listeners.add(setValue);
    groupListeners.set(groupId, listeners);

    return () => {
      listeners.delete(setValue);
    };
  }, [groupId]);

  const select = (next: string) => {
    sessionStorage.setItem(groupId, next);
    for (const listener of groupListeners.get(groupId) ?? []) listener(next);
  };

  return [value, select] as const;
};
