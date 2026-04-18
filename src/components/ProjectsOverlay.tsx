import React from 'react';
import { PORTFOLIO_DATA } from '../config/portfolio';

const ProjectsOverlay: React.FC = () => {
  const { projects } = PORTFOLIO_DATA;
  
  return (
    <div className="text-[#1a1a1a]">
      <div className="grid grid-cols-1 gap-6">
        {projects.map((project, index) => (
          <div key={index} className="bg-white p-6 rounded-lg border-4 border-[#1a1a1a] shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] flex flex-col">
            <h3 className="text-xl font-bold mb-2">{project.title}</h3>
            <p className="text-base text-gray-700 mb-4">{project.description}</p>
            <div className="flex flex-wrap gap-2 mb-6">
              {project.tags.map((tag, tIndex) => (
                <span key={tIndex} className="bg-gray-100 text-[#1a1a1a] px-2 py-0.5 rounded border border-[#1a1a1a] text-[10px] font-bold uppercase">
                  {tag}
                </span>
              ))}
            </div>
            <a 
              href={project.link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="mt-auto bg-[#1a1a1a] text-white py-2 px-4 rounded text-center font-bold hover:bg-gray-800 transition-colors text-sm"
            >
              View More
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectsOverlay;
