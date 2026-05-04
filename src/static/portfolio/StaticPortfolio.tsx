import { useMemo } from 'react';
import { Gamepad2 } from 'lucide-react';
import { PORTFOLIO_DATA, type ContactIconId } from '@shared/content/portfolio/data';
import { PORTFOLIO_TEXT } from '@shared/content/portfolio/text';
import { Badge, Button, Card, LinkButton, SketchSection, Tag } from '@shared/ui';

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
          <LinkButton
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            icon={<img src={HERO_ICON_SRC[item.icon]} alt="" className="h-5 w-5 object-contain" width={20} height={20} />}
          >
            {item.name}
          </LinkButton>
        </li>
      ))}
    </ul>
  );
}

function AboutSection() {
  const { profile } = PORTFOLIO_DATA;
  return (
    <SketchSection id="about" title={PORTFOLIO_TEXT.profile.title}>
      <Card>
        <p className="mb-6 text-lg italic leading-relaxed">"{profile.about}"</p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <span className="font-bold text-gray-600">{PORTFOLIO_TEXT.profile.name}</span>
            <p className="text-xl">{profile.name}</p>
          </div>
          <div>
            <span className="font-bold text-gray-600">{PORTFOLIO_TEXT.profile.location}</span>
            <p className="text-xl">{profile.location}</p>
          </div>
        </div>
      </Card>
    </SketchSection>
  );
}

