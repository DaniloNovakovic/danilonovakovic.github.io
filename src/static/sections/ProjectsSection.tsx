import { useMessages } from '@/shared/i18n';
import { getPortfolioData } from '@/shared/portfolio';
import { Badge, Card, LinkButton, SketchSection } from '@/shared/ui';

export function ProjectsSection() {
  const messages = useMessages();
  const { projects } = getPortfolioData(messages);

  return (
    <SketchSection id="projects" title={messages.portfolio.projects.title}>
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
              {messages.common.viewMore}
            </LinkButton>
          </Card>
        ))}
      </div>
    </SketchSection>
  );
}
