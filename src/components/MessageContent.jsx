import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * MessageContent Component
 * Renders the content of a chat message using react-markdown.
 * Supports GFM (tables, strikethrough, autolinks, etc.) and custom styling.
 * 
 * @param {string} content - The markdown content to render.
 */
const MessageContent = ({ content, onLinkClick }) => {

    // Memoize components to prevent re-creation on every render
    const components = React.useMemo(() => ({
        // Headings
        h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mt-5 mb-3 text-[var(--text-primary)]" {...props} />,
        h2: ({ node, ...props }) => <h2 className="text-xl font-bold mt-4 mb-2 text-[var(--text-primary)]" {...props} />,
        h3: ({ node, ...props }) => <h3 className="text-lg font-bold mt-3 mb-2 text-[var(--text-primary)]" {...props} />,
        h4: ({ node, ...props }) => <h4 className="text-base font-bold mt-3 mb-1 text-[var(--text-primary)]" {...props} />,

        // Lists
        ul: ({ node, ...props }) => <ul className="list-disc pl-6 my-3 space-y-1.5 marker:text-[var(--text-secondary)]" {...props} />,
        ol: ({ node, ...props }) => <ol className="list-decimal pl-6 my-3 space-y-1.5 marker:text-[var(--text-secondary)]" {...props} />,
        li: ({ node, ...props }) => <li className="pl-1" {...props} />,

        // Links
        a: ({ node, href, ...props }) => (
            <a
                href={href}
                className="text-[var(--brand-primary)] hover:underline font-medium break-all cursor-pointer"
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                    if (onLinkClick && href) {
                        e.preventDefault();
                        onLinkClick(href);
                    }
                }}
                {...props}
            />
        ),

        // Code
        code: ({ node, inline, className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            return !inline ? (
                <div className="relative my-4 rounded-lg overflow-hidden bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
                    <div className="flex items-center justify-between px-4 py-2 bg-[var(--bg-secondary)] border-b border-[var(--border-color)] text-sm text-[var(--text-secondary)]">
                        <span>{match ? match[1] : 'code'}</span>
                    </div>
                    <div className="p-4 overflow-x-auto text-sm font-mono leading-normal">
                        <code className={className} {...props}>
                            {children}
                        </code>
                    </div>
                </div>
            ) : (
                <code className="bg-[var(--bg-tertiary)] text-[var(--text-primary)] px-1.5 py-0.5 rounded text-sm font-mono border border-[var(--border-color)]" {...props}>
                    {children}
                </code>
            );
        },

        // Blockquotes
        blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-4 border-[var(--brand-primary)] pl-4 py-2 my-3 text-[var(--text-secondary)] italic bg-[var(--bg-tertiary)]/30 rounded-r" {...props} />
        ),

        // Tables
        table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-4 rounded-lg border border-[var(--border-color)]">
                <table className="w-full text-left text-base" {...props} />
            </div>
        ),
        thead: ({ node, ...props }) => <thead className="bg-[var(--bg-secondary)] text-[var(--text-primary)] font-semibold" {...props} />,
        tbody: ({ node, ...props }) => <tbody className="divide-y divide-[var(--border-color)]" {...props} />,
        tr: ({ node, ...props }) => <tr className="hover:bg-[var(--bg-tertiary)]/50 transition-colors" {...props} />,
        th: ({ node, ...props }) => <th className="px-5 py-3 whitespace-nowrap" {...props} />,
        td: ({ node, ...props }) => <td className="px-5 py-3 align-top" {...props} />,

        // Paragraphs (add spacing)
        p: ({ node, ...props }) => <p className="mb-3 last:mb-0" {...props} />,

        // Horizontal Rule
        hr: ({ node, ...props }) => <hr className="my-6 border-[var(--border-color)]" {...props} />,
    }), [onLinkClick]);

    return (
        <div className="message-content text-[var(--text-primary)] leading-relaxed">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={components}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
};

/**
 * TypingMessage Component
 * Simulates a typing effect for new messages, ensuring the animation respects
 * the message's original timestamp to avoid restarts on re-renders (tab switching).
 * 
 * @param {string} content - The full message text.
 * @param {function} onComplete - Callback when typing finishes.
 * @param {function} onTyping - Callback during typing (e.g., for scrolling).
 * @param {number} timestamp - The timestamp when the message was received.
 */
export const TypingMessage = ({ content, onComplete, onTyping, timestamp, onLinkClick }) => {
    const [displayedContent, setDisplayedContent] = useState("");

    // Typing speed (ms per char)
    const SPEED = 15;

    useEffect(() => {
        // Calculate how much should be displayed based on elapsed time since message arrived
        const now = Date.now();
        const elapsed = timestamp ? (now - timestamp) : 0;
        let index = Math.floor(elapsed / SPEED);

        // If enough time passed to show full message, show immediately and complete
        if (index >= content.length) {
            setDisplayedContent(content);
            if (onComplete) onComplete();
            return;
        }

        // Otherwise start from calculated index
        setDisplayedContent(content.slice(0, index + 1));

        const timer = setInterval(() => {
            index++;
            setDisplayedContent(content.slice(0, index + 1));

            if (index >= content.length) {
                clearInterval(timer);
                if (onComplete) onComplete();
            }
            if (onTyping) onTyping();
        }, SPEED);

        return () => clearInterval(timer);
    }, [content, timestamp]);

    return <MessageContent content={displayedContent} onLinkClick={onLinkClick} />;
};

export default MessageContent;