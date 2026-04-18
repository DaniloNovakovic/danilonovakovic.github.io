import { useState } from 'react';
import Game from './components/Game';
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
    <div className="w-screen h-screen bg-neutral-900 flex justify-center items-center relative overflow-hidden">
      
      {/* Game Container */}
      <div className="w-[800px] h-[600px] relative">
        <Game onInteract={handleInteract} />
      </div>

      {/* Interactive Overlay */}
      {activeArea && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 transition-all duration-300">
          <div className="bg-white text-neutral-900 w-[600px] max-w-[90vw] rounded-2xl shadow-2xl p-8 relative animate-in zoom-in-95 fade-in">
            <button 
              onClick={closeOverlay}
              className="absolute top-4 right-4 p-2 bg-neutral-100 hover:bg-neutral-200 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
            
            <h2 className="text-3xl font-bold mb-4 capitalize">{activeArea}</h2>
            
            {activeArea === 'drawing' && (
              <>
                <p className="text-lg text-neutral-600 mb-6">
                  Drawing is one of my core passions. It allows me to express creativity visually. I am currently learning design and bridging the gap between my code and artistic expression.
                </p>
                <div className="bg-red-50 rounded-xl h-48 flex justify-center items-center border border-red-100">
                  <span className="text-red-400 font-medium italic">🎨 Digital Canvas Mini-game coming soon...</span>
                </div>
              </>
            )}

            {activeArea === 'guitar' && (
              <>
                <p className="text-lg text-neutral-600 mb-6">
                  When I step away from the keyboard, I love to play the guitar. It's a great way to disconnect and recharge.
                </p>
                <div className="bg-green-50 rounded-xl h-48 flex justify-center items-center border border-green-100">
                  <span className="text-green-500 font-medium italic">🎸 Rhythm Mini-game coming soon...</span>
                </div>
              </>
            )}

            {activeArea === 'games' && (
              <>
                <p className="text-lg text-neutral-600 mb-6">
                  I'm a huge fan of video games! Playing them, making them, and analyzing their mechanics.
                </p>
                <div className="bg-blue-50 rounded-xl h-48 flex justify-center items-center border border-blue-100">
                  <span className="text-blue-500 font-medium italic">🎮 Arcade Mini-game coming soon...</span>
                </div>
              </>
            )}

            {activeArea === 'muay thai' && (
              <>
                <p className="text-lg text-neutral-600 mb-6">
                  Muay Thai keeps me disciplined and physically sharp. It's the ultimate test of endurance and focus.
                </p>
                <div className="bg-orange-50 rounded-xl h-48 flex justify-center items-center border border-orange-100">
                  <span className="text-orange-500 font-medium italic">🥊 Punching Bag Interaction coming soon...</span>
                </div>
              </>
            )}

            {activeArea === 'dancing' && (
              <>
                <p className="text-lg text-neutral-600 mb-6">
                  Dancing is pure joy and rhythm. It's a fun way to stay active and express myself physically.
                </p>
                <div className="bg-purple-50 rounded-xl h-48 flex justify-center items-center border border-purple-100">
                  <span className="text-purple-500 font-medium italic">🕺 Dance Floor Mini-game coming soon...</span>
                </div>
              </>
            )}

            {activeArea === 'coding' && (
              <>
                <p className="text-lg text-neutral-600 mb-6">
                  I've been coding since 2016. With deep experience in both Backend and Frontend, I'm now combining engineering with design to build complete, beautiful products.
                </p>
                <div className="bg-cyan-50 rounded-xl h-48 flex justify-center items-center border border-cyan-100">
                  <span className="text-cyan-600 font-medium italic">💻 Terminal interaction coming soon...</span>
                </div>
              </>
            )}
            
          </div>
        </div>
      )}
      
      <div className="absolute bottom-4 left-4 text-white/50 text-sm pointer-events-none">
        Use WASD or Arrows to move. Walk to a colored square and press SPACE.
      </div>
    </div>
  );
}

export default App;