function ExperienceSection() {
  const { experiences } = PORTFOLIO_DATA;
  return (
    <SketchSection id="experience" title="Experience">
      <div className="space-y-8">
        {experiences.map((exp) => (
          <Card key={`${exp.company}-${exp.period}`}>
            <div className="mb-4 flex flex-col border-b-2 border-gray-100 pb-2 md:flex-row md:items-center md:justify-between">
              <h3 className="text-xl font-bold">{exp.title}</h3>
              <Badge shape="pill" className="font-mono text-sm normal-case tracking-normal">{exp.period}</Badge>
            </div>
            <p className="mb-2 text-lg font-semibold">
              {exp.companyUrl ? (
                <LinkButton
                  href={exp.companyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="quiet"
                  className="inline p-0 text-lg normal-case tracking-normal"
                  aria-label={`${exp.company} (opens in new tab)`}
                >
                  {exp.company}
                </LinkButton>
              ) : (
                <span>{exp.company}</span>
              )}
            </p>
            <p className="text-base leading-relaxed text-gray-700">{exp.description}</p>
          </Card>
        ))}
      </div>
    </SketchSection>
  );
}

function ProjectsSection() {
  const { projects } = PORTFOLIO_DATA;
  return (
    <SketchSection id="projects" title={PORTFOLIO_TEXT.projects.title}>
      <div className="grid grid-cols-1 gap-6">
        {projects.map((project) => (
          <Card key={project.title} className="flex flex-col">
            <h3 className="mb-2 text-xl font-bold">{project.title}</h3>
            <p className="mb-4 text-base text-gray-700">{project.description}</p>
            <div className="mb-6 flex flex-wrap gap-2">
              {project.tags.map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>
            <LinkButton
              href={project.link}
              target="_blank"
              rel="noopener noreferrer"
              variant="primary"
              className="mt-auto py-2 text-sm"
            >
              View More
            </LinkButton>
          </Card>
        ))}
      </div>
    </SketchSection>
  );
}

function AbilitiesSection() {
  const { abilities } = PORTFOLIO_DATA;
  return (
    <SketchSection id="abilities" title={PORTFOLIO_TEXT.abilities.title}>
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <h3 className="mb-4 border-b-2 border-gray-100 pb-2 text-xl font-bold">{PORTFOLIO_TEXT.abilities.skills}</h3>
          <div className="flex flex-wrap gap-2">
            {abilities.skills.map((skill) => <Tag key={skill}>{skill}</Tag>)}
          </div>
        </Card>
        <Card>
          <h3 className="mb-4 border-b-2 border-gray-100 pb-2 text-xl font-bold">{PORTFOLIO_TEXT.abilities.tools}</h3>
          <div className="flex flex-wrap gap-2">
            {abilities.tools.map((tool) => <Tag key={tool}>{tool}</Tag>)}
          </div>
        </Card>
        <Card>
          <h3 className="mb-4 border-b-2 border-gray-100 pb-2 text-xl font-bold">{PORTFOLIO_TEXT.abilities.languages}</h3>
          <ul className="space-y-2">
            {abilities.languages.map((language) => (
              <li key={language} className="flex items-center gap-2 text-base">
                <span className="h-2 w-2 rounded-full bg-[#1a1a1a]" />
                {language}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </SketchSection>
  );
}

function HobbiesSection() {
  const { hobbies } = PORTFOLIO_DATA;
  return (
    <SketchSection id="hobbies" title="Hobbies">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {hobbies.map((hobby) => (
          <Card as="article" key={hobby.id} padding="md">
            <h3 className="mb-2 text-lg font-bold text-[#1a1a1a]">{hobby.name}</h3>
            <p className="text-sm leading-relaxed text-gray-700">{hobby.description}</p>
          </Card>
        ))}
      </div>
    </SketchSection>
  );
}

function ContactSection() {
  const { contact } = PORTFOLIO_DATA;
  return (
    <SketchSection id="contact" title={PORTFOLIO_TEXT.contact.title}>
      <div className="grid grid-cols-1 gap-4">
        {contact.map((item) => (
          <LinkButton
            key={item.name}
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex justify-start p-4 normal-case tracking-normal shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]"
          >
            <div className="mr-4 flex h-10 w-10 shrink-0 items-center justify-center rounded border border-[#1a1a1a] bg-gray-100 transition-colors group-hover:bg-[#1a1a1a]">
              <img src={HERO_ICON_SRC[item.icon]} alt="" className="h-7 w-7 object-contain" width={28} height={28} />
            </div>
            <div>
              <h3 className="text-lg font-bold">{item.name}</h3>
              <p className="font-mono text-xs text-gray-500">{item.link.replace('mailto:', '')}</p>
            </div>
          </LinkButton>
        ))}
      </div>

      <Card border="medium" shadow="none" className="mt-8 border-dashed bg-yellow-50 p-4 text-center">
        <p className="text-lg font-bold">{PORTFOLIO_TEXT.contact.quote}</p>
        <p className="mt-1 text-sm text-gray-600">{PORTFOLIO_TEXT.contact.quoteAuthor}</p>
      </Card>
    </SketchSection>
  );
}

export default function StaticPortfolio({ onSwitchToInteractive }: StaticPortfolioProps) {
  const { profile } = PORTFOLIO_DATA;
  const year = useMemo(() => new Date().getFullYear(), []);

  return (
    <div className="relative min-h-[100dvh] min-h-dvh w-full overflow-x-hidden bg-[#f4f1ea]">
      <div className="pointer-events-none fixed inset-0 z-0 bg-[url('https://www.transparenttextures.com/patterns/felt.png')] opacity-[0.05]" />

      <Button
        variant="floating"
        size="sm"
        onClick={onSwitchToInteractive}
        className="fixed right-2 top-[max(0.5rem,env(safe-area-inset-top,0px))] z-40 sm:right-4 sm:top-4 sm:px-3 sm:py-1.5 sm:text-xs"
        aria-label="Switch to interactive portfolio"
      >
        <Gamepad2 className="h-4 w-4" strokeWidth={2} aria-hidden />
        <span className="hidden sm:inline">Try interactive</span>
        <span className="sm:hidden">Interactive</span>
      </Button>

      <main className="relative z-10 mx-auto w-full max-w-3xl px-4 pb-[max(3rem,env(safe-area-inset-bottom,0px))] pt-[max(3rem,env(safe-area-inset-top,0px))] sm:px-6 sm:pt-16">
        <header className="mb-12 flex flex-col items-center gap-4 text-center sm:mb-16">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#1a1a1a]/60">
            Portfolio — Static edition
          </p>
          <h1 className="text-4xl font-bold text-[#1a1a1a] sm:text-6xl">{profile.name}</h1>
          <p className="text-sm font-bold uppercase tracking-widest text-[#1a1a1a]/70 sm:text-base">
            {profile.location}
          </p>
          <p className="mt-2 max-w-xl text-sm italic leading-relaxed text-[#1a1a1a]/80 sm:text-base">
            "{profile.about}"
          </p>
          <div className="mt-2">
            <HeroContactLinks />
          </div>
        </header>

        <div className="flex flex-col gap-14 sm:gap-20">
          <AboutSection />
          <ExperienceSection />
          <ProjectsSection />
          <AbilitiesSection />
          <HobbiesSection />
          <ContactSection />
        </div>

        <footer className="mt-16 flex flex-col items-center gap-3 border-t-2 border-dashed border-[#1a1a1a]/30 pt-6 text-center text-xs text-[#1a1a1a]/60 sm:mt-24">
          <p>
            Prefer the playful version?{' '}
            <Button
              variant="ghost"
              size="sm"
              onClick={onSwitchToInteractive}
              className="p-0 text-xs"
            >
              Try interactive mode →
            </Button>
          </p>
          <p>© {year} {profile.name}</p>
        </footer>
      </main>
    </div>
  );
}
