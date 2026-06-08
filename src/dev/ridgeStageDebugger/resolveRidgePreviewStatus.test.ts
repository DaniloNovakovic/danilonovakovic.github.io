import { describe, expect, it } from 'vitest';
import { resolveRidgePreviewStatus } from './resolveRidgePreviewStatus';

describe('resolveRidgePreviewStatus', () => {
  it('reports debugger inactive when preview is not active', () => {
    expect(resolveRidgePreviewStatus({
      activeOverlayId: null,
      authoringActive: false,
      inputOwner: 'game',
      isActive: false,
      isPaused: false,
      loadingSceneId: null
    })).toMatchObject({
      inputStatusLabel: 'Debugger inactive',
      pauseReason: 'Debugger inactive',
      showPausedOverlay: false
    });
  });

  it('labels authoring mode and skips the paused overlay', () => {
    expect(resolveRidgePreviewStatus({
      activeOverlayId: null,
      authoringActive: true,
      inputOwner: 'game',
      isActive: true,
      isPaused: true,
      loadingSceneId: null
    })).toMatchObject({
      inputStatusLabel: 'Authoring mode',
      pauseReason: 'Authoring mode',
      showPausedOverlay: false
    });
  });

  it('shows the paused overlay for panel focus outside authoring', () => {
    expect(resolveRidgePreviewStatus({
      activeOverlayId: null,
      authoringActive: false,
      inputOwner: 'panel',
      isActive: true,
      isPaused: false,
      loadingSceneId: null
    })).toMatchObject({
      inputStatusLabel: 'Panel focus',
      pauseReason: 'Panel focus',
      isInputPaused: true,
      showPausedOverlay: true
    });
  });
});
