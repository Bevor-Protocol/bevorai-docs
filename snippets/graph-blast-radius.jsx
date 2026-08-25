export const GraphBlastRadius = ({ data }) => {
  const graph = useMemo(() => {
    const nodes = data.nodes.split(";").map((row, index) => {
      const [x, y, kind, finding, scope] = row.split(",").map(Number);
      return { index, x, y, kind, finding: finding === 1, scope: scope === 1 };
    });
    const edges = data.edges.split(";").map((row) => {
      const [source, target, kind] = row.split(",").map(Number);
      return { source, target, kind };
    });
    const degree = new Array(nodes.length).fill(0);
    const outgoing = Array.from({ length: nodes.length }, () => []);
    edges.forEach((edge) => {
      degree[edge.source] += 1;
      degree[edge.target] += 1;
      outgoing[edge.source].push(edge.target);
    });
    return { nodes, edges, degree, outgoing };
  }, [data]);

  const impacts = useMemo(() => data.diffs.map((diff) => {
    const affected = new Set([diff.node]);
    const queue = [diff.node];
    while (queue.length) {
      const current = queue.shift();
      graph.outgoing[current].forEach((target) => {
        if (!affected.has(target)) {
          affected.add(target);
          queue.push(target);
        }
      });
    }
    return affected;
  }), [data, graph]);

  const diffOrder = [2, 1, 0];
  const [selectedDiff, setSelectedDiff] = useState(2);
  const [view, setView] = useState("affected");
  const affected = impacts[selectedDiff];
  const selected = data.diffs[selectedDiff];
  const maxDegree = Math.max(...graph.degree);
  const nodeRadius = (index) => 2.8 + Math.sqrt(graph.degree[index] / Math.max(maxDegree, 1)) * 5.7;
  const nodeColors = ["#f8fafc", "#34d399", "#a78bfa", "#94a3b8"];
  const edgeColors = ["#2dd4bf", "#a78bfa", "#a78bfa", "#fbbf24", "#475569"];
  const diffVisuals = [
    {
      hunk: "@@ -72,1 +72,2 @@ setVault",
      additions: 2,
      deletions: 1,
      lines: [
        { type: "remove", old: 72, text: "vault = newVault;" },
        { type: "add", next: 72, text: "require(newVault != address(0), \"zero vault\");" },
        { type: "add", next: 73, text: "vault = newVault;" },
      ],
    },
    {
      hunk: "@@ -118,1 +118,1 @@ mint",
      additions: 1,
      deletions: 1,
      lines: [
        { type: "remove", old: 118, text: "_mint(to, tokenId);" },
        { type: "add", next: 118, text: "_safeMint(to, tokenId, data);" },
      ],
    },
    {
      hunk: "@@ -184,1 +184,2 @@ supportsInterface",
      additions: 2,
      deletions: 1,
      lines: [
        { type: "remove", old: 184, text: "return super.supportsInterface(interfaceId);" },
        { type: "add", next: 184, text: "return interfaceId == type(IERC721).interfaceId" },
        { type: "add", next: 185, text: "    || super.supportsInterface(interfaceId);" },
      ],
    },
  ];
  const selectedVisual = diffVisuals[selectedDiff];

  return (
    <div className="my-7">
      <div className="mb-2 flex flex-wrap gap-2" role="tablist" aria-label="Example code diffs">
        {diffOrder.map((index) => {
          const diff = data.diffs[index];
          return (
          <button
            key={diff.label}
            type="button"
            onClick={() => { setSelectedDiff(index); setView("affected"); }}
            role="tab"
            aria-selected={selectedDiff === index}
            className={`rounded-md border px-3 py-2 text-left transition-colors ${
              selectedDiff === index
                ? "border-blue-400 bg-blue-950 text-white"
                : "border-white/10 bg-black text-zinc-400 hover:border-white/25 hover:text-white"
            }`}
          >
            <code className="text-xs text-blue-200">{diff.label}</code>
            <span className="ml-2 text-xs text-zinc-500">{impacts[index].size} affected</span>
          </button>
          );
        })}
      </div>

      <div className="mb-3 overflow-hidden rounded-lg border border-white/15 bg-black" role="tabpanel">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/15 bg-zinc-950 px-3 py-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="text-zinc-500">⌄</span>
            <code className="truncate text-xs text-zinc-300">{selected.file}</code>
          </div>
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-emerald-400">+{selectedVisual.additions}</span>
            <span className="text-red-400">-{selectedVisual.deletions}</span>
            <span className="flex gap-0.5" aria-hidden="true">
              {Array.from({ length: selectedVisual.additions }).map((_, index) => <span key={`add-${index}`} className="h-2 w-2 bg-emerald-600" />)}
              {Array.from({ length: selectedVisual.deletions }).map((_, index) => <span key={`remove-${index}`} className="h-2 w-2 bg-red-600" />)}
              <span className="h-2 w-2 bg-zinc-700" />
            </span>
          </div>
        </div>
        <div className="border-b border-blue-900 bg-blue-950 px-3 py-1.5 font-mono text-xs text-blue-300">
          {selectedVisual.hunk}
        </div>
        <div className="overflow-x-auto font-mono text-xs">
          {selectedVisual.lines.map((line, index) => {
            const added = line.type === "add";
            return (
              <div
                key={`${line.type}-${index}`}
                className="grid min-w-max"
                style={{
                  gridTemplateColumns: "2.25rem 2.25rem 1.5rem minmax(32rem, 1fr)",
                  backgroundColor: added ? "rgba(46,160,67,0.16)" : "rgba(248,81,73,0.16)",
                }}
              >
                <span className="border-r border-white/10 px-2 py-1 text-right text-zinc-600">{line.old || ""}</span>
                <span className="border-r border-white/10 px-2 py-1 text-right text-zinc-600">{line.next || ""}</span>
                <span className={`px-2 py-1 ${added ? "text-emerald-400" : "text-red-400"}`}>{added ? "+" : "-"}</span>
                <code className="whitespace-pre px-1 py-1 text-zinc-300">{line.text}</code>
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-between border-t border-white/10 px-3 py-2 text-xs">
          <span className="text-zinc-500">{selected.detail}</span>
          <span className="text-zinc-300">→ {affected.size} affected nodes</span>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-black text-zinc-200">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-xs text-zinc-500">
          <span>⌘&nbsp;&nbsp; 581 nodes&nbsp;&nbsp; 1397 edges</span>
          <div className="flex items-center gap-5">
            <span>‹/› Code</span>
            <span className="text-white">⌘ Graph</span>
          </div>
        </div>

        <div className="relative w-full bg-black" style={{ aspectRatio: "920 / 520" }}>
          <svg
            viewBox="0 0 920 560"
            className="h-full w-full"
            role="img"
            aria-labelledby="graph-title graph-description"
          >
            <title id="graph-title">Impact of the selected code diff across the product code graph</title>
            <desc id="graph-description">
              The selected small diff affects {affected.size} connected code entities. Affected nodes are colored and the rest of the graph is muted.
            </desc>
            <rect width="920" height="560" fill="#000" />
            <g transform={data.transform}>
              {graph.edges.map((edge, index) => {
                const source = graph.nodes[edge.source];
                const target = graph.nodes[edge.target];
                const isAffected = affected.has(edge.source) && affected.has(edge.target);
                const midpointX = (source.x + target.x) / 2;
                const midpointY = (source.y + target.y) / 2;
                const controlX = midpointX + (460 - midpointX) * 0.12;
                const controlY = midpointY + (280 - midpointY) * 0.12;
                return (
                  <path
                    key={index}
                    d={`M${source.x},${source.y} Q${controlX},${controlY} ${target.x},${target.y}`}
                    fill="none"
                    stroke={isAffected ? edgeColors[edge.kind] : "#475569"}
                    strokeOpacity={isAffected ? 0.64 : view === "all" ? 0.25 : 0.1}
                    strokeWidth={isAffected ? 0.9 : 0.65}
                    vectorEffect="non-scaling-stroke"
                  />
                );
              })}

              {graph.nodes.map((node) => {
                const isAffected = affected.has(node.index);
                const visible = view === "all" || isAffected;
                const fill = node.finding
                  ? "#ef4444"
                  : node.scope
                    ? "#22d3ee"
                    : visible
                      ? nodeColors[node.kind]
                      : node.kind === 0
                        ? "#525761"
                        : "#292d35";
                return (
                  <circle
                    key={node.index}
                    cx={node.x}
                    cy={node.y}
                    r={nodeRadius(node.index)}
                    fill={fill}
                    stroke={node.finding ? "#fecaca" : node.scope ? "#cffafe" : visible ? "#f8fafc" : "#535965"}
                    strokeOpacity={node.finding || node.scope ? 0.9 : visible ? 0.35 : 0.2}
                    strokeWidth={node.finding ? 1.4 : 0.7}
                  />
                );
              })}
            </g>
          </svg>

          <div className="absolute left-3 top-3 flex items-center gap-3 rounded-lg border border-white/20 bg-black/90 px-3 py-2 text-xs text-zinc-500 shadow-xl backdrop-blur sm:left-4 sm:top-4 sm:px-4">
            <span className="hidden sm:inline">% Scopes reused</span>
            <span className="text-base text-blue-300">98%</span>
            <span className="ml-1 text-base text-white">3</span>
            <span>Findings</span>
          </div>

          <div className="absolute bottom-3 left-3 w-1/2 rounded-lg border border-white/20 bg-black/95 px-3 py-2 shadow-xl backdrop-blur sm:bottom-4 sm:left-4 sm:px-4 sm:py-3">
            <div className="flex items-center gap-2.5">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-white" />
              <span className="truncate text-sm text-white sm:text-base">{selected.label}</span>
            </div>
            <p className="mt-1 truncate font-mono text-xs text-zinc-600">{selected.file}</p>
          </div>

          <div className="absolute bottom-3 right-3 flex overflow-hidden rounded-lg border border-white/15 bg-black/90 font-mono text-xs text-zinc-500 sm:bottom-4 sm:right-4">
            {["affected", "all"].map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setView(option)}
                aria-pressed={view === option}
                className={`px-3 py-2 ${view === option ? "bg-cyan-950 text-cyan-100" : "border-l border-white/10 hover:text-zinc-300"}`}
              >
                {option === "affected" ? "Affected" : "All code"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="mt-3 text-sm text-zinc-500" aria-live="polite">
        A small change to <code>{selected.label}</code> expands to {affected.size} connected nodes before analysis begins.
      </p>
    </div>
  );
};
