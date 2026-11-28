import { ArrowUpRight } from 'lucide-react';
import { useMessages } from '@/shared/i18n';
import { getPortfolioData } from '@/shared/portfolio';
import { SketchSection } from '@/shared/ui';

export function ProjectsSection() {
  const messages = useMessages();
  const { projects } = getPortfolioData(messages);

  return (
    <SketchSection id="projects" title={messages.portfolio.projects.title}>
      <ul>
        {projects.map((project) => (
          <li
            key={project.title}
            className="border-b-2 border-dashed border-[#1a1a1a]/30 py-5 first:pt-0 last:border-b-0 last:pb-0"
          >
            <a
              href={project.link}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={messages.navigation.opensInNewTab(project.title)}
              className="group flex gap-4 outline-none focus-visible:bg-white"
            >
              <span className="min-w-0 flex-1">
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
                className="mt-1 h-5 w-5 shrink-0 text-[#1a1a1a]/50 motion-safe:transition-transform group-hover:text-[#1a1a1a] motion-safe:group-hover:-translate-y-0.5 motion-safe:group-hover:translate-x-0.5"
              />
            </a>
          </li>
        ))}
      </ul>
    </SketchSection>
  );
}
