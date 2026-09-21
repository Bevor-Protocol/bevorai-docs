import type { MouseEventHandler } from "react";
import { useEffect, useRef, useState } from "react";

export const useCopyButton = (
  onCopy: () => void | Promise<void>,
): [checked: boolean, onClick: MouseEventHandler] => {
  const [checked, setChecked] = useState(false);
  const timeout = useRef<number>(undefined);

  useEffect(() => () => window.clearTimeout(timeout.current), []);

  const onClick: MouseEventHandler = async () => {
    await onCopy();
    setChecked(true);
    window.clearTimeout(timeout.current);
    timeout.current = window.setTimeout(() => setChecked(false), 1500);
  };

  return [checked, onClick];
};
