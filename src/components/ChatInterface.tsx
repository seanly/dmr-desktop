import { useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { ApprovalOverlay } from './ApprovalOverlay';
import { useChat } from '../hooks/useChat';
import { useApproval } from '../hooks/useApproval';

export function ChatInterface() {
  const { messages, input, setInput, loading, sendMessage } = useChat();
  const { approvals } = useApproval();
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleFileClick = async (path: string) => {
    try {
      await invoke('open_file', { path });
    } catch (error) {
      console.error('Failed to open file:', error);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-gray-900">
      <header className="border-b border-gray-800 p-4">
        <h1 className="text-lg font-semibold text-white">DMR Desktop</h1>
        <p className="text-sm text-gray-400">Tape: desktop</p>
      </header>

      <MessageList
        ref={scrollRef}
        messages={messages}
        loading={loading}
        onFileClick={handleFileClick}
      />

      <MessageInput
        value={input}
        onChange={setInput}
        onSend={sendMessage}
        disabled={loading}
      />

      {approvals.length > 0 && <ApprovalOverlay approvals={approvals} />}
    </div>
  );
}
