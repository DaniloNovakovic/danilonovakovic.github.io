import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  RidgeDevControls,
  RidgeDevDebugSettings,
  RidgeDevPlayerSnapshot,
  RidgeDevResetRequest,
  RidgeDevTeleportRequest
} from '@/game/scenes/ridge/runtime/ridgeDevControls';
import {
  INITIAL_PREVIEW_ZOOM,
  PLAYER_SNAPSHOT_RENDER_INTERVAL_MS
} from '../constants';
import type { RidgeViewerAnchor } from '../model';
import { clampPreviewZoom } from '../modelViewport';
import { getTeleportAnchorLabel } from '../teleportTargets';

export function useRidgePreviewControls() {
  const [previewZoom, setPreviewZoom] = useState(INITIAL_PREVIEW_ZOOM);
  const [debugSettings, setDebugSettings] = useState<RidgeDevDebugSettings>({
    graybox: false,
    showColliders: false,
    showPlayerBody: false,
    showInteractZones: false,
    showTraversalAssists: false
  });
  const [lastTeleportLabel, setLastTeleportLabel] = useState<string | null>(null);
  const [playerSnapshot, setPlayerSnapshot] = useState<RidgeDevPlayerSnapshot | null>(null);
  const previewZoomRef = useRef(INITIAL_PREVIEW_ZOOM);
  const debugSettingsRef = useRef(debugSettings);
  const resetRequestRef = useRef<RidgeDevResetRequest | null>(null);
  const resetSequenceRef = useRef(0);
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
      label: 'start'
    };
    resetRequestRef.current = request;
    setLastTeleportLabel(`reset ${request.label}`);
  }, []);

  const requestTeleport = useCallback((anchor: RidgeViewerAnchor) => {
    const request = {
      sequence: ++teleportSequenceRef.current,
      label: getTeleportAnchorLabel(anchor),
      x: anchor.x,
      y: anchor.y,
      applySpawnOffset: true
    };
    teleportRequestRef.current = request;
    setLastTeleportLabel(request.label);
  }, []);

  return {
    adjustPreviewZoom,
    debugSettings,
    lastTeleportLabel,
    playerSnapshot,
    previewZoom,
    requestPlayerReset,
    requestTeleport,
    ridgeDevControls,
    setPreviewZoomLevel,
    toggleDebugSetting
  };
}
