export const BRIDGE_BUILDER_INK_BUDGET = 16;

const BRIDGE_NODE_IDS = [
  'west-bank',
  'west-deck',
  'center-deck',
  'east-deck',
  'east-bank',
  'west-top',
  'center-top',
  'east-top',
  'keel'
] as const;

export type BridgeNodeId = (typeof BRIDGE_NODE_IDS)[number];
export type BridgeTestVehicle = 'car' | 'truck';
export type BridgeEdgeRole = 'deck' | 'truss' | 'keel';

export interface BridgeNode {
  id: BridgeNodeId;
  x: number;
  y: number;
  label: string;
}

export interface BridgeEdge {
  a: BridgeNodeId;
  b: BridgeNodeId;
}

export interface BridgeDesign {
  edges: readonly BridgeEdge[];
}

export interface BridgeGuideEdge extends BridgeEdge {
  role: BridgeEdgeRole;
}

export type BridgeCheckId = 'deck' | 'carTriangles' | 'truckTriangles' | 'keel';

export interface BridgeCheck {
  id: BridgeCheckId;
  current: number;
  required: number;
  passed: boolean;
}

export interface BridgeEvaluation {
  inkUsed: number;
  inkRemaining: number;
  deckSegments: number;
  triangleCount: number;
  keelCount: number;
  carReady: boolean;
  truckReady: boolean;
  checks: readonly BridgeCheck[];
}

export const BRIDGE_NODES: readonly BridgeNode[] = [
  { id: 'west-bank', x: 60, y: 220, label: '1' },
  { id: 'west-deck', x: 180, y: 220, label: '2' },
  { id: 'center-deck', x: 300, y: 220, label: '3' },
  { id: 'east-deck', x: 420, y: 220, label: '4' },
  { id: 'east-bank', x: 540, y: 220, label: '5' },
  { id: 'west-top', x: 180, y: 96, label: '6' },
  { id: 'center-top', x: 300, y: 72, label: '7' },
  { id: 'east-top', x: 420, y: 96, label: '8' },
  { id: 'keel', x: 300, y: 326, label: '9' }
];

const DECK_PAIRS: readonly (readonly [BridgeNodeId, BridgeNodeId])[] = [
  ['west-bank', 'west-deck'],
  ['west-deck', 'center-deck'],
  ['center-deck', 'east-deck'],
  ['east-deck', 'east-bank']
];

const TRUSS_TRIANGLES: readonly (readonly [
  BridgeNodeId,
  BridgeNodeId,
  BridgeNodeId
])[] = [
  ['west-bank', 'west-deck', 'west-top'],
  ['west-deck', 'center-deck', 'center-top'],
  ['center-deck', 'east-deck', 'center-top'],
  ['east-deck', 'east-bank', 'east-top']
];

const KEEL_PAIRS: readonly (readonly [BridgeNodeId, BridgeNodeId])[] = [
  ['keel', 'west-deck'],
  ['keel', 'center-deck'],
  ['keel', 'east-deck']
];

export const BRIDGE_GUIDE_EDGES: readonly BridgeGuideEdge[] = [
  ...DECK_PAIRS.map(([a, b]) => ({ a, b, role: 'deck' as const })),
  { a: 'west-bank', b: 'west-top', role: 'truss' },
  { a: 'west-deck', b: 'west-top', role: 'truss' },
  { a: 'west-deck', b: 'center-top', role: 'truss' },
  { a: 'center-deck', b: 'center-top', role: 'truss' },
  { a: 'east-deck', b: 'center-top', role: 'truss' },
  { a: 'east-deck', b: 'east-top', role: 'truss' },
  { a: 'east-bank', b: 'east-top', role: 'truss' },
  ...KEEL_PAIRS.map(([a, b]) => ({ a, b, role: 'keel' as const }))
];

const NODE_BY_ID = new Map<BridgeNodeId, BridgeNode>(BRIDGE_NODES.map((node) => [node.id, node]));
const NODE_ID_SET = new Set<string>(BRIDGE_NODE_IDS);
const MAX_EDGE_LENGTH = 220;

export function createCanonicalBridgeDesign(): BridgeDesign {
  return {
    edges: BRIDGE_GUIDE_EDGES.map(({ a, b }) => ({ a, b }))
  };
}

export function createEmptyBridgeDesign(): BridgeDesign {
  return { edges: [] };
}

export function bridgeEdgeKey(a: BridgeNodeId, b: BridgeNodeId): string {
  return [a, b].sort().join('|');
}

export function bridgeNodeById(id: BridgeNodeId): BridgeNode {
  const node = NODE_BY_ID.get(id);
  if (!node) throw new Error(`Unknown bridge joint "${id}"`);
  return node;
}

