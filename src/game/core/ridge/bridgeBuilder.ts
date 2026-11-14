export const BRIDGE_BUILDER_INK_BUDGET = 240;
export const BRIDGE_BOARD_BOUNDS = { left: 30, right: 610, top: 48, bottom: 342 } as const;

export type BridgeNodeId = string;
export type BridgeMaterial = 'beam' | 'cable';
export type BridgeTestVehicle = 'car';

export interface BridgePoint {
  x: number;
  y: number;
}

export interface BridgeNode extends BridgePoint {
  id: BridgeNodeId;
  pinned: boolean;
}

export interface BridgeBeam {
  id: string;
  a: BridgeNodeId;
  b: BridgeNodeId;
  kind: BridgeMaterial;
}

export interface BridgeDesign {
  nodes: readonly BridgeNode[];
  beams: readonly BridgeBeam[];
}

const BRIDGE_ANCHORS: readonly BridgeNode[] = [
  { id: 'west-road', x: 70, y: 210, pinned: true },
  { id: 'east-road', x: 570, y: 210, pinned: true },
  { id: 'west-cliff', x: 52, y: 318, pinned: true },
  { id: 'east-cliff', x: 588, y: 318, pinned: true }
];

const MIN_BEAM_LENGTH = 20;
const MAX_BEAM_LENGTH = 240;
const MAX_NODES = 40;
const MAX_BEAMS = 60;
const SNAP_RADIUS = 18;

export function createEmptyBridgeDesign(): BridgeDesign {
  return {
    nodes: BRIDGE_ANCHORS.map((node) => ({ ...node })),
    beams: []
  };
}

export function createCanonicalBridgeDesign(): BridgeDesign {
  let design = createEmptyBridgeDesign();
  const beams: Array<readonly [BridgePoint, BridgePoint, BridgeMaterial?]> = [
    [{ x: 70, y: 210 }, { x: 180, y: 210 }],
    [{ x: 180, y: 210 }, { x: 320, y: 210 }],
    [{ x: 320, y: 210 }, { x: 460, y: 210 }],
    [{ x: 460, y: 210 }, { x: 570, y: 210 }],
    [{ x: 70, y: 210 }, { x: 180, y: 92 }],
    [{ x: 180, y: 210 }, { x: 180, y: 92 }],
    [{ x: 180, y: 210 }, { x: 320, y: 72 }],
    [{ x: 320, y: 210 }, { x: 320, y: 72 }],
    [{ x: 320, y: 210 }, { x: 460, y: 92 }],
    [{ x: 460, y: 210 }, { x: 460, y: 92 }],
    [{ x: 460, y: 92 }, { x: 570, y: 210 }],
    [{ x: 180, y: 210 }, { x: 320, y: 318 }],
    [{ x: 320, y: 210 }, { x: 320, y: 318 }],
    [{ x: 320, y: 210 }, { x: 460, y: 318 }],
    [{ x: 460, y: 210 }, { x: 460, y: 318 }]
  ];
  for (const [a, b, kind] of beams) design = addBridgeBeam(design, a, b, kind ?? 'beam');
  return design;
}

export function bridgeNodeById(design: BridgeDesign, id: BridgeNodeId): BridgeNode {
  const node = design.nodes.find((candidate) => candidate.id === id);
  if (!node) throw new Error(`Unknown bridge joint "${id}"`);
  return node;
}

export function snapBridgePoint(
  nodes: readonly BridgeNode[],
  point: BridgePoint,
  radius = SNAP_RADIUS
): BridgeNode | null {
  let nearest: BridgeNode | null = null;
  let nearestDistance = radius;
  for (const node of nodes) {
    const distance = Math.hypot(node.x - point.x, node.y - point.y);
    if (distance <= nearestDistance) {
      nearest = node;
      nearestDistance = distance;
    }
  }
  return nearest;
}

export function canAddBridgeBeam(
  design: BridgeDesign,
  start: BridgePoint,
  end: BridgePoint,
  kind: BridgeMaterial = 'beam'
): boolean {
  const length = Math.hypot(end.x - start.x, end.y - start.y);
  if (length < MIN_BEAM_LENGTH || length > MAX_BEAM_LENGTH || design.beams.length >= MAX_BEAMS) {
    return false;
  }
  const startNode = snapBridgePoint(design.nodes, start);
  const endNode = snapBridgePoint(design.nodes, end);
  if (!startNode && !endNode && design.nodes.length + 2 > MAX_NODES) return false;
  if ((!startNode || !endNode) && design.nodes.length + 1 > MAX_NODES) return false;
  if (startNode && endNode) {
    if (startNode.id === endNode.id) return false;
    if (design.beams.some((beam) => connectsSameNodes(beam, startNode.id, endNode.id))) return false;
  }
  return bridgeInkUsed(design) + materialCost(length, kind) <= BRIDGE_BUILDER_INK_BUDGET;
}

export function addBridgeBeam(
  design: BridgeDesign,
  start: BridgePoint,
  end: BridgePoint,
  kind: BridgeMaterial = 'beam'
): BridgeDesign {
  if (!canAddBridgeBeam(design, start, end, kind)) return design;
  const withStart = upsertNode(design, start);
  const withEnd = upsertNode(withStart.design, end);
  const a = withStart.node.id;
  const b = withEnd.node.id;
  if (a === b) return design;
  return {
    nodes: withEnd.design.nodes,
    beams: [...withEnd.design.beams, { id: nextEntityId(withEnd.design.beams, 'beam'), a, b, kind }]
  };
}

