import { useState, useRef, useEffect } from 'react';

export default function CodingMini() {
  const [history, setHistory] = useState([
    "Welcome to DaniloOS v1.0",
    "Type 'help' to see available commands."
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
        response = 'Available commands: whoami, skills, clear';
        break;
      case 'whoami':
        response = 'Danilo Novakovic. Coding since 2016. Lover of logic and design.';
        break;
      case 'skills':
        response = '> Frontend: React, Vite, Tailwind\n> Backend: Node, APIs, Databases\n> Design: Sketching, UI/UX';
        break;
      case 'clear':
        setHistory([]);
        return;
      case '':
        return;
      default:
        response = `Command not found: ${trimmed}`;
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
            autoFocus
            spellCheck={false}
          />
        </form>
        <div ref={bottomRef} />

      </div>
      <div className="mt-4 text-sm font-bold text-[#1a1a1a] opacity-60">
        Hack the mainframe!
      </div>
    </div>
  );
}