export function isBridgeNodeId(value: unknown): value is BridgeNodeId {
  return typeof value === 'string' && NODE_ID_SET.has(value);
}

export function isBridgeDesign(value: unknown): value is BridgeDesign {
  if (!value || typeof value !== 'object' || !('edges' in value)) return false;
  const edges = (value as { edges: unknown }).edges;
  if (!Array.isArray(edges)) return false;
  const seen = new Set<string>();
  for (const edge of edges) {
    if (!edge || typeof edge !== 'object') return false;
    const candidate = edge as { a?: unknown; b?: unknown };
    if (!isBridgeNodeId(candidate.a) || !isBridgeNodeId(candidate.b)) return false;
    if (candidate.a === candidate.b) return false;
    const key = bridgeEdgeKey(candidate.a, candidate.b);
    if (seen.has(key)) return false;
    seen.add(key);
  }
  return true;
}

export function canAddBridgeEdge(
  design: BridgeDesign,
  a: BridgeNodeId,
  b: BridgeNodeId
): boolean {
  if (a === b || design.edges.length >= BRIDGE_BUILDER_INK_BUDGET) return false;
  if (hasBridgeEdge(design, a, b)) return false;
  const first = bridgeNodeById(a);
  const second = bridgeNodeById(b);
  return Math.hypot(first.x - second.x, first.y - second.y) <= MAX_EDGE_LENGTH;
}

export function addBridgeEdge(
  design: BridgeDesign,
  a: BridgeNodeId,
  b: BridgeNodeId
): BridgeDesign {
  if (!canAddBridgeEdge(design, a, b)) return design;
  return { edges: [...design.edges, { a, b }] };
}

export function removeBridgeEdge(design: BridgeDesign, target: BridgeEdge): BridgeDesign {
  const targetKey = bridgeEdgeKey(target.a, target.b);
  return {
    edges: design.edges.filter((edge) => bridgeEdgeKey(edge.a, edge.b) !== targetKey)
  };
}

export function hasBridgeEdge(design: BridgeDesign, a: BridgeNodeId, b: BridgeNodeId): boolean {
  const key = bridgeEdgeKey(a, b);
  return design.edges.some((edge) => bridgeEdgeKey(edge.a, edge.b) === key);
}

export function evaluateBridge(design: BridgeDesign): BridgeEvaluation {
  const deckSegments = DECK_PAIRS.filter(([a, b]) => hasBridgeEdge(design, a, b)).length;
  const triangleCount = TRUSS_TRIANGLES.filter(([a, b, c]) =>
    hasBridgeEdge(design, a, b) &&
    hasBridgeEdge(design, b, c) &&
    hasBridgeEdge(design, a, c)
  ).length;
  const keelCount = KEEL_PAIRS.filter(([a, b]) => hasBridgeEdge(design, a, b)).length;
  const checks: BridgeCheck[] = [
    {
      id: 'deck',
      current: deckSegments,
      required: DECK_PAIRS.length,
      passed: deckSegments === DECK_PAIRS.length
    },
    {
      id: 'carTriangles',
      current: Math.min(triangleCount, 2),
      required: 2,
      passed: triangleCount >= 2
    },
    {
      id: 'truckTriangles',
      current: triangleCount,
      required: TRUSS_TRIANGLES.length,
      passed: triangleCount === TRUSS_TRIANGLES.length
    },
    {
      id: 'keel',
      current: Math.min(keelCount, 2),
      required: 2,
      passed: keelCount >= 2
    }
  ];
  const deckReady = checks[0]!.passed;
  const carReady = deckReady && checks[1]!.passed;
  const truckReady = carReady && checks[2]!.passed && checks[3]!.passed;

  return {
    inkUsed: design.edges.length,
    inkRemaining: Math.max(0, BRIDGE_BUILDER_INK_BUDGET - design.edges.length),
    deckSegments,
    triangleCount,
    keelCount,
    carReady,
    truckReady,
    checks
  };
}

export function nextBridgeHint(design: BridgeDesign): BridgeGuideEdge | null {
  const evaluation = evaluateBridge(design);
  const priority: BridgeEdgeRole[] = evaluation.deckSegments < DECK_PAIRS.length
    ? ['deck', 'truss', 'keel']
    : evaluation.triangleCount < TRUSS_TRIANGLES.length
      ? ['truss', 'keel', 'deck']
      : ['keel', 'truss', 'deck'];

  for (const role of priority) {
    const missing = BRIDGE_GUIDE_EDGES.find(
      (edge) => edge.role === role && !hasBridgeEdge(design, edge.a, edge.b)
    );
    if (missing) return missing;
  }
  return null;
}

export function bridgeNodePairLabel(edge: BridgeEdge): string {
  return `${bridgeNodeById(edge.a).label} → ${bridgeNodeById(edge.b).label}`;
}
