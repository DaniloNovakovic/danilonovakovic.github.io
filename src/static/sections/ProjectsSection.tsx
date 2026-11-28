import { ArrowUpRight } from 'lucide-react';
import { useMessages } from '@/shared/i18n';
import { getPortfolioData } from '@/shared/portfolio';
import { SketchSection } from '@/shared/ui';

export function ProjectsSection() {
  const messages = useMessages();
  const { projects } = getPortfolioData(messages);

  return (
    <SketchSection id="projects" title={messages.portfolio.projects.title}>
      <ol className="border-t-2 border-[#1a1a1a]">
        {projects.map((project, index) => (
          <li
            key={project.title}
            className="border-b-2 border-dashed border-[#1a1a1a]/30 last:border-solid last:border-[#1a1a1a]"
          >
            <a
              href={project.link}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={messages.navigation.opensInNewTab(project.title)}
              className="group grid grid-cols-[2.5rem_1fr_auto] gap-x-3 py-5 outline-none focus-visible:bg-white sm:grid-cols-[3.5rem_1fr_auto] sm:gap-x-4"
            >
              <span aria-hidden className="pt-1 font-mono text-sm text-[#1a1a1a]/50">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="min-w-0">
                <span className="block text-lg font-bold text-[#1a1a1a] underline-offset-4 group-hover:underline sm:text-xl">
                  {project.title}
                </span>
                <span className="mt-1 block text-sm leading-relaxed text-gray-700 sm:text-base">
                  {project.description}
                </span>
                <span className="mt-2 block font-mono text-xs lowercase text-[#1a1a1a]/60">
                  {project.tags.join(' · ')}
                </span>
              </span>
              <ArrowUpRight
                aria-hidden
                strokeWidth={2.5}
                className="mt-1 h-5 w-5 text-[#1a1a1a]/50 motion-safe:transition-transform group-hover:text-[#1a1a1a] motion-safe:group-hover:-translate-y-0.5 motion-safe:group-hover:translate-x-0.5"
              />
            </a>
          </li>
        ))}
      </ol>
    </SketchSection>
  );
}
