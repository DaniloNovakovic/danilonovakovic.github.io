import { ArrowUpRight } from 'lucide-react';
import { useMessages } from '@/shared/i18n';
import { getPortfolioData } from '@/shared/portfolio';
import { Badge, Card, LinkButton, SketchSection } from '@/shared/ui';

export function ProjectsSection() {
  const messages = useMessages();
  const { projects } = getPortfolioData(messages);

  return (
    <SketchSection id="projects" title={messages.portfolio.projects.title}>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
        {projects.map((project) => (
          <Card as="article" key={project.title} padding="md" border="medium" shadow="md" className="flex flex-col">
            <h3 className="mb-2 text-lg font-bold">{project.title}</h3>
            <p className="mb-4 text-sm leading-relaxed text-gray-700">{project.description}</p>
            <div className="mb-4 flex flex-wrap gap-1.5">
              {project.tags.map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>
            <LinkButton
              href={project.link}
              target="_blank"
              rel="noopener noreferrer"
              variant="quiet"
              className="mt-auto self-start p-0 text-sm"
              aria-label={messages.navigation.opensInNewTab(project.title)}
            >
              {messages.staticPortfolio.viewProject}
              <ArrowUpRight className="h-4 w-4" strokeWidth={2.5} aria-hidden />
            </LinkButton>
          </Card>
        ))}
      </div>
    </SketchSection>
  );
}
