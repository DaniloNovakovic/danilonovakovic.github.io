import { getMessages } from '@/shared/i18n';
import {
  BASEMENT_SCENE_ID,
  HOBBIES_SCENE_ID,
  OVERWORLD_SCENE_ID,
  type SceneId
} from '@/game/scenes/sceneIds';
import type { OverlayId } from '@/game/overlays/overlayIds';

export interface DevSwitcherOverlayTarget {
  id: OverlayId;
  label: string;
  returnToSceneId: SceneId;
}

export function getDevSwitcherOverlayTargets(): readonly DevSwitcherOverlayTarget[] {
  const messages = getMessages();
  return [
    {
      id: 'profile',
      label: messages.catalog.portfolio.profile.name,
      returnToSceneId: OVERWORLD_SCENE_ID
    },
    {
      id: 'experiences',
      label: messages.catalog.portfolio.experiences.name,
      returnToSceneId: OVERWORLD_SCENE_ID
    },
    {
      id: 'projects',
      label: messages.catalog.portfolio.projects.name,
      returnToSceneId: OVERWORLD_SCENE_ID
    },
    {
      id: 'abilities',
      label: messages.catalog.portfolio.abilities.name,
      returnToSceneId: OVERWORLD_SCENE_ID
    },
    {
      id: 'contact',
      label: messages.catalog.portfolio.contact.name,
      returnToSceneId: OVERWORLD_SCENE_ID
    },
    {
      id: 'art',
      label: messages.catalog.hobbies.art.name,
      returnToSceneId: HOBBIES_SCENE_ID
    },
    {
      id: 'music',
      label: messages.catalog.hobbies.music.name,
      returnToSceneId: HOBBIES_SCENE_ID
    },
    {
      id: 'fitness',
      label: messages.catalog.hobbies.fitness.name,
      returnToSceneId: HOBBIES_SCENE_ID
    },
    {
      id: 'dancing',
      label: messages.catalog.hobbies.dancing.name,
      returnToSceneId: HOBBIES_SCENE_ID
    },
    {
      id: 'games',
      label: messages.catalog.basement.games.name,
      returnToSceneId: BASEMENT_SCENE_ID
    }
  ];
}
