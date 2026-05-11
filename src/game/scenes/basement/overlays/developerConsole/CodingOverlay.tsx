import { useState, useRef, useEffect } from 'react';
import { OverlayDialogFrame } from '@/game/overlays/OverlayDialogFrame';
import type { OverlayControllerProps } from '@/game/overlays/types';
import { useMessages } from '@/shared/i18n';
import { bridgeActions } from '@/game/bridge/store';
import { executeDeveloperConsoleCommand } from './commands';

export default function CodingOverlay({ close, titleId, descriptionId }: OverlayControllerProps) {
  const messages = useMessages();
  const copy = messages.miniGames.coding;
  const [history, setHistory] = useState<string[]>([
    copy.welcome,
    copy.helpText
  ]);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(function scrollTerminalHistoryToBottom() {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  useEffect(function focusTerminalInputOnMount() {
    const raf = requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  const handleCommand = (cmd: string) => {
    const result = executeDeveloperConsoleCommand(cmd, copy, {
      enterScene: (sceneId) => bridgeActions.enterScene(sceneId)
    });

    if (result.clearHistory) {
      setHistory([]);
      return;
    }

    if (!result.responseLines?.length) {
      return;
    }

    setHistory(prev => [...prev, `> ${cmd}`, ...result.responseLines]);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input) return;
    handleCommand(input);
    setInput('');
  };

  return (
    <OverlayDialogFrame
      title={messages.catalog.basement.games.name}
      description={messages.catalog.basement.games.description}
      close={close}
      titleId={titleId}
      descriptionId={descriptionId}
    >
      <div className="w-full flex flex-col items-center">
        <div className="w-full h-[250px] border-4 border-[#1a1a1a] shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] bg-[#1a1a1a] text-[#33ff33] p-4 font-mono text-sm overflow-y-auto flex flex-col">

          {history.map((line, i) => (
            <div key={i} className="mb-1">{line}</div>
          ))}

          <form onSubmit={onSubmit} className="flex mt-2">
            <span className="mr-2">{'>'}</span>
            <input
              ref={inputRef}
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
          {copy.instruction}
        </div>
      </div>
    </OverlayDialogFrame>
  );
}
