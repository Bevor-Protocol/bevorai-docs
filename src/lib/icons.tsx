import {
  Blocks,
  BookOpen,
  Boxes,
  Braces,
  Building2,
  Code,
  FileCode,
  GitBranch,
  Hammer,
  LayoutDashboard,
  Library,
  MessagesSquare,
  Network,
  Plug,
  Rocket,
  Search,
  Shield,
  Terminal,
  User,
  Webhook,
  Workflow,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { createElement } from 'react';

// Mintlify used Font Awesome names in its navigation config; map them onto Lucide.
const icons = {
  rocket: Rocket,
  'diagram-project': Workflow,
  plug: Plug,
  shield: Shield,
  code: Code,
  book: Library,
  'book-open': BookOpen,
  terminal: Terminal,
  python: FileCode,
  buildings: Building2,
  user: User,
  hammer: Hammer,
  webhook: Webhook,
  'share-nodes': Network,
  'circle-nodes': Network,
  'code-branch': GitBranch,
  desktop: LayoutDashboard,
  comments: MessagesSquare,
  'magnifying-glass': Search,
  braces: Braces,
  blocks: Blocks,
  boxes: Boxes,
} satisfies Record<string, typeof Rocket>;

export const resolveIcon = (icon: string | undefined): ReactNode => {
  if (!icon) return;
  const Comp = icons[icon as keyof typeof icons];
  if (!Comp) return;

  return createElement(Comp);
};
