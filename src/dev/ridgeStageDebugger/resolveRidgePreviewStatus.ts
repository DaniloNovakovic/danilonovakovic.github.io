import type { RidgePreviewInputOwner } from './RidgeRuntimePreview';

export function resolveRidgePreviewStatus(input: {
  activeOverlayId: string | null;
  authoringActive: boolean;
  inputOwner: RidgePreviewInputOwner;
  isActive: boolean;
  isPaused: boolean;
  loadingSceneId: string | null;
}): {
  inputStatusLabel: string;
  isInputPaused: boolean;
  pauseReason: string;
  showPausedOverlay: boolean;
} {
  const isInputPaused =
    !input.isActive ||
    input.isPaused ||
    input.loadingSceneId !== null ||
    (input.inputOwner === 'panel' && !input.authoringActive);
  const showPausedOverlay =
    input.isActive &&
    !input.authoringActive &&
    isInputPaused &&
    input.loadingSceneId === null &&
    input.activeOverlayId === null;

  if (!input.isActive) {
    return {
      isInputPaused,
      inputStatusLabel: 'Debugger inactive',
      pauseReason: 'Debugger inactive',
      showPausedOverlay
    };
  }

  if (input.authoringActive) {
    return {
      isInputPaused,
      inputStatusLabel: 'Authoring mode',
      pauseReason: 'Authoring mode',
      showPausedOverlay
    };
  }

  if (input.inputOwner === 'panel') {
    return {
      isInputPaused,
      inputStatusLabel: 'Panel focus',
      pauseReason: 'Panel focus',
      showPausedOverlay
    };
  }

  if (input.isPaused || input.loadingSceneId !== null) {
    return {
      isInputPaused,
      inputStatusLabel: 'Runtime paused',
      pauseReason: 'Runtime paused',
      showPausedOverlay
    };
  }

  return {
    isInputPaused,
    inputStatusLabel: 'Game input',
    pauseReason: 'Runtime paused',
    showPausedOverlay
  };
}
