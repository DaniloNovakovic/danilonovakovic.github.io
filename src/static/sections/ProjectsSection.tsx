import { PORTFOLIO_DATA } from '@/shared/content/portfolio/data';
import { PORTFOLIO_TEXT } from '@/shared/content/portfolio/text';
import { Badge, Card, LinkButton, SketchSection } from '@/shared/ui';

export function ProjectsSection() {
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
