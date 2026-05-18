import * as Phaser from 'phaser';
import {
  type RidgeBlockoutAnchorPoint,
  type RidgeBlockoutAssistZone,
  type RidgeBlockoutBounds,
  type RidgeBlockoutCollider,
  type RidgeBlockoutFacts,
  type RidgeBlockoutGeometry,
  type RidgeBlockoutRoomBounds
} from '../blockout';
import { getRidgeBlockoutRoomCenter } from './ridgePresentationFacts';

const BACKDROP_BASE_DEPTH = -100;
const BACKDROP_SKETCH_DEPTH = -90;
const BACKDROP_RULED_LINE = {
  startY: 160,
  spacingY: 420,
  width: 3,
  color: 0x1f1f1d,
  alpha: 0.06
} as const;
const BACKDROP_DIAGONAL_SCRAPS = {
  startX: 180,
  spacingX: 420,
  waveBaseY: 260,
  waveDivisor: 180,
  waveAmplitude: 34,
  primary: {
    width: 4,
    color: 0x1f1f1d,
    alpha: 0.12,
    from: { x: -150, y: 34 },
    to: { x: 150, y: -34 }
  },
  secondary: {
    width: 3,
    color: 0x1f1f1d,
    alpha: 0.09,
    from: { x: -52, y: 60 },
    to: { x: 140, y: 24 }
  }
} as const;

export interface RidgeBlockoutPresentationOptions {
  scene: Phaser.Scene;
  facts: RidgeBlockoutFacts;
  geometry: RidgeBlockoutGeometry;
}

export interface RidgeBlockoutPresentation {
  platforms: Phaser.GameObjects.Zone[];
}

export function createRidgeBlockoutPresentation(
  options: RidgeBlockoutPresentationOptions
): RidgeBlockoutPresentation {
  const { scene, facts, geometry } = options;

  addBackdrop(scene, geometry.bounds);
  addRoomBounds(scene, geometry.roomBounds);
  addFutureRoutePromises(scene, facts);
  addTraversalConnectorVisuals(scene, geometry);
  const platforms = addBlockoutColliders(scene, geometry);
  addShortcutPromises(scene, facts);
  addAnchorMarkers(scene, geometry);

  return { platforms };
}

function addBackdrop(scene: Phaser.Scene, bounds: RidgeBlockoutBounds): void {
  scene.add.rectangle(
    bounds.width / 2,
    bounds.height / 2,
    bounds.width,
    bounds.height,
    0xf7f1df,
    1
  ).setDepth(BACKDROP_BASE_DEPTH);

  const graphics = scene.add.graphics().setDepth(BACKDROP_SKETCH_DEPTH);
  graphics.lineStyle(
    BACKDROP_RULED_LINE.width,
    BACKDROP_RULED_LINE.color,
    BACKDROP_RULED_LINE.alpha
  );
  for (let y = BACKDROP_RULED_LINE.startY; y < bounds.height; y += BACKDROP_RULED_LINE.spacingY) {
    graphics.strokeLineShape(new Phaser.Geom.Line(0, y, bounds.width, y));
  }

  for (
    let x = BACKDROP_DIAGONAL_SCRAPS.startX;
    x < bounds.width;
    x += BACKDROP_DIAGONAL_SCRAPS.spacingX
  ) {
    const y = BACKDROP_DIAGONAL_SCRAPS.waveBaseY +
      Math.sin(x / BACKDROP_DIAGONAL_SCRAPS.waveDivisor) *
      BACKDROP_DIAGONAL_SCRAPS.waveAmplitude;
    graphics.lineStyle(
      BACKDROP_DIAGONAL_SCRAPS.primary.width,
      BACKDROP_DIAGONAL_SCRAPS.primary.color,
      BACKDROP_DIAGONAL_SCRAPS.primary.alpha
    );
    graphics.strokeLineShape(new Phaser.Geom.Line(
      x + BACKDROP_DIAGONAL_SCRAPS.primary.from.x,
      y + BACKDROP_DIAGONAL_SCRAPS.primary.from.y,
      x + BACKDROP_DIAGONAL_SCRAPS.primary.to.x,
      y + BACKDROP_DIAGONAL_SCRAPS.primary.to.y
    ));
    graphics.lineStyle(
      BACKDROP_DIAGONAL_SCRAPS.secondary.width,
      BACKDROP_DIAGONAL_SCRAPS.secondary.color,
      BACKDROP_DIAGONAL_SCRAPS.secondary.alpha
    );
    graphics.strokeLineShape(new Phaser.Geom.Line(
      x + BACKDROP_DIAGONAL_SCRAPS.secondary.from.x,
      y + BACKDROP_DIAGONAL_SCRAPS.secondary.from.y,
      x + BACKDROP_DIAGONAL_SCRAPS.secondary.to.x,
      y + BACKDROP_DIAGONAL_SCRAPS.secondary.to.y
    ));
  }
}

