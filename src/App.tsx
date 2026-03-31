import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import Setup from './Setup';

export default function App() {
  const [configExists, setConfigExists] = useState<boolean | null>(null);

  useEffect(() => {
    checkConfig();
  }, []);

  async function checkConfig() {
    try {
      const exists = await invoke<boolean>('check_config_exists');
      setConfigExists(exists);

      if (exists) {
        // 配置存在，等待 DMR 启动后跳转
        await new Promise(resolve => setTimeout(resolve, 2000));
        window.location.href = 'http://localhost:8080';
      }
    } catch (err) {
      console.error('检查配置失败:', err);
    }
  }

  if (configExists === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">初始化中...</div>
      </div>
    );
  }

  if (!configExists) {
    return <Setup />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <div className="text-xl text-gray-700 mb-2">正在启动 DMR...</div>
        <div className="text-sm text-gray-500">首次启动可能需要几秒钟</div>
      </div>
    </div>
  );
}
