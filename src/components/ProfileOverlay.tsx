import React from 'react';
import { PORTFOLIO_DATA } from '../config/portfolio';

const ProfileOverlay: React.FC = () => {
  const { profile } = PORTFOLIO_DATA;
  
  return (
    <div className="text-[#1a1a1a]">
      <div className="bg-white p-6 rounded-lg border-4 border-[#1a1a1a] shadow-[8px_8px_0px_0px_rgba(26,26,26,1)] mb-4">
        <h3 className="text-2xl font-bold mb-4">About Me</h3>
        <p className="text-lg leading-relaxed mb-6 italic">
          "{profile.about}"
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span className="font-bold text-gray-600">Name:</span>
            <p className="text-xl">{profile.name}</p>
          </div>
          <div>
            <span className="font-bold text-gray-600">Location:</span>
            <p className="text-xl">{profile.location}</p>
          </div>
        </div>
      </div>
      <p className="text-center text-sm text-gray-500 font-mono mt-8">[ Press ESC or click X to return ]</p>
    </div>
  );
};

export default ProfileOverlay;
