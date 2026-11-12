import type { ReactNode } from 'react';
import { Car, Check, Pencil, Truck } from 'lucide-react';
import type { BridgeEvaluation, BridgeTestVehicle } from '@/game/core/ridge';
import type { Messages } from '@/shared/i18n';
import { Button } from '@/shared/ui';
import type { BridgeBoardPhase } from './BridgeBoard';

type BridgeBuilderCopy = Messages['miniGames']['bridgeBuilder'];

interface BridgeBuilderSidebarProps {
  copy: BridgeBuilderCopy;
  evaluation: BridgeEvaluation;
  phase: BridgeBoardPhase;
  notice: string;
  onStartTest: (vehicle: BridgeTestVehicle) => void;
  onKeepDrawing: () => void;
  onFinish: () => void;
}

export function BridgeBuilderSidebar({
  copy,
  evaluation,
  phase,
  notice,
  onStartTest,
  onKeepDrawing,
  onFinish
}: BridgeBuilderSidebarProps) {
  return (
    <aside className="flex min-w-0 flex-col gap-3">
      <section className="rounded-lg border-2 border-[#1a1a1a] bg-[#f4f1ea] p-3 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)]">
        <h3 className="font-mono text-xs font-black uppercase tracking-widest">{copy.checksTitle}</h3>
        <ul className="mt-2 grid gap-2">
          {evaluation.checks.map((check) => (
            <li key={check.id} className="flex items-center gap-2 text-xs font-bold">
              <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-[#1a1a1a] ${check.passed ? 'bg-[#1a1a1a] text-[#fbfbf9]' : ''}`}>
                {check.passed ? <Check size={13} strokeWidth={3} /> : <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[#1a1a1a] opacity-30" />}
              </span>
              <span className="min-w-0 flex-1">{copy.checks[check.id]}</span>
              <span className="font-mono text-[10px] opacity-60">{copy.checkCount(check.current, check.required)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 border-t border-dashed border-[#1a1a1a]/40 pt-2 text-[11px] font-medium italic opacity-65">{copy.inkHint}</p>
      </section>

      <div className="grid grid-cols-2 gap-2">
        <VehicleBadge icon={<Car size={20} />} label={copy.car} passed={phase === 'car-passed' || phase === 'complete'} active={phase === 'car-testing'} passedLabel={copy.carPassed} />
        <VehicleBadge icon={<Truck size={20} />} label={copy.truck} passed={phase === 'complete'} active={phase === 'truck-testing'} passedLabel={copy.truckPassed} />
      </div>

      <div aria-live="polite" className={`min-h-[5.5rem] rounded border-2 border-dashed border-[#1a1a1a]/60 p-3 text-sm font-bold leading-relaxed ${phase === 'complete' ? 'bg-[#1a1a1a] text-[#fbfbf9]' : 'bg-[#fbfbf9]'}`}>
        {notice}
      </div>

      <BridgeTestActions copy={copy} phase={phase} onStartTest={onStartTest} onKeepDrawing={onKeepDrawing} onFinish={onFinish} />
    </aside>
  );
}

function BridgeTestActions({
  copy,
  phase,
  onStartTest,
  onKeepDrawing,
  onFinish
}: Pick<BridgeBuilderSidebarProps, 'copy' | 'phase' | 'onStartTest' | 'onKeepDrawing' | 'onFinish'>) {
  if (phase === 'car-testing' || phase === 'truck-testing') {
    return <Button variant="primary" size="lg" disabled>{copy.testing}</Button>;
  }
  if (phase === 'complete') {
    return <Button variant="primary" size="lg" onClick={onFinish} icon={<Check size={18} />}>{copy.returnToRidge}</Button>;
  }
  if (phase === 'car-passed') {
    return (
      <div className="grid gap-2">
        <Button variant="primary" size="lg" onClick={() => onStartTest('truck')} icon={<Truck size={18} />}>{copy.testTruck}</Button>
        <Button variant="secondary" size="sm" onClick={onKeepDrawing} icon={<Pencil size={14} />}>{copy.keepDrawing}</Button>
      </div>
    );
  }
  if (phase === 'failed') return null;
  return <Button variant="primary" size="lg" onClick={() => onStartTest('car')} icon={<Car size={18} />}>{copy.testCar}</Button>;
}

function VehicleBadge({
  icon,
  label,
  passed,
  active,
  passedLabel
}: {
  icon: ReactNode;
  label: string;
  passed: boolean;
  active: boolean;
  passedLabel: string;
}) {
  return (
    <div className={`rounded border-2 border-[#1a1a1a] p-2 text-center ${passed ? 'bg-[#1a1a1a] text-[#fbfbf9]' : 'bg-[#fbfbf9]'}`}>
      <div className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full border-2 ${passed ? 'border-[#fbfbf9]' : 'border-[#1a1a1a]'} ${active ? 'animate-pulse' : ''}`}>
        {passed ? <Check size={18} /> : icon}
      </div>
      <p className="mt-1 font-mono text-[9px] font-black tracking-wide">{passed ? passedLabel : label}</p>
    </div>
  );
}
