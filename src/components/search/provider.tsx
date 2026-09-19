import { Dialog } from "@base-ui/react/dialog";
import {
  createContext,
  lazy,
  type ReactNode,
  Suspense,
  use,
  useEffect,
  useEffectEvent,
  useMemo,
  useState,
} from "react";

export interface HotKey {
  display: ReactNode;
  /** Key code, or a predicate deciding whether the key is pressed. */
  key: string | ((event: KeyboardEvent) => boolean);
}

interface SearchContextValue {
  enabled: boolean;
  open: boolean;
  hotKey: HotKey[];
  setOpenSearch: (open: boolean) => void;
  dialogHandle: Dialog.Handle<unknown>;
}

/** Shared between the trigger and the dialog so the trigger can stay a plain button. */
const dialogHandle = Dialog.createHandle();

const SearchContext = createContext<SearchContextValue>({
  enabled: false,
  open: false,
  hotKey: [],
  setOpenSearch: () => undefined,
  dialogHandle,
});

export const useSearchContext = () => use(SearchContext);

const ModifierKey = () => {
  const [key, setKey] = useState("⌘");

  useEffect(() => {
    if (/Windows|Linux/i.test(window.navigator.userAgent)) setKey("Ctrl");
  }, []);

  return key;
};

const defaultHotKey: HotKey[] = [
  { key: (event) => event.metaKey || event.ctrlKey, display: <ModifierKey /> },
  { key: "k", display: "K" },
];

// code-split the search client out of the main bundle; it still mounts with the provider
// because the Base UI dialog needs to exist for the trigger's handle to resolve
const SearchDialog = lazy(() => import("./dialog").then((mod) => ({ default: mod.SearchDialog })));

export const SearchProvider = ({
  children,
  hotKey = defaultHotKey,
}: {
  children: ReactNode;
  hotKey?: HotKey[];
}) => {
  const [open, setOpen] = useState(false);

  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    const pressed = hotKey.every((entry) =>
      typeof entry.key === "string" ? event.key === entry.key : entry.key(event),
    );
    if (!pressed) return;

    setOpen((value) => !value);
    event.preventDefault();
  });

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <SearchContext
      value={useMemo(
        () => ({ enabled: true, open, hotKey, setOpenSearch: setOpen, dialogHandle }),
        [open, hotKey],
      )}
    >
      <Suspense fallback={null}>
        <SearchDialog open={open} onOpenChange={setOpen} dialogHandle={dialogHandle} />
      </Suspense>
      {children}
    </SearchContext>
  );
};
