import { CircleGeometry, Color, Group, Mesh, MeshBasicMaterial, Vector3, type Camera } from 'three';
import {
  GLIMPSE,
  lightAt,
  SIGHT,
  sightRange,
  type Escape,
  type EscapePlan,
  type GuardKind,
  type Glimpse
} from '@/game/core/realWorld';
import type { BuiltRoom } from './buildRoom';
import { insectOfficer, insectResearcher, type Alien } from './insectAlien';
import { droneBody, type DroneBody } from './storeProps';
import { NIGHT_LAB } from './toon';

/** The model's front is +z; a yaw of 0 faces -z. */
const turnFor = (yaw: number) => yaw + Math.PI;
/** Walk-cycle radians per world unit walked. */
const STRIDE_PER_UNIT = 5.5;
/** Pink like the aliens, so a cone never reads as a pool of light. */
const CONE_CALM = new Color(NIGHT_LAB.brain);
const CONE_ALERT = new Color(NIGHT_LAB.alert);
/** The cone's length eases to the range it sees you at, so it doesn't jump at a pool's edge. */
const CONE_EASE = 6;
/** Where an alien's head is, for its marker. */
const HEAD_HEIGHT = 2.5;

interface GuardView {
  kind: GuardKind;
  alien: Alien;
  cone: Group;
  fan: MeshBasicMaterial;
  marker: HTMLDivElement;
  fill: HTMLDivElement;
  stride: number;
  last: { x: number; z: number } | null;
  reach: number;
}

/**
 * A flat fan on the floor in front of an alien: how far and how wide it sees.
 * Its length is the range it would spot you at, where you stand now: long in
 * the light, short in the dark.
 */
function sightCone(kind: GuardKind) {
  const { halfAngle } = SIGHT[kind];
  const material = new MeshBasicMaterial({ color: CONE_CALM, transparent: true, opacity: 0.14, depthWrite: false });
  const fan = new Mesh(new CircleGeometry(1, 20, Math.PI / 2 - halfAngle, halfAngle * 2), material);
  fan.rotation.x = -Math.PI / 2;
  fan.position.y = 0.03;
  fan.userData.noInk = true;
  const cone = new Group();
  cone.add(fan);
  return { cone, material };
}

/** A "?" that fills as it makes up its mind, "!" once it has. Above its head, on screen. */
function alertMarker(overlay: HTMLElement) {
  const marker = document.createElement('div');
  marker.setAttribute('aria-hidden', 'true');
  marker.className =
    'pointer-events-none absolute -translate-x-1/2 -translate-y-full flex-col items-center font-mono text-2xl font-bold leading-none text-[#ffd36e] [text-shadow:0_0_3px_#000,0_1px_2px_#000]';
  const bar = document.createElement('div');
  bar.className = 'mt-1 h-1.5 w-8 overflow-hidden rounded-full border border-[#0b0e1c] bg-white/30';
  const fill = document.createElement('div');
  fill.className = 'h-full origin-left bg-[#ff5b4a]';
  bar.append(fill);
  marker.style.display = 'none';
  marker.append(document.createTextNode('?'), bar);
  overlay.append(marker);
  return { marker, fill };
}

/**
 * The light gem: how lit you are where you stand, so the dark is something
 * you can read on a phone. Dim navy in the dark, warm yellow in the light.
 */
function lightGem(overlay: HTMLElement) {
  const gem = document.createElement('div');
  gem.setAttribute('aria-hidden', 'true');
  gem.className =
    'pointer-events-none absolute left-1/2 bottom-[max(1.25rem,env(safe-area-inset-bottom))] hidden h-5 w-10 -translate-x-1/2 rounded-[50%] border-2 border-[#0b0e1c] shadow-[0_0_0_1px_rgba(255,255,255,.5)]';
  overlay.append(gem);
  const dark = new Color(0x1d2340);
  const lit = new Color(NIGHT_LAB.strip);
  const colour = new Color();
  return {
    gem,
    show(light: number | null) {
      gem.classList.toggle('hidden', light === null);
      if (light === null) return;
      colour.copy(dark).lerp(lit, light);
      gem.style.background = `#${colour.getHexString()}`;
      gem.style.boxShadow = `0 0 ${Math.round(light * 18)}px ${Math.round(light * 4)}px rgba(255,211,110,${(light * 0.6).toFixed(2)}), 0 0 0 1px rgba(255,255,255,.5)`;
    }
  };
}

export interface DeckActors {
  /**
   * Danilo is still up in the lab's duct: the researcher walks its glimpse,
   * along the corridor under the bolted grate, and nobody looks for him.
   */
  showGlimpse(glimpse: Glimpse, seconds: number): void;
  /** Danilo is on the deck at `player` (room coordinates): everyone as the escape has them. */
  show(escape: Escape, player: { x: number; z: number }, seconds: number, dt: number): void;
  /** Put the markers over the aliens' heads, on screen. Call after the camera has moved. */
  project(camera: Camera, width: number, height: number): void;
  wakeDrone(dock: number): void;
  dispose(): void;
}

