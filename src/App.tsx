import { useState, useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import { StartupScreen } from './components/StartupScreen';
import { ChatInterface } from './components/ChatInterface';

export default function App() {
  const [ready, setReady] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const setupListener = async () => {
      const unlisten = await listen('app-close-requested', async () => {
        await handleClose();
      });
      return unlisten;
    };

    let cleanup: (() => void) | undefined;
    setupListener().then(fn => {
      cleanup = fn;
    });

    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  async function handleClose() {
    setClosing(true);
    try {
      await invoke('stop_sidecar');
      await invoke('exit');
    } catch (error) {
      console.error('Failed to close:', error);
    }
  }

  if (closing) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900">
        <p className="text-white">正在关闭...</p>
      </div>
    );
  }

  if (!ready) {
    return <StartupScreen onReady={() => setReady(true)} />;
  }

  return <ChatInterface />;
}
