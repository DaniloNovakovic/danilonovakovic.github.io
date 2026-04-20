import { useState, useRef, useEffect } from 'react';
import { TEXTS } from '../config/content';

export default function CodingMini() {
  const [history, setHistory] = useState([
    TEXTS.miniGames.coding.welcome,
    TEXTS.miniGames.coding.helpText
  ]);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleCommand = (cmd: string) => {
    const trimmed = cmd.trim().toLowerCase();
    let response = '';

    switch (trimmed) {
      case 'help':
        response = TEXTS.miniGames.coding.helpResponse;
        break;
      case 'whoami':
        response = TEXTS.miniGames.coding.whoamiResponse;
        break;
      case 'skills':
        response = TEXTS.miniGames.coding.skillsResponse;
        break;
      case 'clear':
        setHistory([]);
        return;
      case '':
        return;
      default:
        response = `${TEXTS.miniGames.coding.notFound}${trimmed}`;
    }

    setHistory(prev => [...prev, `> ${cmd}`, ...response.split('\n')]);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input) return;
    handleCommand(input);
    setInput('');
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full h-[250px] border-4 border-[#1a1a1a] shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] bg-[#1a1a1a] text-[#33ff33] p-4 font-mono text-sm overflow-y-auto flex flex-col">

        {history.map((line, i) => (
          <div key={i} className="mb-1">{line}</div>
        ))}

        <form onSubmit={onSubmit} className="flex mt-2">
          <span className="mr-2">{'>'}</span>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="bg-transparent outline-none flex-1 text-[#33ff33]"
            spellCheck={false}
          />
        </form>
        <div ref={bottomRef} />

      </div>
      <div className="mt-4 text-sm font-bold text-[#1a1a1a] opacity-60">
        {TEXTS.miniGames.coding.instruction}
      </div>
    </div>
  );
}