function addRoomBounds(
  scene: Phaser.Scene,
  roomBounds: readonly RidgeBlockoutRoomBounds[]
): void {
  roomBounds.forEach((room) => {
    scene.add.rectangle(
      room.x + room.width / 2,
      room.y + room.height / 2,
      room.width,
      room.height,
      0xf7f1df,
      0.03
    )
      .setStrokeStyle(2, 0x1f1f1d, 0.12)
      .setDepth(-20);
    scene.add.text(room.x + 12, room.y + 12, room.title, {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#4b4337',
      backgroundColor: '#f7f1dfcc',
      padding: { x: 4, y: 2 }
    }).setDepth(20);
  });
}

function addFutureRoutePromises(
  scene: Phaser.Scene,
  facts: RidgeBlockoutFacts
): void {
  const graphics = scene.add.graphics().setDepth(-8);
  graphics.lineStyle(3, 0x596f8f, 0.18);

  facts.futureRoutes.forEach((route) => {
    route.links.forEach((link) => {
      const from = getRidgeBlockoutRoomCenter(facts, link.fromRoomId);
      const to = getRidgeBlockoutRoomCenter(facts, link.toRoomId);
      if (!from || !to) return;
      graphics.strokeLineShape(new Phaser.Geom.Line(from.x, from.y, to.x, to.y));
    });
  });
}

function addTraversalConnectorVisuals(
  scene: Phaser.Scene,
  geometry: RidgeBlockoutGeometry
): void {
  const graphics = scene.add.graphics().setDepth(3);
  geometry.routeConnectors.forEach((connector) => {
    connector.assistZones.forEach((zone) => {
      const color = getAssistZoneColor(zone);
      if (zone.kind === 'climb') {
        drawLadderVisual(graphics, zone, color);
        scene.add.rectangle(zone.x, zone.y, 24, zone.height, 0x1f1f1d, 0.08)
          .setStrokeStyle(2, color, 0.28)
          .setDepth(2);
        return;
      }

      graphics.lineStyle(8, color, zone.kind === 'drop' ? 0.24 : 0.38);
      graphics.strokeLineShape(new Phaser.Geom.Line(
        zone.from.x,
        zone.from.y,
        zone.to.x,
        zone.to.y
      ));
    });
  });

  geometry.shortcutConnections.forEach((connection) => {
    connection.assistZones.forEach((zone) => {
      graphics.lineStyle(6, getAssistZoneColor(zone), 0.3);
      graphics.strokeLineShape(new Phaser.Geom.Line(
        zone.from.x,
        zone.from.y,
        zone.to.x,
        zone.to.y
      ));
    });
  });
}

function addBlockoutColliders(
  scene: Phaser.Scene,
  geometry: RidgeBlockoutGeometry
): Phaser.GameObjects.Zone[] {
  return geometry.colliders.map((collider) => {
    addColliderVisual(scene, collider);
    const zone = scene.add.zone(collider.x, collider.y, collider.width, collider.height);
    scene.physics.add.existing(zone, true);
    configureColliderBody(zone, collider);
    return zone;
  });
}

function configureColliderBody(
  zone: Phaser.GameObjects.Zone,
  collider: RidgeBlockoutCollider
): void {
  if (collider.movement !== 'ramp') return;
  const body = zone.body as Phaser.Physics.Arcade.StaticBody | undefined;
  if (!body) return;

  body.checkCollision.left = false;
  body.checkCollision.right = false;
  body.checkCollision.down = false;
  body.checkCollision.up = true;
}

function addColliderVisual(scene: Phaser.Scene, collider: RidgeBlockoutCollider): void {
  const style = getColliderStyle(collider);
  scene.add.rectangle(
    collider.x,
    collider.y,
    collider.width,
    collider.height,
    style.fill,
    style.alpha
  )
    .setStrokeStyle(style.strokeWidth, 0x1f1f1d, style.strokeAlpha)
    .setDepth(style.depth);
}

