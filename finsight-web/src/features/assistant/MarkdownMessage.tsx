import React, { useState } from 'react';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Check, Copy } from 'lucide-react';

interface Props {
  content: string;
}

const CodeBlock: React.FC<{ children: string; language?: string }> = ({ children, language }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(children);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <div className="my-3 rounded-2xl overflow-hidden border border-slate-200 bg-slate-900">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800/80 text-xs">
        <span className="font-mono text-slate-300 uppercase tracking-wide">{language || 'code'}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre className="px-4 py-3 overflow-x-auto text-[13px] leading-relaxed text-slate-100">
        <code>{children}</code>
      </pre>
    </div>
  );
};

const components: Components = {
  p: ({ children }) => <p className="text-sm text-slate-800 leading-relaxed my-2 first:mt-0 last:mb-0">{children}</p>,

  h1: ({ children }) => <h1 className="text-xl font-bold text-slate-900 mt-4 mb-2">{children}</h1>,
  h2: ({ children }) => <h2 className="text-lg font-bold text-slate-900 mt-4 mb-2">{children}</h2>,
  h3: ({ children }) => <h3 className="text-base font-semibold text-slate-900 mt-3 mb-1.5">{children}</h3>,
  h4: ({ children }) => <h4 className="text-sm font-semibold text-slate-900 mt-3 mb-1">{children}</h4>,

  strong: ({ children }) => <strong className="font-semibold text-slate-900">{children}</strong>,
  em: ({ children }) => <em className="italic text-slate-800">{children}</em>,
  del: ({ children }) => <del className="text-slate-400">{children}</del>,

  ul: ({ children }) => <ul className="my-2 space-y-1 list-disc pl-5 marker:text-slate-400 text-sm text-slate-800">{children}</ul>,
  ol: ({ children }) => <ol className="my-2 space-y-1 list-decimal pl-5 marker:text-slate-400 text-sm text-slate-800">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,

  blockquote: ({ children }) => (
    <blockquote className="my-3 pl-4 border-l-2 border-slate-300 text-slate-600 italic text-sm">
      {children}
    </blockquote>
  ),

  hr: () => <hr className="my-4 border-slate-100" />,

  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noreferrer" className="text-blue-600 underline-offset-2 hover:underline">
      {children}
    </a>
  ),

  table: ({ children }) => (
    <div className="my-3 overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full text-sm border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-slate-50">{children}</thead>,
  th: ({ children }) => <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-200">{children}</th>,
  td: ({ children }) => <td className="px-3 py-2 text-slate-800 border-b border-slate-100">{children}</td>,

  code: ({ className, children, ...props }) => {
    const match = /language-(\w+)/.exec(className || '');
    const text = String(children).replace(/\n$/, '');
    const isInline = !(props as any).node?.position?.start?.line || !className;

    if (isInline && !match) {
      return (
        <code className="px-1.5 py-0.5 rounded-md bg-slate-100 text-[0.85em] font-mono text-rose-600 border border-slate-200">
          {children}
        </code>
      );
    }
    return <CodeBlock language={match?.[1]}>{text}</CodeBlock>;
  },

  pre: ({ children }) => <>{children}</>,
};

export const MarkdownMessage: React.FC<Props> = ({ content }) => {
  return (
    <div className="markdown-message">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
};
