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
            
            <h2 className="text-3xl font-bold mb-4 capitalize">{activeArea} Room</h2>
            <p className="text-lg text-neutral-600 mb-6">
              Welcome to the {activeArea} area! Here you'll be able to learn more about my journey and hobbies.
            </p>
            
            <div className="bg-neutral-100 rounded-xl h-48 flex justify-center items-center">
              <span className="text-neutral-400 italic">Content coming soon...</span>
            </div>
            
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