/**
 * The ship deck's moving parts (#145): the researcher and the officer with
 * their sight cones and alert markers, the cleaning drones, the light gem.
 * Rendered from the core's `Escape`; no rules here.
 */
export function createDeckActors(deck: BuiltRoom, plan: EscapePlan, overlay: HTMLElement): DeckActors {
  const { kit } = deck;
  const guards: GuardView[] = plan.guards.map(({ kind }) => {
    const alien = kind === 'officer' ? insectOfficer(kit) : insectResearcher(kit);
    const { cone, material } = sightCone(kind);
    cone.visible = false;
    deck.root.add(alien.root, cone);
    return { kind, alien, cone, fan: material, ...alertMarker(overlay), stride: 0, last: null, reach: 0 };
  });
  const drones: DroneBody[] = plan.drones.docks.map((dock, i) => {
    const drone = droneBody(kit, i);
    drone.root.position.set(dock.x, 0, dock.z);
    drone.root.rotation.y = turnFor(0);
    deck.root.add(drone.root);
    return drone;
  });
  const gem = lightGem(overlay);
  const heads = guards.map(() => new Vector3());

  /** Stand an alien at (x, z) facing `yaw`, walking if it moved. */
  const place = (view: GuardView, x: number, z: number, yaw: number, twitch: number, seconds: number) => {
    const moved = view.last ? Math.hypot(x - view.last.x, z - view.last.z) : 0;
    view.last = { x, z };
    view.stride = moved > 1e-4 ? view.stride + moved * STRIDE_PER_UNIT : 0;
    view.alien.root.position.set(x, 0, z);
    view.alien.root.rotation.y = turnFor(yaw);
    view.alien.pose(
      kit.reducedMotion ? 0 : view.stride,
      kit.reducedMotion ? 0 : twitch,
      kit.reducedMotion ? 0 : seconds
    );
  };

  return {
    showGlimpse(glimpse, seconds) {
      const [researcher, ...others] = guards;
      const [skylight] = plan.room.skylights ?? [{ x: 0, z: 0 }];
      // Under reduced motion it just stands under the grate, reading its clipboard.
      const along = kit.reducedMotion ? GLIMPSE.stop : glimpse.along;
      const standing = glimpse.phase === 'lingering';
      place(researcher, skylight.x + 0.5, skylight.z + along, Math.PI, standing ? 1 : 0.2, seconds);
      researcher.alien.root.visible = glimpse.phase !== 'offstage' || kit.reducedMotion;
      others.forEach((other, i) => {
        const post = plan.guards[i + 1].route.posts[0];
        place(other, post.x, post.z, post.look ?? 0, 0.2, seconds);
      });
      for (const view of guards) {
        view.cone.visible = false;
        view.marker.style.display = 'none';
      }
      gem.show(null);
    },
    show(escape, player, seconds, dt) {
      const light = lightAt(plan.room, player.x, player.z);
      escape.guards.forEach((guard, i) => {
        const view = guards[i];
        view.alien.root.visible = true;
        const { x, z, yaw } = guard.patrol;
        place(view, x, z, yaw, guard.state === 'patrol' ? 0.2 : 1, seconds);
        const reach = sightRange(view.kind, light);
        view.reach += (reach - view.reach) * Math.min(1, dt * CONE_EASE);
        view.cone.visible = true;
        view.cone.position.set(x, 0, z);
        view.cone.rotation.y = yaw;
        view.cone.scale.setScalar(Math.max(0.5, view.reach));
        view.fan.color.copy(CONE_CALM).lerp(CONE_ALERT, guard.alert);
        view.fan.opacity = 0.12 + guard.alert * 0.2;
        const showing = guard.alert > 0.02;
        view.marker.style.display = showing ? 'flex' : 'none';
        view.marker.firstChild!.textContent = guard.state === 'caught' ? '!' : '?';
        view.marker.style.color = guard.state === 'patrol' ? '#ffd36e' : '#ff5b4a';
        view.fill.style.transform = `scaleX(${guard.alert})`;
      });
      const drone = escape.drone;
      if (drone) {
        const body = drones[drone.dock];
        body.root.position.set(drone.patrol.x, 0, drone.patrol.z);
        body.root.rotation.y = turnFor(drone.patrol.yaw);
        body.pose(seconds, drone.patrol.moving);
      }
      if (escape.doorOpen) deck.serviceDoor?.open();
      gem.show(light);
    },
    project(camera, width, height) {
      guards.forEach((view, i) => {
        if (view.marker.style.display === 'none') return;
        const head = heads[i].set(view.alien.root.position.x, HEAD_HEIGHT, view.alien.root.position.z);
        deck.root.localToWorld(head);
        head.project(camera);
        const onScreen = head.z < 1 && Math.abs(head.x) < 1.2 && Math.abs(head.y) < 1.2;
        view.marker.style.visibility = onScreen ? 'visible' : 'hidden';
        view.marker.style.left = `${((head.x + 1) / 2) * width}px`;
        view.marker.style.top = `${((1 - head.y) / 2) * height}px`;
      });
    },
    wakeDrone(dock) {
      drones[dock]?.wake();
    },
    dispose() {
      for (const view of guards) view.marker.remove();
      gem.gem.remove();
    }
  };
}