export function moveBridgeNode(
  design: BridgeDesign,
  nodeId: BridgeNodeId,
  point: BridgePoint
): BridgeDesign {
  return {
    ...design,
    nodes: design.nodes.map((node) =>
      node.id === nodeId && !node.pinned
        ? { ...node, x: clampPoint(point.x, 'x'), y: clampPoint(point.y, 'y') }
        : node
    )
  };
}

export function removeBridgeBeam(design: BridgeDesign, beamId: string): BridgeDesign {
  return { ...design, beams: design.beams.filter((beam) => beam.id !== beamId) };
}

export function removeBridgeNode(design: BridgeDesign, nodeId: BridgeNodeId): BridgeDesign {
  const target = design.nodes.find((node) => node.id === nodeId);
  if (!target || target.pinned) return design;
  return {
    nodes: design.nodes.filter((node) => node.id !== nodeId),
    beams: design.beams.filter((beam) => beam.a !== nodeId && beam.b !== nodeId)
  };
}

export function bridgeInkUsed(design: BridgeDesign): number {
  return design.beams.reduce((total, beam) => {
    const a = bridgeNodeById(design, beam.a);
    const b = bridgeNodeById(design, beam.b);
    return total + materialCost(Math.hypot(a.x - b.x, a.y - b.y), beam.kind);
  }, 0);
}

export function isBridgeDesign(value: unknown): value is BridgeDesign {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as { nodes?: unknown; beams?: unknown };
  if (!Array.isArray(candidate.nodes) || !Array.isArray(candidate.beams)) return false;
  if (candidate.nodes.length > MAX_NODES || candidate.beams.length > MAX_BEAMS) return false;
  const nodes = readValidNodes(candidate.nodes);
  if (!nodes) return false;
  const design = { nodes, beams: candidate.beams as BridgeBeam[] };
  return areValidBeams(design) && bridgeInkUsed(design) <= BRIDGE_BUILDER_INK_BUDGET + 0.001;
}

function readValidNodes(nodes: unknown[]): BridgeNode[] | null {
  const ids = new Set<string>();
  for (const node of nodes) {
    if (!isValidNode(node) || ids.has(node.id)) return null;
    ids.add(node.id);
  }
  return ids.has('west-road') && ids.has('east-road') ? nodes as BridgeNode[] : null;
}

function areValidBeams(design: BridgeDesign): boolean {
  const ids = new Set<string>();
  const pairs = new Set<string>();
  for (const beam of design.beams) {
    if (!isValidBeamRecord(beam, design.nodes) || ids.has(beam.id)) return false;
    const pair = [beam.a, beam.b].sort().join('|');
    if (pairs.has(pair) || !hasValidBeamLength(design, beam)) return false;
    ids.add(beam.id);
    pairs.add(pair);
  }
  return true;
}

function isValidBeamRecord(beam: unknown, nodes: readonly BridgeNode[]): beam is BridgeBeam {
  if (!beam || typeof beam !== 'object') return false;
  const item = beam as Partial<BridgeBeam>;
  if (!hasBeamIdentity(item) || (item.kind !== 'beam' && item.kind !== 'cable')) return false;
  if (item.a === item.b) return false;
  return nodes.some((node) => node.id === item.a) && nodes.some((node) => node.id === item.b);
}

function hasBeamIdentity(beam: Partial<BridgeBeam>): beam is BridgeBeam {
  return typeof beam.id === 'string' && typeof beam.a === 'string' && typeof beam.b === 'string';
}

function hasValidBeamLength(design: BridgeDesign, beam: BridgeBeam): boolean {
  const a = bridgeNodeById(design, beam.a);
  const b = bridgeNodeById(design, beam.b);
  const length = Math.hypot(a.x - b.x, a.y - b.y);
  return length >= MIN_BEAM_LENGTH && length <= MAX_BEAM_LENGTH;
}

function isValidNode(node: unknown): node is BridgeNode {
  if (!node || typeof node !== 'object') return false;
  const candidate = node as Partial<BridgeNode>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.x === 'number' &&
    Number.isFinite(candidate.x) &&
    typeof candidate.y === 'number' &&
    Number.isFinite(candidate.y) &&
    typeof candidate.pinned === 'boolean'
  );
}

function upsertNode(
  design: BridgeDesign,
  point: BridgePoint
): { design: BridgeDesign; node: BridgeNode } {
  const snapped = snapBridgePoint(design.nodes, point);
  if (snapped) return { design, node: snapped };
  const node: BridgeNode = {
    id: nextEntityId(design.nodes, 'joint'),
    x: clampPoint(point.x, 'x'),
    y: clampPoint(point.y, 'y'),
    pinned: false
  };
  return { design: { ...design, nodes: [...design.nodes, node] }, node };
}

function nextEntityId(items: readonly { id: string }[], prefix: string): string {
  let index = items.length + 1;
  while (items.some((item) => item.id === `${prefix}-${index}`)) index += 1;
  return `${prefix}-${index}`;
}

function connectsSameNodes(beam: BridgeBeam, a: string, b: string): boolean {
  return (beam.a === a && beam.b === b) || (beam.a === b && beam.b === a);
}

function materialCost(length: number, kind: BridgeMaterial): number {
  return (length / 10) * (kind === 'cable' ? 0.55 : 1);
}

function clampPoint(value: number, axis: 'x' | 'y'): number {
  if (axis === 'x') return Math.min(BRIDGE_BOARD_BOUNDS.right, Math.max(BRIDGE_BOARD_BOUNDS.left, value));
  return Math.min(BRIDGE_BOARD_BOUNDS.bottom, Math.max(BRIDGE_BOARD_BOUNDS.top, value));
}
