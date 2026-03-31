import { memo, useState, type ReactNode } from "react";
import { Streamdown, defaultRehypePlugins } from "streamdown";
import { Copy, Check } from "lucide-react";
import { FilePathDetector } from "./FilePathDetector";

function extractLanguage(className?: string): string {
  if (!className) return "text";
  const match = className.match(/language-(\w+)/);
  return match ? match[1] : "text";
}

function CodeBlock({ content, language }: { content: string; language: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="group relative rounded-lg border border-border overflow-hidden">
      <div className="flex items-center justify-between bg-muted/50 px-3 py-1.5">
        <span className="text-xs text-muted-foreground">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto px-3 py-3 text-sm">
        <code className="block min-w-full">
          <FilePathDetector>{content}</FilePathDetector>
        </code>
      </pre>
    </div>
  );
}

const COMPONENTS: Record<string, React.ComponentType<any>> = {
  code({ className, children }) {
    const content = String(children ?? "");
    const isInline = !className?.includes("language-") && !content.includes("\n");
    if (isInline) {
      return (
        <code className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono">
          <FilePathDetector>{content}</FilePathDetector>
        </code>
      );
    }
    return <CodeBlock content={content} language={extractLanguage(className)} />;
  },
  pre({ children }) {
    return <>{children}</>;
  },
  h1({ children }) {
    return <h1 className="text-xl font-medium">{children}</h1>;
  },
  h2({ children }) {
    return <h2 className="text-lg font-medium">{children}</h2>;
  },
  h3({ children }) {
    return <h3 className="font-medium">{children}</h3>;
  },
  p({ children }) {
    // Process children to detect file paths in text nodes
    const processChildren = (child: ReactNode): ReactNode => {
      if (typeof child === 'string') {
        return <FilePathDetector>{child}</FilePathDetector>;
      }
      return child;
    };

    const processedChildren = Array.isArray(children)
      ? children.map(processChildren)
      : processChildren(children);

    return (
      <p className="leading-relaxed whitespace-pre-wrap">
        {processedChildren}
      </p>
    );
  },
  ul({ children }) {
    return <ul className="ml-4 list-disc marker:text-muted-foreground">{children}</ul>;
  },
  ol({ children }) {
    return <ol className="ml-4 list-decimal marker:text-muted-foreground">{children}</ol>;
  },
  li({ children }) {
    // Process children to detect file paths in text nodes
    const processChildren = (child: ReactNode): ReactNode => {
      if (typeof child === 'string') {
        return <FilePathDetector>{child}</FilePathDetector>;
      }
      return child;
    };

    const processedChildren = Array.isArray(children)
      ? children.map(processChildren)
      : processChildren(children);

    return <li className="leading-relaxed">{processedChildren}</li>;
  },
  a({ children, href }) {
    return (
      <a
        href={href}
        className="underline decoration-muted-foreground/40 underline-offset-4 hover:decoration-foreground transition-colors"
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    );
  },
  blockquote({ children }) {
    return (
      <blockquote className="border-l-2 border-border pl-4 text-muted-foreground italic">
        {children}
      </blockquote>
    );
  },
  strong({ children }) {
    return <strong className="font-medium">{children}</strong>;
  },
  hr() {
    return <hr className="my-3 border-border" />;
  },
  table({ children }) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">{children}</table>
      </div>
    );
  },
  thead({ children }) {
    return <thead className="border-b border-border bg-muted/50">{children}</thead>;
  },
  tbody({ children }) {
    return <tbody className="divide-y divide-border">{children}</tbody>;
  },
  th({ children }) {
    return <th className="px-3 py-2 text-left font-medium">{children}</th>;
  },
  td({ children }) {
    return <td className="px-3 py-2">{children}</td>;
  },
};

export type MarkdownProps = {
  children: string;
  className?: string;
};

function MarkdownComponent({ children, className }: MarkdownProps) {
  return (
    <Streamdown
      className={`flex flex-col gap-2 ${className ?? ""}`}
      components={COMPONENTS}
      rehypePlugins={Object.values(defaultRehypePlugins)}
    >
      {children}
    </Streamdown>
  );
}

export const Markdown = memo(MarkdownComponent);
