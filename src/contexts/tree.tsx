
import { searchPath } from "fumadocs-core/breadcrumb";
import { usePathname } from "fumadocs-core/framework";
import * as PageTree from "fumadocs-core/page-tree";
import { createContext, type ReactNode, use, useMemo, useRef } from "react";
import type { LayoutTab } from "@/layouts/shared";

type Root = (PageTree.Root | PageTree.Folder) & { $id: string };

const TreeContext = createContext<{ root: Root; full: PageTree.Root } | null>(null);
const PathContext = createContext<PageTree.Node[]>([]);

export function TreeContextProvider({
  tree: rawTree,
  children,
}: {
  tree: PageTree.Root;
  children: ReactNode;
}) {
  const nextId = useRef(0);
  const pathname = usePathname();
  const tree = useMemo(() => rawTree, [rawTree.$id]);
  const path = useMemo(
    () =>
      searchPath(tree.children, pathname) ??
      (tree.fallback ? searchPath(tree.fallback.children, pathname) : null) ??
      [],
    [tree, pathname],
  );
  const root = (path.findLast((item) => item.type === "folder" && item.root) ?? tree) as Root;
  root.$id ??= String(nextId.current++);

  return (
    <TreeContext value={useMemo(() => ({ root, full: tree }), [root, tree])}>
      <PathContext value={path}>{children}</PathContext>
    </TreeContext>
  );
}

export const useTreePath = () => use(PathContext);

export function useTreeContext() {
  const context = use(TreeContext);
  if (!context) throw new Error("You must wrap this component under <DocsLayout />");
  return context;
}

export function useTabsGroups(tabs: LayoutTab[]) {
  const { full: tree } = useTreeContext();
  const path = useTreePath();

  return useMemo(() => {
    const groups: { active?: PageTree.Folder; options: LayoutTab[] }[] = [];
    const last = path.at(-1);
    const page = last?.type === "page" ? last : undefined;
    let scope: PageTree.Root | PageTree.Folder =
      tree.fallback && !tree.children.includes(path[0]) ? tree.fallback : tree;

    for (const node of path) {
      if (node.type !== "folder" || !node.root) continue;
      const group = { active: node, options: [] as LayoutTab[] };
      collectTabs(scope, node, page, tabs, group.options);
      if (group.options.length > 0) groups.push(group);
      scope = node;
    }

    const custom = tabs.filter((tab) => !tab.$folder);
    if (custom.length > 0) {
      const group = groups.findLast((item) => item.active?.root === true);
      if (group) group.options.push(...custom);
      else groups.push({ options: custom });
    }
    return groups;
  }, [tabs, tree, path]);
}

function collectTabs(
  scope: PageTree.Root | PageTree.Folder,
  active: PageTree.Folder,
  page: PageTree.Item | undefined,
  tabs: LayoutTab[],
  output: LayoutTab[],
) {
  for (const node of scope.children) {
    if (node.type !== "folder") continue;
    if (node.root === active.root) {
      const tab = tabs.find(
        (item) => item.$folder && (item.$folder === node || item.$folder.$id === node.$id),
      );
      if (!tab) continue;
      const projection = page && PageTree.findProjection(active, node, page);
      output.push(projection ? { ...tab, url: projection.url } : tab);
    } else if (!node.root) {
      collectTabs(node, active, page, tabs, output);
    }
  }
}
