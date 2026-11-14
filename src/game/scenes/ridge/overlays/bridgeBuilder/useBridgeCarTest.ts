import { useEffect, useRef, useState } from 'react';
import {
  createBridgeSimulation,
  stepBridgeSimulation,
  type BridgeDesign,
  type BridgeSimulation
} from '@/game/core/ridge';

export type BridgeWorkbenchPhase = 'draft' | 'testing' | 'failed' | 'complete';

export function useBridgeCarTest(design: BridgeDesign) {
  const simulationRef = useRef<BridgeSimulation | null>(null);
  const [simulation, setSimulation] = useState<BridgeSimulation | null>(null);
  const [frame, setFrame] = useState(0);
  const [phase, setPhase] = useState<BridgeWorkbenchPhase>('draft');

  useEffect(() => {
    if (phase !== 'testing') return;
    const reducedMotion = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const stepsPerFrame = reducedMotion ? 8 : 2;
    const interval = window.setInterval(() => {
      const simulation = simulationRef.current;
      if (!simulation) return;
      for (let index = 0; index < stepsPerFrame && simulation.status === 'running'; index += 1) {
        stepBridgeSimulation(simulation);
      }
      setFrame((current) => current + 1);
      if (simulation.status === 'crossed') setPhase('complete');
      if (simulation.status === 'failed') setPhase('failed');
    }, 1000 / 60);
    return () => window.clearInterval(interval);
  }, [phase]);

  const start = () => {
    if (phase === 'testing' || design.beams.length === 0) return;
    const created = createBridgeSimulation(design);
    simulationRef.current = created;
    setSimulation(created);
    setFrame((current) => current + 1);
    setPhase('testing');
  };

  const stop = () => {
    simulationRef.current = null;
    setSimulation(null);
    setFrame((current) => current + 1);
    setPhase('draft');
  };

  return {
    frame,
    phase,
    simulation,
    start,
    stop
  };
}
