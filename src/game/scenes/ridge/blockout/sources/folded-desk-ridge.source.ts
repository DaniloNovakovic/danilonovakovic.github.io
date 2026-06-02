import type { RidgeBlockoutSource, RidgeTileRegistry } from '../sourceContract';

const FOLDED_DESK_RIDGE_TILE_REGISTRY = [
  { symbol: '.', id: 0, kind: 'empty', label: 'empty air' },
  { symbol: '#', id: 1, kind: 'solid', label: 'solid ground or wall' },
  { symbol: '_', id: 2, kind: 'platform', label: 'paper platform' },
  { symbol: 'L', id: 3, kind: 'ladder', label: 'ladder or cord guide' },
  { symbol: '=', id: 4, kind: 'design', label: 'one-way platform promise', runtimeActive: false },
  { symbol: '~', id: 5, kind: 'design', label: 'wind or drop guide', runtimeActive: false },
  { symbol: 'N', id: 6, kind: 'design', label: 'generic npc marker', runtimeActive: false },
  { symbol: 'M', id: 7, kind: 'design', label: 'memento board marker', runtimeActive: false },
  { symbol: '1', id: 10, kind: 'anchor', label: 'numbered anchor 1' },
  { symbol: '2', id: 11, kind: 'anchor', label: 'numbered anchor 2' },
  { symbol: '3', id: 12, kind: 'anchor', label: 'numbered anchor 3' },
  { symbol: '4', id: 13, kind: 'anchor', label: 'numbered anchor 4' },
  { symbol: '5', id: 14, kind: 'anchor', label: 'numbered anchor 5' },
  { symbol: '6', id: 15, kind: 'anchor', label: 'numbered anchor 6' },
  { symbol: '7', id: 16, kind: 'anchor', label: 'numbered anchor 7' },
  { symbol: '8', id: 17, kind: 'anchor', label: 'numbered anchor 8' },
  { symbol: '9', id: 18, kind: 'anchor', label: 'numbered anchor 9' },
  { symbol: 'C', id: 20, kind: 'anchor', label: 'Cicka anchor' },
  { symbol: 'A', id: 21, kind: 'anchor', label: 'artifact anchor' },
  { symbol: '*', id: 22, kind: 'anchor', label: 'mini-game anchor' },
  { symbol: '^', id: 23, kind: 'anchor', label: 'lift anchor' },
  { symbol: '?', id: 24, kind: 'anchor', label: 'secret or gate anchor' }
] as const satisfies RidgeTileRegistry;

