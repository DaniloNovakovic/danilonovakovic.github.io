import { Suspense, lazy, useMemo } from 'react';
import { Gamepad2 } from 'lucide-react';
import { PORTFOLIO_DATA, type ContactIconId } from '../config/portfolio';
import { TEXTS } from '../config/content';

const ProfileOverlay = lazy(() => import('./ProfileOverlay'));
const ExperienceOverlay = lazy(() => import('./ExperienceOverlay'));
const ProjectsOverlay = lazy(() => import('./ProjectsOverlay'));
const AbilitiesOverlay = lazy(() => import('./AbilitiesOverlay'));
const ContactOverlay = lazy(() => import('./ContactOverlay'));

interface StaticPortfolioProps {
  onSwitchToInteractive: () => void;
}

const HERO_ICON_SRC: Record<ContactIconId, string> = {
  linkedin: '/icons/contact/linkedin.png',
  github: '/icons/contact/github.png',
  email: '/icons/contact/email.png'
};

function HeroContactLinks() {
  const { contact } = PORTFOLIO_DATA;
  return (
    <ul className="flex flex-wrap items-center justify-center gap-2">
      {contact.map((item) => (
        <li key={item.name}>
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex cursor-pointer items-center gap-1.5 rounded border-2 border-[#1a1a1a] bg-[#fbfbf9] px-2.5 py-1 text-xs font-bold uppercase tracking-widest text-[#1a1a1a] shadow-[3px_3px_0px_0px_rgba(26,26,26,1)] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] sm:text-sm"
          >
            <img src={HERO_ICON_SRC[item.icon]} alt="" className="h-5 w-5 object-contain" width={20} height={20} />
            {item.name}
          </a>
        </li>
      ))}
    </ul>
  );
}

interface SketchSectionProps {
  id: string;
  title: string;
  children: React.ReactNode;
}

function SketchSection({ id, title, children }: SketchSectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className="w-full scroll-mt-20"
    >
      <div className="mb-6 flex items-end gap-3">
        <h2
          id={`${id}-heading`}
          className="text-3xl font-bold tracking-tight text-[#1a1a1a] sm:text-4xl"
        >
          {title}
        </h2>
        <span aria-hidden className="mb-2 h-0.5 flex-1 bg-[#1a1a1a]/30" />
      </div>
      {/*
        Overlays include trailing modal-only hint lines (e.g. "[ Press ESC... ]",
        "[ Scroll to see more ]") that use `text-center ... font-mono`. Hide them
        when the overlay body is rendered inline as a static section.
      */}
      <div className="[&_.text-center.font-mono]:hidden">{children}</div>
    </section>
  );
}

function HobbiesSection() {
  const { hobbies } = PORTFOLIO_DATA;
  return (
    <SketchSection id="hobbies" title="Hobbies">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {hobbies.map((hobby) => (
          <article
            key={hobby.id}
            className="rounded-lg border-4 border-[#1a1a1a] bg-white p-5 shadow-[8px_8px_0px_0px_rgba(26,26,26,1)]"
          >
            <h3 className="mb-2 text-lg font-bold text-[#1a1a1a]">{hobby.name}</h3>
            <p className="text-sm leading-relaxed text-gray-700">{hobby.description}</p>
          </article>
        ))}
      </div>
    </SketchSection>
  );
}

function OverlayFallback() {
  return (
    <p className="text-sm font-bold text-[#1a1a1a] opacity-60">{TEXTS.common.loading}</p>
  );
}

export default function StaticPortfolio({ onSwitchToInteractive }: StaticPortfolioProps) {
  const { profile } = PORTFOLIO_DATA;
  const year = useMemo(() => new Date().getFullYear(), []);

  return (
    <div className="relative min-h-[100dvh] min-h-dvh w-full overflow-x-hidden bg-[#f4f1ea]">
      <div className="pointer-events-none fixed inset-0 z-0 bg-[url('https://www.transparenttextures.com/patterns/felt.png')] opacity-[0.05]" />

      {/* Mode switch link — sticky, top-right */}
      <button
        type="button"
        onClick={onSwitchToInteractive}
        className="fixed right-2 top-[max(0.5rem,env(safe-area-inset-top,0px))] z-40 inline-flex cursor-pointer items-center gap-1.5 rounded border-2 border-[#1a1a1a] bg-[#fbfbf9]/90 px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest text-[#1a1a1a] shadow-[3px_3px_0px_0px_rgba(26,26,26,1)] backdrop-blur-sm transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] sm:right-4 sm:top-4 sm:px-3 sm:py-1.5 sm:text-xs"
        aria-label="Switch to interactive portfolio"
      >
        <Gamepad2 className="h-4 w-4" strokeWidth={2} aria-hidden />
        <span className="hidden sm:inline">Try interactive</span>
        <span className="sm:hidden">Interactive</span>
      </button>

      <main className="relative z-10 mx-auto w-full max-w-3xl px-4 pb-[max(3rem,env(safe-area-inset-bottom,0px))] pt-[max(3rem,env(safe-area-inset-top,0px))] sm:px-6 sm:pt-16">
        {/* Hero */}
        <header className="mb-12 flex flex-col items-center gap-4 text-center sm:mb-16">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#1a1a1a]/60">
            Portfolio — Static edition
          </p>
          <h1 className="text-4xl font-bold text-[#1a1a1a] sm:text-6xl">{profile.name}</h1>
          <p className="text-sm font-bold uppercase tracking-widest text-[#1a1a1a]/70 sm:text-base">
            {profile.location}
          </p>
          <p className="mt-2 max-w-xl text-sm italic leading-relaxed text-[#1a1a1a]/80 sm:text-base">
            “{profile.about}”
          </p>
          <div className="mt-2">
            <HeroContactLinks />
          </div>
        </header>

        <div className="flex flex-col gap-14 sm:gap-20">
          <Suspense fallback={<OverlayFallback />}>
            <SketchSection id="about" title="About">
              <ProfileOverlay />
            </SketchSection>

            <SketchSection id="experience" title="Experience">
              <ExperienceOverlay />
            </SketchSection>

            <SketchSection id="projects" title="Projects">
              <ProjectsOverlay />
            </SketchSection>

            <SketchSection id="abilities" title="Abilities">
              <AbilitiesOverlay />
            </SketchSection>

            <HobbiesSection />

            <SketchSection id="contact" title="Contact">
              <ContactOverlay />
            </SketchSection>
          </Suspense>
        </div>

        <footer className="mt-16 flex flex-col items-center gap-3 border-t-2 border-dashed border-[#1a1a1a]/30 pt-6 text-center text-xs text-[#1a1a1a]/60 sm:mt-24">
          <p>
            Prefer the playful version?{' '}
            <button
              type="button"
              onClick={onSwitchToInteractive}
              className="cursor-pointer underline decoration-dashed underline-offset-2 hover:text-[#1a1a1a]"
            >
              Try interactive mode →
            </button>
          </p>
          <p>© {year} {profile.name}</p>
        </footer>
      </main>
    </div>
  );
}
