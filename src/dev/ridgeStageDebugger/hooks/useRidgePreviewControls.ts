import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { RidgeBridgeBeatState } from '@/game/bridge/store';
import type {
  RidgeDevControls,
  RidgeDevDebugSettings,
  RidgeDevPlayerSnapshot,
  RidgeDevResetRequest,
  RidgeDevRouteBeatRequest,
  RidgeDevTeleportRequest
} from '@/game/scenes/ridge/runtime/ridgeDevControls';
import {
  BRIDGE_STAGE_SOURCE,
  resolveBridgeStageSpot,
  type BridgeStageSpotId
} from '@/game/scenes/ridge/bridge/stageComposition';
import {
  INITIAL_PREVIEW_ZOOM,
  PREVIEW_ZOOM_MAX,
  PREVIEW_ZOOM_MIN,
  PLAYER_SNAPSHOT_RENDER_INTERVAL_MS
} from '../constants';

export function useRidgePreviewControls() {
  const [previewZoom, setPreviewZoom] = useState(INITIAL_PREVIEW_ZOOM);
  const [debugSettings, setDebugSettings] = useState<RidgeDevDebugSettings>({
    graybox: false,
    showColliders: false,
    showPlayerBody: false,
    showInteractZones: false,
    showTraversalAssists: true
  });
  const [lastCommandLabel, setLastCommandLabel] = useState<string | null>(null);
  const [playerSnapshot, setPlayerSnapshot] = useState<RidgeDevPlayerSnapshot | null>(null);
  const previewZoomRef = useRef(INITIAL_PREVIEW_ZOOM);
  const debugSettingsRef = useRef(debugSettings);
  const resetRequestRef = useRef<RidgeDevResetRequest | null>(null);
  const resetSequenceRef = useRef(0);
  const routeBeatRequestRef = useRef<RidgeDevRouteBeatRequest | null>(null);
  const routeBeatSequenceRef = useRef(0);
  const teleportRequestRef = useRef<RidgeDevTeleportRequest | null>(null);
  const teleportSequenceRef = useRef(0);
  const lastPlayerSnapshotRenderAtRef = useRef(0);

  useEffect(function syncPreviewZoomRef() {
    previewZoomRef.current = previewZoom;
  }, [previewZoom]);

  useEffect(function syncDebugSettingsRef() {
    debugSettingsRef.current = debugSettings;
  }, [debugSettings]);

  const ridgeDevControls = useMemo<RidgeDevControls>(() => ({
    resolveCameraZoom: () => previewZoomRef.current,
    resolveDebugSettings: () => debugSettingsRef.current,
    consumeRouteBeatRequest: () => {
      const request = routeBeatRequestRef.current;
      routeBeatRequestRef.current = null;
      return request;
    },
    consumeResetRequest: () => {
      const request = resetRequestRef.current;
      resetRequestRef.current = null;
      return request;
    },
    consumeTeleportRequest: () => {
      const request = teleportRequestRef.current;
      teleportRequestRef.current = null;
      return request;
    },
    publishPlayerSnapshot: (snapshot) => {
      const now = Date.now();
      if (now - lastPlayerSnapshotRenderAtRef.current < PLAYER_SNAPSHOT_RENDER_INTERVAL_MS) return;
      lastPlayerSnapshotRenderAtRef.current = now;
      setPlayerSnapshot(snapshot);
    }
  }), []);

  const adjustPreviewZoom = useCallback((delta: number) => {
    setPreviewZoom((current) => clampPreviewZoom(current + delta));
  }, []);

  const setPreviewZoomLevel = useCallback((zoom: number) => {
    setPreviewZoom(clampPreviewZoom(zoom));
  }, []);

  const toggleDebugSetting = useCallback((setting: keyof RidgeDevDebugSettings) => {
    setDebugSettings((current) => ({
      ...current,
      [setting]: !current[setting]
    }));
  }, []);

  const requestPlayerReset = useCallback(() => {
    const request = {
      sequence: ++resetSequenceRef.current,
      label: 'spawn'
    };
    resetRequestRef.current = request;
    setLastCommandLabel(`reset ${request.label}`);
  }, []);

  const requestBridgeBeat = useCallback((bridgeBeat: RidgeBridgeBeatState) => {
    const request = {
      sequence: ++routeBeatSequenceRef.current,
      label: bridgeBeat,
      bridgeBeat
    };
    routeBeatRequestRef.current = request;
    setLastCommandLabel(`beat ${request.label}`);
  }, []);

  const requestStageSpotTeleport = useCallback((spotId: BridgeStageSpotId) => {
    const spot = resolveBridgeStageSpot(BRIDGE_STAGE_SOURCE, spotId);
    const request = {
      sequence: ++teleportSequenceRef.current,
      label: spot.id,
      x: spot.x,
      y: spot.y,
      applySpawnOffset: false
    };
    teleportRequestRef.current = request;
    setLastCommandLabel(`spot ${request.label}`);
  }, []);

  return {
    adjustPreviewZoom,
    debugSettings,
    lastCommandLabel,
    playerSnapshot,
    previewZoom,
    requestBridgeBeat,
    requestPlayerReset,
    requestStageSpotTeleport,
    ridgeDevControls,
    setPreviewZoomLevel,
    toggleDebugSetting
  };
}

function clampPreviewZoom(zoom: number): number {
  if (!Number.isFinite(zoom)) return INITIAL_PREVIEW_ZOOM;
  return Math.min(PREVIEW_ZOOM_MAX, Math.max(PREVIEW_ZOOM_MIN, Math.round(zoom * 100) / 100));
}
