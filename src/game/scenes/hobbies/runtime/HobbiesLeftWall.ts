/**
 * HobbiesLeftWall — the Out of Bounds entrance disguised as a collision bug.
 * The left wall is a real static body and stops the player like the right
 * wall. Keep pushing into it for a moment and the player jitters and pops
 * through to the blank page outside. Walking back right passes straight in,
 * and the wall turns solid again once the player is back inside the room.
 */
import type * as Phaser from 'phaser';
import { HOBBIES_LEFT_WALL_X, HOBBIES_PLAYER_LEFT_WALL_STOP_X } from '@/game/core/console';

/** How long the player must push into the wall before it gives. */
const PUSH_TO_CLIP_MS = 400;
const WALL_THICKNESS = 10;
/** Stepped sketch-style jitter (px from the stop x), one entry per frame. */
const JITTER = [3, -2, 4, -3, 2, -1];
/** Where the player lands: just outside the wall line. */
const CLIP_LANDING_X = HOBBIES_LEFT_WALL_X - (HOBBIES_PLAYER_LEFT_WALL_STOP_X - HOBBIES_LEFT_WALL_X) - 2;
/** Back inside past this x, the wall is solid again. */
const RESOLID_X = HOBBIES_PLAYER_LEFT_WALL_STOP_X + 8;

type WallState = { kind: 'solid'; pushedMs: number } | { kind: 'glitching'; frame: number } | { kind: 'open' };

export class HobbiesLeftWall {
  private readonly player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private readonly motion: boolean;
  private state: WallState = { kind: 'solid', pushedMs: 0 };

  constructor(scene: Phaser.Scene, player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody, motion: boolean) {
    this.player = player;
    this.motion = motion;
    const height = scene.physics.world.bounds.height;
    const wall = scene.add.zone(HOBBIES_LEFT_WALL_X - WALL_THICKNESS / 2, height / 2, WALL_THICKNESS, height);
    scene.physics.add.existing(wall, true);
    scene.physics.add.collider(player, wall, undefined, () => this.state.kind === 'solid');
  }

  update(deltaMs: number): void {
    switch (this.state.kind) {
      case 'solid':
        this.updateSolid(deltaMs);
        break;
      case 'glitching':
        this.updateGlitch(this.state.frame);
        break;
      case 'open':
        if (this.player.x > RESOLID_X) this.state = { kind: 'solid', pushedMs: 0 };
        break;
    }
  }

  private updateSolid(deltaMs: number): void {
    if (this.state.kind !== 'solid') return;
    const { body } = this.player;
    const pressed = (body.blocked.left || body.touching.left) && this.player.x <= HOBBIES_PLAYER_LEFT_WALL_STOP_X + 2;
    const pushedMs = pressed ? this.state.pushedMs + deltaMs : 0;
    if (pushedMs < PUSH_TO_CLIP_MS) {
      this.state = { kind: 'solid', pushedMs };
      return;
    }
    if (this.motion) this.state = { kind: 'glitching', frame: 0 };
    else this.popThrough();
  }

  private updateGlitch(frame: number): void {
    const offset = JITTER[frame];
    if (offset === undefined) {
      this.popThrough();
      return;
    }
    this.player.body.reset(HOBBIES_PLAYER_LEFT_WALL_STOP_X + offset, this.player.y);
    this.state = { kind: 'glitching', frame: frame + 1 };
  }

  private popThrough(): void {
    this.player.body.reset(CLIP_LANDING_X, this.player.y);
    this.state = { kind: 'open' };
  }
}
