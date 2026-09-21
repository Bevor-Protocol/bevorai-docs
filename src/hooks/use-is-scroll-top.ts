import { useEffect, useState } from "react";

export function useIsScrollTop({ enabled = true }: { enabled?: boolean }) {
  const [isTop, setIsTop] = useState<boolean>();

  useEffect(() => {
    if (!enabled) return;
    const update = () => setIsTop(window.scrollY < 10);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [enabled]);

  return isTop;
}
