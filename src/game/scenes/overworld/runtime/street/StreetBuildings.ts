/**
 * StreetBuildings — places building sprites and labels for the overworld.
 * Extracted from OverworldScene so the scene is a thin orchestrator.
 */
import * as Phaser from 'phaser';
import type { OverlayId } from '@/game/overlays/overlayIds';
import { createUiText } from '@/game/sharedSceneRuntime/text/createUiText';
import { getMessages } from '@/shared/i18n';
import { getSceneDefinition } from '@/game/scenes/sceneRegistry';
import { OVERWORLD_BUILDING_TRIGGERS, type OverworldBuildingTrigger } from '../../worldLayout';

const BUILDING_Y = 395;
const LABEL_Y = 150;
const FOCUS_LIFT_PX = 6;
const FOCUS_WOBBLE_RAD = 0.008;
const FOCUS_LABEL_WOBBLE_RAD = 0.035;

export interface StreetBuildingFace {
  buildingId: string;
  x: number;
  sketch: Phaser.GameObjects.Sprite;
  pixel: Phaser.GameObjects.Sprite;
  label: Phaser.GameObjects.Text;
}

export interface StreetBuildingLayers {
  interactables: Phaser.GameObjects.Group;
  /** Same order as `interactables` group children used for building slots. */
  faces: readonly StreetBuildingFace[];
  sketchLayer: Phaser.GameObjects.Layer;
  pixelLayer: Phaser.GameObjects.Layer;
  /** Per-building sketch vs pixel visibility from precomputed flags (same order as `faces`). */
  applyLensProximityReveal(flags: readonly boolean[]): void;
  /** Paper-lift + stepped ink wobble on the building the player can enter. */
  applyFocus(buildingId: string | null, tick: number, motion: boolean): void;
}

export function buildStreetBuildings(scene: Phaser.Scene): StreetBuildingLayers {
  const group = scene.add.group();
  const sketchLayer = scene.add.layer();
  const pixelLayer = scene.add.layer();
  sketchLayer.setVisible(true);
  pixelLayer.setVisible(true);

  const faces: StreetBuildingFace[] = [];

  for (const trigger of OVERWORLD_BUILDING_TRIGGERS) {
    const bldg = scene.add.sprite(trigger.x, BUILDING_Y, `building_${trigger.id}`);
    const pixelBldg = scene.add.sprite(trigger.x, BUILDING_Y, `building_${trigger.id}_pixel`);
    sketchLayer.add(bldg);
    pixelLayer.add(pixelBldg);
    pixelBldg.setVisible(false);
    pixelBldg.setAlpha(1);
    bldg.setAlpha(1);

    const label = createUiText(scene, trigger.x, LABEL_Y, getBuildingLabel(trigger).toUpperCase(), {
      fontSize: '22px',
      color: '#1a1a1a',
      fontStyle: 'bold'
    })
      .setOrigin(0.5)
      .setScrollFactor(1);

    bldg.setData('name', trigger.id);
    group.add(bldg);
    faces.push({ buildingId: trigger.id, x: trigger.x, sketch: bldg, pixel: pixelBldg, label });
  }

  return {
    interactables: group,
    faces,
    sketchLayer,
    pixelLayer,
    applyLensProximityReveal(flags: readonly boolean[]) {
      for (let i = 0; i < faces.length; i++) {
        const reveal = flags[i] === true;
        const { sketch, pixel } = faces[i];
        if (reveal) {
          sketch.setVisible(true);
          sketch.setAlpha(0.32);
          pixel.setVisible(true);
          pixel.setAlpha(1);
        } else {
          sketch.setVisible(true);
          sketch.setAlpha(1);
          pixel.setVisible(false);
          pixel.setAlpha(1);
        }
      }
    },
    applyFocus(buildingId: string | null, tick: number, motion: boolean) {
      // Stepped 4-frame wobble: -1, 0, 1, 0.
      const phase = tick % 4;
      const wobble = !motion ? 0 : phase === 0 ? -1 : phase === 2 ? 1 : 0;
      for (const face of faces) {
        const focused = face.buildingId === buildingId;
        const lift = focused ? FOCUS_LIFT_PX : 0;
        const rotation = focused ? wobble * FOCUS_WOBBLE_RAD : 0;
        face.sketch.setY(BUILDING_Y - lift).setRotation(rotation);
        face.pixel.setY(BUILDING_Y - lift).setRotation(rotation);
        face.label
          .setY(LABEL_Y - lift * 2)
          .setRotation(focused ? wobble * FOCUS_LABEL_WOBBLE_RAD : 0)
          .setScale(focused ? 1.12 : 1);
      }
    }
  };
}

function getBuildingLabel(trigger: OverworldBuildingTrigger): string {
  return trigger.action.kind === 'openOverlay'
    ? getOverworldOverlayLabel(trigger.action.overlayId)
    : getSceneDefinition(trigger.action.sceneId).title;
}

function getOverworldOverlayLabel(overlayId: OverlayId): string {
  const messages = getMessages();
  switch (overlayId) {
    case 'profile':
      return messages.catalog.portfolio.profile.name;
    case 'experiences':
      return messages.catalog.portfolio.experiences.name;
    case 'projects':
      return messages.catalog.portfolio.projects.name;
    case 'abilities':
      return messages.catalog.portfolio.abilities.name;
    case 'contact':
      return messages.catalog.portfolio.contact.name;
    default:
      return overlayId;
  }
}
