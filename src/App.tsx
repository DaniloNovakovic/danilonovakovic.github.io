import { useState, useEffect, useRef } from 'react';
import Game from './components/Game';
import { X } from 'lucide-react';
import { GameState, type AppState } from './game/gameState';
import { getMiniGameById } from './game/miniGameRegistry';
import { MiniGameType } from './game/types';
import { TEXTS } from './config/content';

function App() {
  const [state, setState] = useState<AppState>({
    status: GameState.EXPLORING,
    activeMiniGameId: null
  });
  const modalRef = useRef<HTMLDivElement>(null);

  const handleInteract = (area: string) => {
    setState({
      status: GameState.IN_MINIGAME,
      activeMiniGameId: area
    });
  };

  const closeOverlay = () => {
    // If we are in a hobby sub-game, return to the hobbies room
    const hobbyItems = ['games', 'art', 'music', 'fitness'];
    if (state.activeMiniGameId && hobbyItems.includes(state.activeMiniGameId)) {
      setState({
        status: GameState.IN_MINIGAME,
        activeMiniGameId: 'hobbies'
      });
    } else {
      setState({
        status: GameState.EXPLORING,
        activeMiniGameId: null
      });
    }
  };

  // Global Escape handler for React Overlays
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && state.status === GameState.IN_MINIGAME) {
        const activeGame = getMiniGameById(state.activeMiniGameId!);
        if (activeGame?.type === MiniGameType.REACT_OVERLAY) {
          closeOverlay();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.status, state.activeMiniGameId]);

  // Phase 5: Auto-focus modal for keyboard scrollability
  useEffect(() => {
    if (state.status === GameState.IN_MINIGAME && modalRef.current) {
      modalRef.current.focus();
    }
  }, [state.status, state.activeMiniGameId]);

  const activeMiniGame = state.activeMiniGameId ? getMiniGameById(state.activeMiniGameId) : undefined;
  const isPaused = state.status === GameState.IN_MINIGAME && activeMiniGame?.type === MiniGameType.REACT_OVERLAY;

  return (
    <div className="w-screen h-screen bg-[#f4f1ea] flex justify-center items-center relative overflow-hidden" style={{ fontFamily: '"Comic Sans MS", cursive, sans-serif' }}>
      
      {/* Game Container */}
      <div className="w-[1000px] h-[600px] relative overflow-hidden rounded-lg border-4 border-[#1a1a1a] shadow-[12px_12px_0px_0px_rgba(26,26,26,1)]">
        {/* Paper Texture Overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] z-50 bg-[url('https://www.transparenttextures.com/patterns/felt.png')]"></div>
        <Game 
          onInteract={handleInteract} 
          isPaused={isPaused} 
          activeMiniGameId={state.activeMiniGameId}
          onClose={closeOverlay}
        />
      </div>

      {/* Interactive Overlay */}
      {state.status === GameState.IN_MINIGAME && activeMiniGame && activeMiniGame.type === MiniGameType.REACT_OVERLAY && (
        <div className="fixed inset-0 z-50 flex justify-center items-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-300 p-4">
          <div 
            ref={modalRef}
            tabIndex={0}
            className="bg-[#fbfbf9] text-[#1a1a1a] w-[600px] max-w-full p-8 relative animate-in zoom-in-95 fade-in border-4 border-[#1a1a1a] shadow-[12px_12px_0px_0px_rgba(26,26,26,1)] max-h-[90vh] overflow-y-auto outline-none focus:ring-0"
          >
            <button 
              onClick={closeOverlay}
              className="absolute top-4 right-4 p-2 bg-[#f4f1ea] hover:bg-[#e8e5df] border-2 border-[#1a1a1a] rounded-full transition-colors z-10"
            >
              <X size={20} color="#1a1a1a" />
            </button>
            
            <h2 className="text-4xl font-bold mb-4 uppercase tracking-wider border-b-4 border-[#1a1a1a] pb-2 inline-block">
              {activeMiniGame.name}
            </h2>
            
            <div className="mt-6 text-xl leading-relaxed">
              <p className="mb-8 font-medium italic opacity-80">
                {activeMiniGame.description}
              </p>
              
              <div className="mt-4">
                {activeMiniGame.Component && <activeMiniGame.Component />}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating UI Hints */}
      {state.status === GameState.EXPLORING && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#fbfbf9]/80 backdrop-blur-sm border-2 border-[#1a1a1a] px-4 py-2 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] opacity-60 hover:opacity-100 transition-opacity">
          <p className="text-sm font-bold uppercase tracking-widest text-[#1a1a1a]">
            {TEXTS.navigation.hints}
          </p>
        </div>
      )}
    </div>
  );
}

export default App;
