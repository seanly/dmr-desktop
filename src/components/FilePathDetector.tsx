import { useState, useRef, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { FolderOpen, Home, ChevronDown, Copy, Check } from "lucide-react";

interface FilePathMatch {
  path: string;
  start: number;
  end: number;
  isRelative: boolean;
}

function detectFilePaths(text: string): FilePathMatch[] {
  const patterns = [
    // file:// protocol with relative path
    { regex: /file:\/\/(\.\.?\/[^\s<>"{}|\\^`\[\]]+)/g, isRelative: true },
    // file:// protocol with absolute path
    { regex: /file:\/\/([^\s<>"{}|\\^`\[\]]+)/g, isRelative: false },
    // Relative paths
    { regex: /(?:^|\s)(\.\.?\/[^\s<>"{}|\\^`\[\]]+)/g, isRelative: true },
    // Absolute paths (Unix/Mac)
    { regex: /(?:^|\s)(\/[^\s<>"{}|\\^`\[\]]+)/g, isRelative: false },
    // Home directory paths
    { regex: /(?:^|\s)(~\/[^\s<>"{}|\\^`\[\]]+)/g, isRelative: false },
  ];

  const matches: FilePathMatch[] = [];

  for (const { regex, isRelative } of patterns) {
    let match;
    while ((match = regex.exec(text)) !== null) {
      const fullMatch = match[0];
      const pathPart = match[1] || fullMatch;
      const start = match.index + (fullMatch.length - pathPart.length);

      // Remove file:// prefix if present
      const cleanPath = pathPart.startsWith('file://')
        ? pathPart.slice(7)
        : pathPart;

      matches.push({
        path: cleanPath,
        start,
        end: start + pathPart.length,
        isRelative,
      });
    }
  }

  return matches.sort((a, b) => a.start - b.start);
}

interface FilePathTooltipProps {
  path: string;
  isRelative: boolean;
  position: { x: number; y: number };
  onClose: () => void;
}

function FilePathTooltip({ path, isRelative, position, onClose }: FilePathTooltipProps) {
  const [opening, setOpening] = useState(false);
  const [workspacePath, setWorkspacePath] = useState<string>("");
  const [showWorkspaceInput, setShowWorkspaceInput] = useState(false);
  const [customBase, setCustomBase] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isRelative) {
      invoke<string>('get_workspace_path')
        .then(setWorkspacePath)
        .catch(() => setWorkspacePath(""));
    }
  }, [isRelative]);

  const handleOpen = async (basePath?: string) => {
    setOpening(true);
    try {
      let fullPath = path;

      if (isRelative) {
        const base = basePath || workspacePath;
        if (!base) {
          alert('请先选择基准目录');
          setOpening(false);
          return;
        }
        fullPath = base.endsWith('/') ? base + path : `${base}/${path}`;
      }

      await invoke('open_file', { path: fullPath });
      onClose();
    } catch (error) {
      console.error('Failed to open file:', error);
      alert(`无法打开文件: ${error}`);
    } finally {
      setOpening(false);
    }
  };

  const handleCustomBase = () => {
    if (customBase) {
      handleOpen(customBase);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(path);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // 折叠长路径显示
  const getDisplayPath = () => {
    if (expanded || path.length <= 50) return path;
    const parts = path.split('/');
    if (parts.length <= 3) return path;
    return `${parts[0]}/.../${parts[parts.length - 1]}`;
  };

  return (
    <div
      className="fixed z-50 bg-background border border-border rounded-lg shadow-lg overflow-hidden"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        maxWidth: '500px',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* 路径显示区域 */}
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 border-b border-border">
        <span className="text-xs font-mono text-muted-foreground flex-1 truncate" title={path}>
          {getDisplayPath()}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {path.length > 50 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1 hover:bg-muted rounded"
              title={expanded ? "折叠" : "展开"}
            >
              <ChevronDown className={`size-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </button>
          )}
          <button
            onClick={handleCopy}
            className="p-1 hover:bg-muted rounded"
            title="复制路径"
          >
            {copied ? <Check className="size-3 text-green-500" /> : <Copy className="size-3" />}
          </button>
        </div>
      </div>

      {/* 操作按钮区域 */}
      <div className="p-2">
        {isRelative ? (
          <div className="space-y-1.5">
            {workspacePath && (
              <button
                onClick={() => handleOpen(workspacePath)}
                disabled={opening}
                className="flex items-center gap-2 w-full px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50"
              >
                <Home className="size-3.5" />
                <span className="flex-1 text-left truncate">工作空间</span>
              </button>
            )}
            {!showWorkspaceInput ? (
              <button
                onClick={() => setShowWorkspaceInput(true)}
                className="w-full px-3 py-1.5 text-sm border border-border rounded hover:bg-muted"
              >
                自定义基准
              </button>
            ) : (
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={customBase}
                  onChange={(e) => setCustomBase(e.target.value)}
                  placeholder="/path/to/base"
                  className="flex-1 px-2 py-1 text-xs border border-border rounded bg-background"
                  autoFocus
                />
                <button
                  onClick={handleCustomBase}
                  disabled={!customBase || opening}
                  className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50"
                >
                  打开
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => handleOpen()}
            disabled={opening}
            className="flex items-center gap-2 w-full px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50"
          >
            <FolderOpen className="size-3.5" />
            {opening ? '打开中...' : '打开文件'}
          </button>
        )}
      </div>
    </div>
  );
}

interface FilePathDetectorProps {
  children: string;
  className?: string;
}

export function FilePathDetector({ children, className }: FilePathDetectorProps) {
  const [hoveredMatch, setHoveredMatch] = useState<{ path: string; isRelative: boolean } | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [showTimer, setShowTimer] = useState<number | null>(null);
  const [hideTimer, setHideTimer] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const paths = detectFilePaths(children);

  useEffect(() => {
    const handleClickOutside = () => {
      if (showTimer) {
        clearTimeout(showTimer);
        setShowTimer(null);
      }
      if (hideTimer) {
        clearTimeout(hideTimer);
        setHideTimer(null);
      }
      setHoveredMatch(null);
    };
    document.addEventListener('click', handleClickOutside);
    return () => {
      if (showTimer) clearTimeout(showTimer);
      if (hideTimer) clearTimeout(hideTimer);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showTimer, hideTimer]);

  if (paths.length === 0) {
    return <span className={className}>{children}</span>;
  }

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  paths.forEach((match, idx) => {
    // Add text before this match
    if (match.start > lastIndex) {
      parts.push(children.slice(lastIndex, match.start));
    }

    // Add the file path as a hoverable element
    parts.push(
      <span
        key={idx}
        className="Claude Code-pointer"
        onMouseEnter={(e) => {
          // 清除之前的隐藏定时器
          if (hideTimer) {
            clearTimeout(hideTimer);
            setHideTimer(null);
          }

          const rect = e.currentTarget.getBoundingClientRect();
          const position = { x: rect.left, y: rect.bottom + 4 };
          const matchData = { path: match.path, isRelative: match.isRelative };

          // 3 秒后显示 tooltip
          const timer = setTimeout(() => {
            setTooltipPosition(position);
            setHoveredMatch(matchData);
          }, 3000);

          setShowTimer(timer);
        }}
        onMouseLeave={(e) => {
          // 清除显示定时器
          if (showTimer) {
            clearTimeout(showTimer);
            setShowTimer(null);
          }

          // 检查是否移动到 tooltip 上
          const relatedTarget = e.relatedTarget as HTMLElement;
          if (!relatedTarget?.closest('.fixed')) {
            // 3 秒后隐藏 tooltip
            const timer = setTimeout(() => {
              setHoveredMatch(null);
            }, 3000);

            setHideTimer(timer);
          }
        }}
      >
        {children.slice(match.start, match.end)}
      </span>
    );

    lastIndex = match.end;
  });

  // Add remaining text
  if (lastIndex < children.length) {
    parts.push(children.slice(lastIndex));
  }

  return (
    <span ref={containerRef} className={className}>
      {parts}
      {hoveredMatch && (
        <FilePathTooltip
          path={hoveredMatch.path}
          isRelative={hoveredMatch.isRelative}
          position={tooltipPosition}
          onClose={() => setHoveredMatch(null)}
        />
      )}
    </span>
  );
}