export const FOLDED_DESK_RIDGE_SOURCE = {
  language: 'ridge-v0',
  cell: 48,
  worldId: 'folded_desk_ridge',
  title: 'Folded Desk Ridge',
  tileRegistry: FOLDED_DESK_RIDGE_TILE_REGISTRY,
  spawn: {
    roomId: 'outskirts',
    anchorSymbol: '1'
  },
  routes: [{
    id: 'first_walk',
    roomIds: [
      'outskirts',
      'cicka_home',
      'work_artifact',
      'stampede_blanket',
      'switchback_shelf',
      'telegraph_terrace',
      'guide_overlook',
      'relay_gate',
      'domino_desk'
    ]
  }],
  optionalPockets: [{
    id: 'early_skill_scrap',
    roomId: 'work_artifact',
    kind: 'side_shelf'
  }],
  shortcuts: [{
    id: 'stampede_sketch',
    fromRoomId: 'switchback_shelf',
    toRoomId: 'cicka_home',
    kind: 'fall_steer_fold_drop'
  }, {
    id: 'telegraph_clear',
    fromRoomId: 'telegraph_terrace',
    toRoomId: 'cicka_home',
    kind: 'cord_drop'
  }],
  futureRoutes: [{
    id: 'cicka_underpath',
    roomIds: ['outskirts', 'underpath', 'cicka_home']
  }, {
    id: 'drop_pocket',
    roomIds: ['guide_overlook', 'drop_pocket', 'stampede_blanket']
  }, {
    id: 'high_ledge',
    roomIds: ['domino_desk', 'high_ledge']
  }],
  homeMutations: [{
    id: 'work_artifact',
    attrs: { adds: 'work_display' }
  }, {
    id: 'stampede_sketch',
    attrs: { adds: 'stampede_note', opens: 'fold_drop_landing' }
  }, {
    id: 'telegraph_clear',
    attrs: { adds: 'signal_cord_drop' }
  }, {
    id: 'relay_gate_seen',
    attrs: { adds: 'proof_slot_glow' }
  }, {
    id: 'domino_future',
    attrs: { adds: 'desk_lift_switch' }
  }],
  rooms: [{
    id: 'outskirts',
    title: 'Outskirts',
    place: { x: 0, y: 72 },
    size: { width: 32, height: 12 },
    theme: 'city_edge_paper',
    mood: 'curious',
    links: ['right:cicka_home', 'future_down:basement_hatch', 'future_up:underpath'],
    props: ['city_edge', 'basement_hatch_shadow', 'potassium_tape', 'glasses_hint', 'distant_relay'],
    grid: [
      '................................',
      '................................',
      '.........................A......',
      '....................____........',
      '.................___............',
      '............___.................',
      '.......1........................',
      '......####...............2......',
      '###########............####.....',
      '###############......########...',
      '################################',
      '################################'
    ],
    anchors: [
      { symbol: '1', kind: 'player_spawn', attrs: { id: 'start' } },
      { symbol: '2', kind: 'exit', attrs: { to: 'cicka_home', label: 'paper_stairs', movement: 'ramp' } },
      { symbol: 'A', kind: 'artifact', attrs: { id: 'city_edge_memory' } }
    ],
    rects: [{
      id: 'sightline_to_relay',
      x: 21,
      y: 0,
      width: 9,
      height: 5
    }, {
      id: 'future_basement_hatch',
      x: 4,
      y: 9,
      width: 7,
      height: 2
    }]
  }, {
    id: 'cicka_home',
    title: 'Cicka Home',
    place: { x: 36, y: 64 },
    size: { width: 32, height: 14 },
    theme: 'desk_nest',
    mood: 'safe',
    links: [
      'left:outskirts',
      'up:work_artifact',
      'secret:underpath',
      'shortcut_from:switchback_shelf',
      'shortcut_from:telegraph_terrace'
    ],
    props: ['desk', 'pinboard', 'memento_slots', 'paw_marks', 'paper_blanket', 'cicka_perch'],
    declarations: ['after stampede_sketch adds memento=stampede_note'],
    grid: [
      '................................',
      '........................3.......',
      '...................____....L....',
      '.......M...................L....',
      '...........................L....',
      '.............____....C..A..L....',
      '.....######################L....',
      '.....#....................#L....',
      '.....#....?...............#L....',
      '.....#....................#L....',
      '.....######################L....',
      '...........................L....',
      '..2........................L.1..',
      '################################'
    ],
    anchors: [
      { symbol: '1', kind: 'exit', attrs: { to: 'work_artifact', label: 'paper_cord', movement: 'climb' } },
      { symbol: '2', kind: 'exit', attrs: { to: 'outskirts', label: 'stairs_down', movement: 'ramp' } },
      { symbol: '3', kind: 'shortcut_from=telegraph_terrace', attrs: { label: 'cord_drop_home', movement: 'drop' } },
      { symbol: 'C', kind: 'npc', attrs: { id: 'cicka' } },
      { symbol: 'A', kind: 'artifact', attrs: { id: 'home_memento_slot' } },
      { symbol: '?', kind: 'secret', attrs: { to: 'underpath', requires: 'cicka_translator' } }
    ],
    rects: [{
      id: 'cicka_safe_zone',
      x: 7,
      y: 2,
      width: 18,
      height: 8
    }, {
      id: 'stampede_return_landing',
      x: 16,
      y: 11,
      width: 10,
      height: 2
    }]
  }, {
    id: 'work_artifact',
    title: 'Work Artifact Ledge',
    place: { x: 46, y: 50 },
    size: { width: 32, height: 12 },
    theme: 'desk_paper_artifacts',
    mood: 'discovery',
    links: ['down:cicka_home', 'right:stampede_blanket'],
    props: ['saturn_sticker', 'hummingbird_feather', 'project_scraps', 'paper_steps'],
    grid: [
      '................................',
      '.................2..............',
      '.................L____..........',
      '..............___L....3.........',
      '....A............L.........1....',
      '.....____........L..............',
      '.................L...____.......',
      '...#############.L..............',
      '.............####L#######.......',
      '.................L..#########...',
      '#################L##############',
      '#################L##############'
    ],
    anchors: [
      { symbol: '1', kind: 'exit', attrs: { to: 'stampede_blanket', label: 'wide_jump', movement: 'jump' } },
      { symbol: '2', kind: 'exit', attrs: { to: 'cicka_home', label: 'paper_steps_down', movement: 'ramp' } },
      { symbol: '3', kind: 'optional_pocket', attrs: { id: 'early_skill_scrap', reward: 'minor_skill_scrap' } },
      { symbol: 'A', kind: 'artifact', attrs: { id: 'major_work_artifact' } }
    ],
    rects: [{
      id: 'artifact_focus',
      x: 2,
      y: 2,
      width: 10,
      height: 5
    }, {
      id: 'sightline_to_cicka',
      x: 0,
      y: 7,
      width: 9,
      height: 4
    }]
  }, {
    id: 'stampede_blanket',
    title: 'Stampede Blanket',
    place: { x: 84, y: 49 },
    size: { width: 32, height: 14 },
    theme: 'picnic_ink_paper',
    mood: 'tense_playful',
    links: ['left:work_artifact', 'up:switchback_shelf', 'optional:drop_pocket'],
    props: ['picnic_blanket', 'ink_swarm', 'crumbs', 'loose_pages', 'folded_paper_shortcut'],
    declarations: [
      'minigame stampede_sketch',
      'reward stampede_sketch',
      'after stampede_sketch opens fold_drop_chute via=switchback_shelf to=cicka_home'
    ],
    grid: [
      '................................',
      '....................2...........',
      '................._______........',
      '................................',
      '.....____.................?.....',
      '.1.........~~~~~~~..............',
      '########...#######.......____...',
      '########.................####...',
      '............*...................',
      '............____.....A..........',
      '....................____........',
      '......####################......',
      '################################',
      '################################'
    ],
    anchors: [
      { symbol: '1', kind: 'exit', attrs: { to: 'work_artifact', label: 'wide_jump_back', movement: 'jump' } },
      { symbol: '2', kind: 'exit', attrs: { to: 'switchback_shelf', label: 'climb_out', movement: 'climb' } },
      { symbol: '?', kind: 'shortcut_preview', attrs: { to: 'cicka_home', requires: 'stampede_sketch', via: 'switchback_shelf', movement: 'drop' } },
      { symbol: '*', kind: 'minigame', attrs: { id: 'stampede_sketch' } },
      { symbol: 'A', kind: 'artifact', attrs: { id: 'stampede_proof' } }
    ],
    rects: [{
      id: 'ink_swarm_zone',
      x: 10,
      y: 4,
      width: 10,
      height: 4
    }, {
      id: 'fold_shortcut_preview',
      x: 21,
      y: 5,
      width: 8,
      height: 4
    }]
  }, {
    id: 'switchback_shelf',
    title: 'Switchback Shelf',
    place: { x: 84, y: 35 },
    size: { width: 32, height: 12 },
    theme: 'folded_paper_shelf',
    mood: 'aha',
    links: ['down:stampede_blanket', 'left:telegraph_terrace', 'shortcut:cicka_home'],
    props: ['paper_fold', 'paw_scratches', 'cicka_view_below', 'loose_page_bridge'],
    declarations: ['after stampede_sketch unlocks shortcut_to=cicka_home kind=fall_steer_fold_drop'],
    grid: [
      '................................',
      '.........................2......',
      '.....................____.......',
      '................................',
      '....1...........................',
      '....____............A...........',
      '................____............',
      '.........____...................',
      '..######################........',
      '.............~~~~~..............',
      '...............?................',
      '################################'
    ],
    anchors: [
      { symbol: '1', kind: 'exit', attrs: { to: 'stampede_blanket', label: 'climb_down', movement: 'climb' } },
      { symbol: '2', kind: 'exit', attrs: { to: 'telegraph_terrace', label: 'back_left', movement: 'ramp' } },
      { symbol: 'A', kind: 'artifact', attrs: { id: 'cicka_view_note' } },
      { symbol: '?', kind: 'shortcut', attrs: { to: 'cicka_home', requires: 'stampede_sketch', label: 'fold_drop_home', movement: 'drop' } }
    ],
    rects: [{
      id: 'cicka_view',
      x: 3,
      y: 4,
      width: 16,
      height: 5
    }, {
      id: 'fold_drop_chute',
      x: 12,
      y: 8,
      width: 7,
      height: 4,
      attrs: { to: 'cicka_home', requires: 'stampede_sketch', kind: 'fall_steer' }
    }]
  }, {
    id: 'telegraph_terrace',
    title: 'Telegraph Terrace',
    place: { x: 44, y: 32 },
    size: { width: 32, height: 13 },
    theme: 'cord_terrace',
    mood: 'focused',
    links: ['right:guide_overlook', 'down:switchback_shelf', 'shortcut:cicka_home'],
    props: ['hanging_cord', 'todo_ai_dummy', 'heavy_bag', 'tick_marks', 'signal_wire'],
    declarations: ['minigame telegraph_future', 'future_reward telegraph_clear'],
    grid: [
      '................................',
      '............................2...',
      '......................._____....',
      '................................',
      '....1...........N...............',
      '....____........................',
      '............____................',
      '.....................____.......',
      '.....*..........................',
      '.....###########.......A........',
      '...............############.....',
      '................................',
      '################################'
    ],
    anchors: [
      { symbol: '1', kind: 'exit', attrs: { to: 'switchback_shelf', label: 'back_right', movement: 'ramp' } },
      { symbol: '2', kind: 'exit', attrs: { to: 'guide_overlook', label: 'cord_climb', movement: 'climb' } },
      { symbol: 'N', kind: 'npc', attrs: { id: 'todo_ai_dummy' } },
      { symbol: '*', kind: 'minigame', attrs: { id: 'telegraph_future' } },
      { symbol: 'A', kind: 'artifact', attrs: { id: 'signal_note' } }
    ],
    rects: [{
      id: 'cord_drop',
      x: 4,
      y: 9,
      width: 5,
      height: 3,
      attrs: { to: 'cicka_home', requires: 'telegraph_clear' }
    }, {
      id: 'sightline_to_cicka',
      x: 0,
      y: 8,
      width: 10,
      height: 4
    }]
  }, {
    id: 'guide_overlook',
    title: 'Guide Overlook',
    place: { x: 84, y: 21 },
    size: { width: 32, height: 11 },
    theme: 'windy_overlook',
    mood: 'reorientation',
    links: ['left:telegraph_terrace', 'up:relay_gate', 'optional:drop_pocket'],
    props: ['ridge_guide', 'relay_silhouette', 'wind_lines', 'paper_bridge'],
    grid: [
      '................................',
      '.....................2..........',
      '..................______........',
      '................................',
      '.....1........N.................',
      '.....____.......................',
      '...............____.............',
      '.......................____.....',
      '....A...........................',
      '.....######################.....',
      '################################'
    ],
    anchors: [
      { symbol: '1', kind: 'exit', attrs: { to: 'telegraph_terrace', label: 'cord_down', movement: 'climb' } },
      { symbol: '2', kind: 'exit', attrs: { to: 'relay_gate', label: 'final_shelf', movement: 'ramp' } },
      { symbol: 'N', kind: 'npc', attrs: { id: 'ridge_guide' } },
      { symbol: 'A', kind: 'artifact', attrs: { id: 'relay_view_memory' } }
    ],
    rects: [{
      id: 'sightline_to_relay',
      x: 17,
      y: 0,
      width: 12,
      height: 5
    }, {
      id: 'wind_hint',
      x: 4,
      y: 3,
      width: 22,
      height: 4
    }]
  }, {
    id: 'relay_gate',
    title: 'Relay Gate',
    place: { x: 44, y: 10 },
    size: { width: 32, height: 12 },
    theme: 'signal_gate',
    mood: 'destination',
    links: ['down:guide_overlook', 'right:domino_desk'],
    props: ['proof_slots', 'signal_ink', 'locked_gate', 'view_back'],
    declarations: ['gate requires=proofs_future'],
    grid: [
      '................................',
      '...................2............',
      '...............________.........',
      '................................',
      '....1...........................',
      '....____............A...........',
      '............#####...............',
      '............#???#...............',
      '............#####...............',
      '................................',
      '.....######################.....',
      '################################'
    ],
    anchors: [
      { symbol: '1', kind: 'exit', attrs: { to: 'guide_overlook', label: 'final_shelf_back', movement: 'ramp' } },
      { symbol: '2', kind: 'exit', attrs: { to: 'domino_desk', label: 'lift_promise', movement: 'ramp' } },
      { symbol: 'A', kind: 'artifact', attrs: { id: 'proof_slot_marker' } },
      { symbol: '?', kind: 'gate', attrs: { id: 'relay_proof_slots' } }
    ],
    rects: [{
      id: 'sightline_view_back',
      x: 2,
      y: 1,
      width: 18,
      height: 5
    }]
  }, {
    id: 'domino_desk',
    title: 'Domino Desk',
    place: { x: 84, y: 8 },
    size: { width: 32, height: 12 },
    theme: 'desk_machine',
    mood: 'mechanical',
    links: ['left:relay_gate', 'up:high_ledge', 'shortcut:cicka_home'],
    props: ['dominoes', 'coffee_rings', 'elevator_rails', 'deterministic_toys', 'printer_oracle_tease'],
    declarations: ['future_shortcut to=cicka_home kind=lift'],
    grid: [
      '................................',
      '............................2...',
      '......................______....',
      '................................',
      '....1...........................',
      '....____.............^..........',
      '.....................#..........',
      '........A............#..........',
      '.....########........#..........',
      '.....................#..........',
      '.....######################.....',
      '################################'
    ],
    anchors: [
      { symbol: '1', kind: 'exit', attrs: { to: 'relay_gate', label: 'lift_promise_back', movement: 'ramp' } },
      { symbol: '2', kind: 'exit', attrs: { to: 'high_ledge', label: 'future_lift', movement: 'climb' } },
      { symbol: '^', kind: 'lift', attrs: { id: 'desk_lift', to: 'cicka_home', requires: 'domino_future' } },
      { symbol: 'A', kind: 'artifact', attrs: { id: 'domino_project_scrap' } }
    ],
    rects: [{
      id: 'lift_travel',
      x: 20,
      y: 4,
      width: 3,
      height: 7
    }]
  }, {
    id: 'high_ledge',
    title: 'High Ledge',
    place: { x: 118, y: 2 },
    size: { width: 32, height: 8 },
    theme: 'moon_paper_high',
    mood: 'aspirational',
    links: ['down:domino_desk'],
    props: ['unreachable_feather', 'syntax_scraps', 'moon_paper', 'glide_tease'],
    declarations: ['future requires=movement_reward'],
    grid: [
      '....................A...........',
      '...............____.............',
      '................................',
      '...........____.................',
      '................................',
      '.....?..........................',
      '.....######################.....',
      '################################'
    ],
    anchors: [
      { symbol: 'A', kind: 'artifact', attrs: { id: 'hidden_skill_scrap' } },
      { symbol: '?', kind: 'gate', attrs: { id: 'movement_reward_tease' } }
    ],
    rects: [{
      id: 'high_view',
      x: 0,
      y: 0,
      width: 32,
      height: 4
    }]
  }, {
    id: 'underpath',
    title: 'Paw Underpath',
    place: { x: 0, y: 60 },
    size: { width: 32, height: 10 },
    theme: 'paw_scratch_secret',
    mood: 'secret',
    links: ['left:outskirts', 'right:cicka_home'],
    props: ['paw_marks', 'dust', 'low_paper_tunnel', 'cicka_scratches'],
    declarations: ['future requires=cicka_translator'],
    grid: [
      '................................',
      '......1...................2.....',
      '....######.............######...',
      '................................',
      '...........?....................',
      '.....____.............____......',
      '................................',
      '...##########################...',
      '################################',
      '################################'
    ],
    anchors: [
      { symbol: '1', kind: 'exit', attrs: { to: 'outskirts', label: 'secret_start_return', movement: 'ramp' } },
      { symbol: '2', kind: 'exit', attrs: { to: 'cicka_home', label: 'secret_home_return', movement: 'ramp' } },
      { symbol: '?', kind: 'secret', attrs: { id: 'cicka_translation_mark' } }
    ],
    rects: [{
      id: 'crawl_space',
      x: 3,
      y: 3,
      width: 25,
      height: 4
    }]
  }, {
    id: 'drop_pocket',
    title: 'Lucky Luna Drop Pocket',
    place: { x: 120, y: 38 },
    size: { width: 32, height: 16 },
    theme: 'falling_scraps',
    mood: 'playful_descent',
    links: ['entry:guide_overlook', 'exit:stampede_blanket'],
    props: ['falling_paper', 'wind_lines', 'keycap_scrap', 'safe_shaft'],
    declarations: ['future optional=true'],
    grid: [
      '................................',
      '....1...........................',
      '....____........................',
      '.........~......................',
      '...........~....................',
      '.............~..................',
      '...............~................',
      '.................~..............',
      '...................~............',
      '.....................~..........',
      '.......................2........',
      '...........A....................',
      '.......____............____.....',
      '................................',
      '.....######################.....',
      '################################'
    ],
    anchors: [
      { symbol: '1', kind: 'exit', attrs: { to: 'guide_overlook', label: 'optional_descent', movement: 'drop' } },
      { symbol: '2', kind: 'exit', attrs: { to: 'stampede_blanket', label: 'return_near_stampede', movement: 'drop' } },
      { symbol: 'A', kind: 'artifact', attrs: { id: 'hidden_keycap_scrap' } }
    ],
    rects: [{
      id: 'fall_shaft',
      x: 8,
      y: 2,
      width: 16,
      height: 10
    }]
  }]
} as const satisfies RidgeBlockoutSource;

export default FOLDED_DESK_RIDGE_SOURCE;
