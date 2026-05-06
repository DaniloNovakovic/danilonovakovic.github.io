import React from 'react';
import { useMessages } from '@/shared/i18n';
import { getPortfolioData } from '@/shared/portfolio';
import { Card, LinkButton, Badge } from '@/shared/ui';

const ProjectsOverlay: React.FC = () => {
  const messages = useMessages();
  const { projects } = getPortfolioData(messages);
  
  return (
    <div className="text-[#1a1a1a]">
      <div className="grid grid-cols-1 gap-6">
        {projects.map((project, index) => (
          <Card key={index} className="flex flex-col">
            <h3 className="text-xl font-bold mb-2">{project.title}</h3>
            <p className="text-base text-gray-700 mb-4">{project.description}</p>
            <div className="flex flex-wrap gap-2 mb-6">
              {project.tags.map((tag, tIndex) => (
                <Badge key={tIndex}>
                  {tag}
                </Badge>
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
    </div>
  );
};

export default ProjectsOverlay;
