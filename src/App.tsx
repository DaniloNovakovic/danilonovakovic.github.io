import { useState } from 'react';
import Game from './components/Game';
import DrawingCanvas from './components/DrawingCanvas';
import GuitarStrings from './components/GuitarStrings';
import GamesMini from './components/GamesMini';
import MuayThaiMini from './components/MuayThaiMini';
import DancingMini from './components/DancingMini';
import CodingMini from './components/CodingMini';
import { X } from 'lucide-react';

function App() {
  const [activeArea, setActiveArea] = useState<string | null>(null);

  const handleInteract = (area: string) => {
    setActiveArea(area);
  };

  const closeOverlay = () => {
    setActiveArea(null);
    // Needs a way to refocus kaboom canvas if needed, but usually it works.
  };

  return (
    <div className="w-screen h-screen bg-[#f4f1ea] flex justify-center items-center relative overflow-hidden" style={{ fontFamily: '"Comic Sans MS", cursive, sans-serif' }}>
      
      {/* Game Container */}
      <div className="w-[1000px] h-[600px] relative">
        <Game onInteract={handleInteract} isPaused={!!activeArea} />
      </div>

      {/* Interactive Overlay */}
      {activeArea && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50 transition-all duration-300">
          <div className="bg-[#fbfbf9] text-[#1a1a1a] w-[600px] max-w-[90vw] p-8 relative animate-in zoom-in-95 fade-in border-4 border-[#1a1a1a] shadow-[12px_12px_0px_0px_rgba(26,26,26,1)]">
            <button 
              onClick={closeOverlay}
              className="absolute top-4 right-4 p-2 bg-[#f4f1ea] hover:bg-[#e8e5df] border-2 border-[#1a1a1a] rounded-full transition-colors"
            >
              <X size={20} color="#1a1a1a" />
            </button>
            
            <h2 className="text-4xl font-bold mb-4 uppercase tracking-wider border-b-4 border-[#1a1a1a] pb-2 inline-block">{activeArea}</h2>
            
            <div className="mt-6 text-xl leading-relaxed">
              {activeArea === 'drawing' && (
                <>
                  <p className="mb-6">
                    Drawing is one of my core passions. It allows me to express creativity visually. I am currently learning design and bridging the gap between my code and artistic expression.
                  </p>
                  <DrawingCanvas />
                </>
              )}

              {activeArea === 'guitar' && (
                <>
                  <p className="mb-6">
                    When I step away from the keyboard, I love to play the guitar. It's a great way to disconnect and recharge.
                  </p>
                  <GuitarStrings />
                </>
              )}

              {activeArea === 'games' && (
                <>
                  <p className="mb-6">
                    I'm a huge fan of video games! Playing them, making them, and analyzing their mechanics.
                  </p>
                  <GamesMini />
                </>
              )}

              {activeArea === 'muay thai' && (
                <>
                  <p className="mb-6">
                    Muay Thai keeps me disciplined and physically sharp. It's the ultimate test of endurance and focus.
                  </p>
                  <MuayThaiMini />
                </>
              )}

              {activeArea === 'dancing' && (
                <>
                  <p className="mb-6">
                    Dancing is pure joy and rhythm. It's a fun way to stay active and express myself physically.
                  </p>
                  <DancingMini />
                </>
              )}

              {activeArea === 'coding' && (
                <>
                  <p className="mb-6">
                    I've been coding since 2016. With deep experience in both Backend and Frontend, I'm now combining engineering with design to build complete, beautiful products.
                  </p>
                  <CodingMini />
                </>
              )}
            </div>
          </div>
        </div>
      )}
      
      <div className="absolute bottom-4 left-4 text-[#1a1a1a] text-lg font-bold bg-[#fbfbf9] px-4 py-2 border-2 border-[#1a1a1a] shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] pointer-events-none">
        Use A/D or Arrows to walk. Press E to enter buildings.
      </div>
    </div>
  );
}

export default App;