function addShortcutPromises(scene: Phaser.Scene, facts: RidgeBlockoutFacts): void {
  facts.shortcuts.forEach((connection) => {
    if (!connection.from) return;
    const graphics = scene.add.graphics().setDepth(6);
    graphics.lineStyle(4, connection.available ? 0xf0d35f : 0x1f1f1d, connection.available ? 0.34 : 0.16);
    graphics.strokeLineShape(new Phaser.Geom.Line(
      connection.from.x,
      connection.from.y,
      connection.to.x,
      connection.to.y
    ));

    if (!connection.available) {
      const centerX = (connection.from.x + connection.to.x) / 2;
      const centerY = (connection.from.y + connection.to.y) / 2;
      scene.add.rectangle(centerX, centerY, 96, 18, 0xf7f1df, 0.24)
        .setStrokeStyle(2, 0x1f1f1d, 0.18)
        .setAngle(-4)
        .setDepth(7);
    }
  });
}

function addAnchorMarkers(scene: Phaser.Scene, geometry: RidgeBlockoutGeometry): void {
  geometry.anchorPoints.forEach((anchor) => {
    if (!['A', '*', '?', '^', 'N', 'M'].includes(anchor.symbol)) return;
    scene.add.circle(anchor.x, anchor.y, 9, getAnchorColor(anchor), 0.58)
      .setStrokeStyle(2, 0x1f1f1d, 0.45)
      .setDepth(14);
    scene.add.text(anchor.x + 12, anchor.y - 14, anchor.symbol, {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#1f1f1d',
      backgroundColor: '#f7f1df99',
      padding: { x: 2, y: 1 }
    }).setDepth(15);
  });
}

function getColliderStyle(collider: RidgeBlockoutCollider): {
  fill: number;
  alpha: number;
  strokeWidth: number;
  strokeAlpha: number;
  depth: number;
} {
  switch (collider.kind) {
    case 'solid':
      return { fill: 0x2f4736, alpha: 0.94, strokeWidth: 1, strokeAlpha: 0.16, depth: 1 };
    case 'platform':
      return { fill: 0xd7c78f, alpha: 0.94, strokeWidth: 2, strokeAlpha: 0.42, depth: 4 };
    case 'route-connector':
      return { fill: 0xf7f1df, alpha: 0.96, strokeWidth: 2, strokeAlpha: 0.52, depth: 5 };
    case 'shortcut-connector':
      return { fill: 0xf0d35f, alpha: 0.82, strokeWidth: 2, strokeAlpha: 0.6, depth: 6 };
  }
}

function getAnchorColor(anchor: RidgeBlockoutAnchorPoint): number {
  switch (anchor.symbol) {
    case '*':
      return 0xb85f5a;
    case '?':
      return 0x596f8f;
    case '^':
      return 0xf0d35f;
    case 'A':
      return 0xd7c78f;
    default:
      return 0xf7f1df;
  }
}

function getAssistZoneColor(zone: RidgeBlockoutAssistZone): number {
  switch (zone.kind) {
    case 'ramp':
      return 0xd7c78f;
    case 'climb':
      return 0x596f8f;
    case 'drop':
      return 0xf0d35f;
  }
}

function drawLadderVisual(
  graphics: Phaser.GameObjects.Graphics,
  zone: RidgeBlockoutAssistZone,
  color: number
): void {
  const railOffset = 9;
  const minY = Math.min(zone.from.y, zone.to.y);
  const maxY = Math.max(zone.from.y, zone.to.y);

  graphics.lineStyle(4, color, 0.5);
  graphics.strokeLineShape(new Phaser.Geom.Line(
    zone.from.x - railOffset,
    zone.from.y,
    zone.to.x - railOffset,
    zone.to.y
  ));
  graphics.strokeLineShape(new Phaser.Geom.Line(
    zone.from.x + railOffset,
    zone.from.y,
    zone.to.x + railOffset,
    zone.to.y
  ));

  graphics.lineStyle(3, 0x1f1f1d, 0.22);
  for (let y = minY + 20; y < maxY; y += 34) {
    graphics.strokeLineShape(new Phaser.Geom.Line(
      zone.from.x - railOffset - 4,
      y,
      zone.from.x + railOffset + 4,
      y
    ));
  }
}
