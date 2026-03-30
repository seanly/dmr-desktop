import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface StartupScreenProps {
  onReady: () => void;
}

export function StartupScreen({ onReady }: StartupScreenProps) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('正在启动 DMR...');

  useEffect(() => {
    startSidecar();
  }, []);

  async function startSidecar() {
    try {
      setProgress(20);
      setStatus('启动 DMR 服务...');

      await invoke('start_sidecar');

      setProgress(80);
      setStatus('连接中...');

      await new Promise(resolve => setTimeout(resolve, 500));

      setProgress(100);
      setStatus('就绪');

      setTimeout(onReady, 300);
    } catch (error) {
      setStatus(`启动失败: ${error}`);
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-gray-900">
      <div className="w-96 space-y-4 text-center">
        <h1 className="text-2xl font-bold text-white">DMR Desktop</h1>
        <div className="space-y-2">
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-700">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-400">{status}</p>
        </div>
      </div>
    </div>
  );
}
