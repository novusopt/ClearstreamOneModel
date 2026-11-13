"use client";

import dagre from "@dagrejs/dagre";
import { Background, BackgroundVariant, Controls, Handle, MarkerType, Position, ReactFlow } from "@xyflow/react";
import type { Edge, Node, NodeProps } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { STATUS_DOT } from "@/components/app/bits";
import { LIFECYCLE_META } from "@/lib/lifecycle";
import type { DataContract, DataProduct } from "@/lib/types";
import { LIFECYCLE } from "@/lib/types";
import { cx } from "@/utils/cx";

const WIDTH = 272;
const HEADER = 74;
const ROW = 26;

type ProductNodeData = { product: DataProduct; focus: boolean };
type ProductNode = Node<ProductNodeData, "product">;

const rowsOf = (product: DataProduct) => Math.max(product.inputPorts.length, product.outputPorts.length, 1);
const heightOf = (product: DataProduct) => HEADER + rowsOf(product) * ROW + 12;

function ProductNodeView({ data }: NodeProps<ProductNode>) {
  const { product, focus } = data;
  const empty = product.inputPorts.length + product.outputPorts.length === 0;
  return (
    <div
      style={{ width: WIDTH }}
      className={cx(
        "cursor-pointer rounded-xl border bg-primary shadow-sm transition-shadow hover:shadow-lg",
        focus ? "border-brand ring-4 ring-brand-100" : "border-primary",
        product.status === "proposed" && "border-dashed",
        product.status === "retired" && "opacity-60",
      )}
    >
      <div className="border-b border-secondary px-3.5 pt-3 pb-2.5">
        <p className="flex items-center justify-between gap-2 font-mono text-[10.5px] tracking-[0.08em] text-tertiary uppercase">
          {product.domain}
          <span className="flex items-center gap-1.5 tracking-normal normal-case">
            <span className={cx("size-1.5 rounded-full", STATUS_DOT[product.status])} />
            {LIFECYCLE_META[product.status].label}
          </span>
        </p>
        <p className="mt-1 truncate font-display text-[15px] font-semibold text-primary">{product.title}</p>
      </div>
      <div className="relative px-3.5 py-1.5">
        {empty && <p className="py-1 text-xs text-quaternary">No ports yet</p>}
        {Array.from({ length: empty ? 0 : rowsOf(product) }, (_, index) => {
          const input = product.inputPorts[index];
          const output = product.outputPorts[index];
          return (
            <div key={index} style={{ height: ROW }} className="relative flex items-center justify-between gap-3 font-mono text-[11.5px]">
              <span className="truncate text-tertiary">{input?.name}</span>
              <span className="truncate font-medium text-brand-secondary">{output?.name}</span>
              {input && <Handle id={`in:${input.name}`} type="target" position={Position.Left} className="!-left-[18px] !size-2 !border-2 !border-white !bg-ink-400" />}
              {output && <Handle id={`out:${output.name}`} type="source" position={Position.Right} className="!-right-[18px] !size-2 !border-2 !border-white !bg-brand-500" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const nodeTypes = { product: ProductNodeView };

function layout(products: DataProduct[], contracts: DataContract[], focusId?: string) {
  const contractById = new Map(contracts.map((contract) => [contract.id, contract]));
  const links = products.flatMap((consumer) =>
    consumer.inputPorts.flatMap((port) => {
      const contract = contractById.get(port.contractId);
      return contract ? [{ from: contract.productId, fromPort: contract.port, to: consumer.id, toPort: port.name }] : [];
    }),
  );

  let visible = products;
  if (focusId) {
    const keep = new Set([focusId]);
    for (const link of links) {
      if (link.from === focusId) keep.add(link.to);
      if (link.to === focusId) keep.add(link.from);
    }
    visible = products.filter((product) => keep.has(product.id));
  }
  const ids = new Set(visible.map((product) => product.id));
  const shown = links.filter((link) => ids.has(link.from) && ids.has(link.to));

  const graph = new dagre.graphlib.Graph().setGraph({ rankdir: "LR", nodesep: 40, ranksep: 120, marginx: 24, marginy: 24 }).setDefaultEdgeLabel(() => ({}));
  for (const product of visible) graph.setNode(product.id, { width: WIDTH, height: heightOf(product) });
  for (const link of shown) graph.setEdge(link.from, link.to);
  dagre.layout(graph);

  const byId = new Map(visible.map((product) => [product.id, product]));
  const nodes: ProductNode[] = visible.map((product) => {
    const { x, y } = graph.node(product.id);
    return { id: product.id, type: "product", position: { x: x - WIDTH / 2, y: y - heightOf(product) / 2 }, data: { product, focus: product.id === focusId }, draggable: true };
  });
  const edges: Edge[] = shown.map((link) => {
    const live = byId.get(link.from)?.status === "active" && ["active", "draft"].includes(byId.get(link.to)?.status ?? "");
    const color = live ? "#1a8877" : "#a3b1ae";
    return {
      id: `${link.from}:${link.fromPort}->${link.to}:${link.toPort}`,
      source: link.from,
      sourceHandle: `out:${link.fromPort}`,
      target: link.to,
      targetHandle: `in:${link.toPort}`,
      style: { stroke: color, strokeDasharray: live ? undefined : "5 4" },
      markerEnd: { type: MarkerType.ArrowClosed, color, width: 16, height: 16 },
    };
  });
  return { nodes, edges };
}

/** Products as nodes, input-port dependencies as edges. With `focusId`, only that product and its direct neighbours. */
export function LineageMap({ products, contracts, focusId, className }: { products: DataProduct[]; contracts: DataContract[]; focusId?: string; className?: string }) {
  const router = useRouter();
  const { nodes, edges } = useMemo(() => layout(products, contracts, focusId), [products, contracts, focusId]);
  const present = LIFECYCLE.filter((status) => nodes.some((node) => node.data.product.status === status));

  return (
    <div className={cx("relative overflow-hidden rounded-xl border border-secondary bg-paper", className)}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.18, maxZoom: 1 }}
        minZoom={0.3}
        maxZoom={1.4}
        nodesConnectable={false}
        proOptions={{ hideAttribution: true }}
        onNodeClick={(_, node) => {
          const { product } = (node as ProductNode).data;
          if (product.id !== focusId) router.push(`/products/${product.domain}/${product.name}`);
        }}
      >
        <Background variant={BackgroundVariant.Dots} gap={18} size={1.2} color="rgb(11 27 25 / 0.16)" />
        <Controls showInteractive={false} position="bottom-right" />
      </ReactFlow>
      <ul className="pointer-events-none absolute top-3 left-3 flex flex-wrap gap-x-4 gap-y-1 rounded-lg border border-secondary bg-primary/90 px-3 py-2 text-xs text-secondary backdrop-blur">
        {present.map((status) => (
          <li key={status} className="flex items-center gap-1.5">
            <span className={cx("size-1.5 rounded-full", STATUS_DOT[status])} />
            {LIFECYCLE_META[status].label}
          </li>
        ))}
        <li className="flex items-center gap-1.5">
          <span className="h-px w-5 bg-brand-500" />
          feeds
        </li>
      </ul>
    </div>
  );
}
