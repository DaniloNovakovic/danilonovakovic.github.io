import { Dumbbell, Footprints, Gamepad2, Guitar, Pencil } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useMessages } from '@/shared/i18n';
import { getPortfolioData } from '@/shared/portfolio';
import { SketchSection } from '@/shared/ui';
import { cn } from '@/shared/ui/utils';

type HobbyId = ReturnType<typeof getPortfolioData>['hobbies'][number]['id'];

/** Doodle stand-ins in the photo slot until real drawings replace them. */
const HOBBY_DOODLE: Record<HobbyId, LucideIcon> = {
  games: Gamepad2,
  art: Pencil,
  music: Guitar,
  fitness: Dumbbell,
  dancing: Footprints
};

/** Polaroids sit slightly crooked, like prints taped into a sketchbook. */
const TILTS = ['-rotate-2', 'rotate-1', '-rotate-1', 'rotate-2', '-rotate-1'];

export function HobbiesSection() {
  const messages = useMessages();
  const { hobbies } = getPortfolioData(messages);

  return (
    <SketchSection id="hobbies" title={messages.portfolio.hobbies.title}>
      <ul className="flex flex-wrap justify-center gap-x-4 gap-y-6 px-1 sm:gap-x-6">
        {hobbies.map((hobby, index) => {
          const Doodle = HOBBY_DOODLE[hobby.id];
          return (
            <li
              key={hobby.id}
              className={cn(
                'w-[calc(50%-0.5rem)] border-2 border-[#1a1a1a] bg-white p-2 pb-3 sm:w-[calc((100%-3rem)/3)] shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] motion-safe:transition-transform motion-safe:hover:rotate-0',
                TILTS[index % TILTS.length]
              )}
            >
              <div className="flex aspect-[4/3] items-center justify-center bg-[#f4f1ea]">
                <Doodle className="h-10 w-10 text-[#1a1a1a]/70" strokeWidth={1.5} aria-hidden />
              </div>
              <h3 className="mt-2 text-base font-bold text-[#1a1a1a]">{hobby.name}</h3>
              <p className="mt-0.5 text-xs leading-relaxed text-gray-700 sm:text-sm">{hobby.description}</p>
            </li>
          );
        })}
      </ul>
    </SketchSection>
  );
}
