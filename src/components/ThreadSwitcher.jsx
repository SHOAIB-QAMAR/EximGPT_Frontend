import React, { useEffect } from 'react';
import { FaXmark, FaComments, FaSpinner, FaPlus, FaShip } from "react-icons/fa6";

/**
 * ThreadSwitcher - A Chrome-style tab switcher for switching between active chat threads.
 * Displays chats in a grid of cards similar to Chrome's mobile tab view.
 * 
 * @param {boolean} isOpen - Whether the switcher is open
 * @param {function} onClose - Callback to close the switcher
 * @param {Array} sessions - Array of active chat sessions
 * @param {string} activeSessionId - ID of the currently active session
 * @param {function} onSelectSession - Callback when a session is selected
 * @param {function} onCloseSession - Callback to close a session
 * @param {function} onNewChat - Callback to create a new chat
 */

const ThreadSwitcher = ({
    isOpen,
    onClose,
    sessions = [],
    activeSessionId,
    onSelectSession,
    onCloseSession,
    onNewChat
}) => {

    // Close on escape
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            document.addEventListener('keydown', handleEsc);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    // Get message preview for card
    const getMessagePreview = (session) => {
        if (!session.messages || session.messages.length === 0) {
            return null;
        }
        // Get last few messages for preview
        const lastMessages = session.messages.slice(-3);
        return lastMessages;
    };

    return (
        <div
            className="fixed inset-0 z-[100] bg-[var(--bg-primary)] animate-in fade-in duration-200 flex flex-col"
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onClose}
                        className="p-2 -ml-2 rounded-full hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                    >
                        <FaXmark className="text-lg" />
                    </button>
                    <h3 className="text-base font-semibold text-[var(--text-primary)]">
                        {sessions.length} {sessions.length === 1 ? 'Chat' : 'Chats'}
                    </h3>
                </div>

                {/* New Chat Button in Header */}
                <button
                    onClick={() => {
                        onNewChat();
                        onClose();
                    }}
                    className="flex items-center gap-2 px-3 py-2 rounded-full bg-[var(--brand-primary)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
                >
                    <FaPlus className="text-xs" />
                    <span>New</span>
                </button>
            </div>

            {/* Cards Grid */}
            <div className="flex-1 overflow-y-auto p-3 bg-[var(--bg-primary)]">
                {sessions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-[var(--text-secondary)]">
                        <FaComments className="text-5xl mb-4 opacity-20" />
                        <p className="text-sm">No active chats</p>
                        <button
                            onClick={() => {
                                onNewChat();
                                onClose();
                            }}
                            className="mt-4 px-4 py-2 rounded-lg bg-[var(--brand-primary)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
                        >
                            Start a new chat
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3">
                        {sessions.map((session) => {
                            const isActive = session.id === activeSessionId;
                            const messagePreview = getMessagePreview(session);

                            return (
                                <div
                                    key={session.id}
                                    className={`
                                        relative flex flex-col rounded-xl overflow-hidden cursor-pointer
                                        transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]
                                        shadow-lg hover:shadow-xl
                                        ${isActive
                                            ? 'ring-2 ring-[var(--brand-primary)] ring-offset-2 ring-offset-[var(--bg-primary)]'
                                            : 'ring-1 ring-[var(--border-color)]'
                                        }
                                    `}
                                    onClick={() => {
                                        onSelectSession(session.id);
                                        onClose();
                                    }}
                                >
                                    {/* Card Header - Title Bar */}
                                    <div className={`
                                        flex items-center gap-2 px-2.5 py-2 
                                        ${isActive
                                            ? 'bg-[var(--brand-primary)]'
                                            : 'bg-[var(--bg-tertiary)]'
                                        }
                                    `}>
                                        {/* Icon */}
                                        <div className={`
                                            w-5 h-5 rounded flex items-center justify-center text-[10px] shrink-0
                                            ${isActive
                                                ? 'bg-white/20 text-white'
                                                : 'bg-[var(--bg-secondary)] text-[var(--brand-primary)]'
                                            }
                                        `}>
                                            <FaShip />
                                        </div>

                                        {/* Title */}
                                        <span className={`
                                            text-xs font-medium truncate flex-1
                                            ${isActive ? 'text-white' : 'text-[var(--text-primary)]'}
                                        `}>
                                            {session.title || "New Chat"}
                                        </span>

                                        {/* Close Button */}
                                        <button
                                            className={`
                                                p-1 rounded-full transition-colors shrink-0
                                                ${isActive
                                                    ? 'hover:bg-white/20 text-white/80 hover:text-white'
                                                    : 'hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-red-500'
                                                }
                                            `}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onCloseSession(session.id);
                                            }}
                                        >
                                            <FaXmark className="text-[10px]" />
                                        </button>
                                    </div>

                                    {/* Card Content - Preview Area */}
                                    <div className="bg-[var(--bg-card)] p-2.5 h-28 overflow-hidden">
                                        {messagePreview ? (
                                            <div className="space-y-1.5">
                                                {messagePreview.map((msg, idx) => (
                                                    <div
                                                        key={idx}
                                                        className={`
                                                            text-[9px] leading-relaxed px-2 py-1 rounded-lg truncate
                                                            ${msg.role === 'user'
                                                                ? 'bg-[var(--brand-primary)]/10 text-[var(--text-primary)] ml-4'
                                                                : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] mr-4'
                                                            }
                                                        `}
                                                    >
                                                        {msg.content?.substring(0, 50) || "..."}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="h-full flex flex-col items-center justify-center text-[var(--text-tertiary)]">
                                                <FaComments className="text-2xl mb-1 opacity-30" />
                                                <span className="text-[9px]">No messages</span>
                                            </div>
                                        )}

                                        {/* Loading Indicator */}
                                        {session.isThinking && (
                                            <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]">
                                                <FaSpinner className="text-[8px] animate-spin" />
                                                <span className="text-[8px] font-medium">Thinking...</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Active Indicator */}
                                    {isActive && (
                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--brand-primary)]"></div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ThreadSwitcher;