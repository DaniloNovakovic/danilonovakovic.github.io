import React from 'react';
import { PORTFOLIO_DATA } from '../config/portfolio';

const ContactOverlay: React.FC = () => {
  const { contact } = PORTFOLIO_DATA;
  
  return (
    <div className="text-[#1a1a1a]">
      <div className="grid grid-cols-1 gap-4">
        {contact.map((item, index) => (
          <a 
            key={index}
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center p-4 bg-white border-2 border-[#1a1a1a] rounded-lg shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] transition-all group"
          >
            <div className="w-10 h-10 bg-gray-100 rounded border border-[#1a1a1a] flex items-center justify-center mr-4 group-hover:bg-[#1a1a1a] group-hover:text-white transition-colors">
              <span className="font-bold uppercase text-[10px]">{item.icon}</span>
            </div>
            <div>
              <h3 className="text-lg font-bold">{item.name}</h3>
              <p className="text-gray-500 font-mono text-xs">{item.link.replace('mailto:', '')}</p>
            </div>
          </a>
        ))}
      </div>

      <div className="mt-8 p-4 bg-yellow-50 border-2 border-dashed border-[#1a1a1a] rounded-lg text-center">
        <p className="text-lg font-bold">“If I had asked people what they wanted, they would have said faster horses.”</p>
        <p className="mt-1 text-gray-600 text-sm">— Henry Ford</p>
      </div>
    </div>
  );
};

export default ContactOverlay;
