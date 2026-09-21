import type * as PageTree from "fumadocs-core/page-tree";
import { useTreeContext } from "@/contexts/tree";

const cache = new WeakMap<object, PageTree.Item[]>();

export function useFooterItems() {
  const { root } = useTreeContext();
  const cached = cache.get(root);
  if (cached) return cached;

  const items: PageTree.Item[] = [];
  const visit = (node: PageTree.Node) => {
    if (node.type === "folder") {
      if (node.index) visit(node.index);
      node.children.forEach(visit);
    } else if (node.type === "page" && !node.external) {
      items.push(node);
    }
  };
  root.children.forEach(visit);
  cache.set(root, items);
  return items;
}
