import type { RidgeBlockoutSource } from '../sourceContract';

export const CONTRACT_FIXTURE_RIDGE_SOURCE = {
  language: 'ridge-v0',
  cell: 16,
  worldId: 'contract_fixture',
  title: 'Contract Fixture Ridge',
  tileRegistry: [
    { symbol: '.', id: 0, kind: 'empty', label: 'empty' },
    { symbol: '#', id: 1, kind: 'solid', label: 'solid floor' },
    { symbol: '_', id: 2, kind: 'platform', label: 'paper platform' },
    { symbol: 'L', id: 3, kind: 'ladder', label: 'ladder' },
    { symbol: '1', id: 10, kind: 'anchor', label: 'spawn anchor' },
    { symbol: '2', id: 11, kind: 'anchor', label: 'exit anchor' },
    { symbol: 'A', id: 20, kind: 'anchor', label: 'artifact anchor' },
    { symbol: '~', id: 30, kind: 'design', label: 'wind guide', runtimeActive: false }
  ],
  spawn: {
    roomId: 'start',
    anchorSymbol: '1'
  },
  routes: [{
    id: 'first_walk',
    roomIds: ['start', 'lookout']
  }],
  futureRoutes: [{
    id: 'future_ladder',
    roomIds: ['lookout', 'future_room']
  }],
  shortcuts: [{
    id: 'fixture_drop',
    fromRoomId: 'lookout',
    toRoomId: 'start',
    kind: 'drop'
  }],
  optionalPockets: [{
    id: 'side_note',
    roomId: 'lookout',
    kind: 'paper_fold'
  }],
  homeMutations: [{
    id: 'fixture_clear',
    attrs: {
      adds: 'fixture_note'
    }
  }],
  rooms: [{
    id: 'start',
    title: 'Start',
    place: { x: 0, y: 0 },
    size: { width: 4, height: 3 },
    theme: 'paper_start',
    mood: 'curious',
    links: ['right:lookout'],
    props: ['paper_edge'],
    grid: [
      '1..2',
      '.__.',
      '####'
    ],
    anchors: [
      { symbol: '1', kind: 'player_spawn', attrs: { id: 'start' } },
      { symbol: '2', kind: 'exit', attrs: { to: 'lookout', movement: 'ramp' } }
    ],
    rects: [{
      id: 'start_focus',
      x: 0,
      y: 0,
      width: 2,
      height: 1
    }],
    declarations: ['reward fixture_clear']
  }, {
    id: 'lookout',
    title: 'Lookout',
    place: { x: 6, y: 0 },
    size: { width: 4, height: 3 },
    links: ['left:start'],
    props: ['paper_view'],
    grid: [
      '2.A~',
      '.L_.',
      '####'
    ],
    anchors: [
      { symbol: '2', kind: 'exit', attrs: { to: 'start', movement: 'ramp' } },
      { symbol: 'A', kind: 'artifact', attrs: { id: 'fixture_artifact' } }
    ]
  }, {
    id: 'future_room',
    title: 'Future Room',
    place: { x: 12, y: 0 },
    size: { width: 4, height: 2 },
    grid: [
      '....',
      '####'
    ],
    declarations: ['future requires=fixture_reward']
  }]
} as const satisfies RidgeBlockoutSource;

export default CONTRACT_FIXTURE_RIDGE_SOURCE;
