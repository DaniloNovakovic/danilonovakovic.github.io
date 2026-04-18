import { useState } from 'react';

export default function MuayThaiMini() {
  const [hits, setHits] = useState(0);
  const [isHit, setIsHit] = useState(false);

  const punch = () => {
    setHits(h => h + 1);
    setIsHit(true);
    setTimeout(() => setIsHit(false), 150);
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full h-[250px] border-4 border-[#1a1a1a] shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] bg-[#fbfbf9] relative flex justify-center items-end pb-8">
        
        {/* Combo Counter */}
        <div className="absolute top-4 left-4 font-bold text-2xl">
          COMBO: {hits}
        </div>

        {/* Chain */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-16 border-l-4 border-dashed border-[#1a1a1a]"></div>

        {/* Punching Bag */}
        <div 
          onClick={punch}
          className={`w-24 h-40 border-4 border-[#1a1a1a] bg-[#e8e5df] rounded-b-2xl rounded-t-lg cursor-pointer flex flex-col items-center pt-2 transition-transform duration-100 ${isHit ? '-rotate-12 translate-x-4 -translate-y-2' : 'rotate-0 origin-top'}`}
          style={{ transformOrigin: 'top center' }}
        >
          <div className="w-16 h-4 border-2 border-[#1a1a1a] mb-2 opacity-50"></div>
          <div className="w-16 h-4 border-2 border-[#1a1a1a] opacity-50"></div>
          
          {isHit && (
            <div className="absolute top-1/2 left-0 -translate-x-12 -translate-y-1/2 font-bold text-xl rotate-12">
              BAM!
            </div>
          )}
        </div>

      </div>
      <div className="mt-4 text-sm font-bold text-[#1a1a1a] opacity-60">
        Click the bag to strike!
      </div>
    </div>
  );
}
