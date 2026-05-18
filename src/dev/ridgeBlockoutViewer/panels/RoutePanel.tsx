import type { RidgeBlockoutViewerModel } from '../model';

export function RoutePanel({ model }: { model: RidgeBlockoutViewerModel }) {
  return (
    <section className="border-b-2 border-[#1a1a1a] py-4">
      <h2 className="text-lg font-black">Topology</h2>
      <div className="mt-3 space-y-3 text-sm">
        {model.routes.map((route) => (
          <div key={route.id}>
            <p className="font-black">Route: {route.id}</p>
            <p className="text-xs leading-relaxed text-[#5a554f]">{route.roomIds.join(' -> ')}</p>
          </div>
        ))}
        <div>
          <p className="font-black">Future routes</p>
          <p className="text-xs leading-relaxed text-[#5a554f]">
            {model.futureRoutes.map((route) => route.id).join(', ')}
          </p>
        </div>
        <div>
          <p className="font-black">Shortcuts</p>
          <ul className="mt-1 space-y-1 text-xs text-[#5a554f]">
            {model.shortcuts.map((shortcut) => (
              <li key={shortcut.id}>
                {shortcut.id}: {shortcut.lockedAvailable ? 'available' : 'locked'} /{' '}
                {shortcut.unlockedAvailable ? 'unlocked with Stampede' : 'still locked'}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
