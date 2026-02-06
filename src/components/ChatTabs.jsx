import React from 'react';
import { FaPlus, FaXmark } from "react-icons/fa6";

const ChatTabs = ({ tabs, activeTabId, onTabClick, onTabClose, onNewTab }) => {
    return (
        <div className="flex items-end w-full  bg-[var(--bg-secondary)] border-b border-[var(--border-color)] overflow-x-auto [&::-webkit-scrollbar]:hidden scrollbar-none">
            <div className="flex items-end gap-1 w-full px-2">
                {tabs.map((tab) => {
                    const isActive = tab.id === activeTabId;
                    return (
                        <div
                            key={tab.id}
                            className={`
                                group relative flex items-center gap-2 px-4 py-2 flex-1 min-w-[30px] md:min-w-[120px] max-w-[200px] h-9 
                                rounded-t-lg cursor-pointer transition-all duration-200 select-none
                                ${isActive
                                    ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] font-medium shadow-[0_-1px_2px_rgba(0,0,0,0.05)] z-10'
                                    : 'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'}
                            `}
                            onClick={() => onTabClick(tab.id)}
                            title={tab.title || "New Chat"}
                        >
                            <span className="truncate text-sm flex-1 max-w-[140px]">{tab.title || "New Chat"}</span>

                            {/* Close Button - Visible on Hover or Active (if not only tab) */}
                            <button
                                className={`
                                    p-0.5 rounded-full hover:bg-[var(--bg-hover)] transition-opacity duration-200
                                    ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
                                `}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onTabClose(tab.id);
                                }}
                            >
                                <FaXmark className="text-xs" />
                            </button>

                            {/* Active Tab Indicator/Border Hider */}
                            {isActive && (
                                <div className="absolute -bottom-[1px] left-0 right-0 h-[2px] bg-[var(--bg-primary)] z-20"></div>
                            )}

                            {/* Separator for inactive tabs */}
                            {!isActive && (
                                <div className="absolute right-0 top-2 bottom-2 w-[1px] bg-[var(--border-color)] opacity-50"></div>
                            )}
                        </div>
                    );
                })}

                {/* New Tab Button */}
                <button
                    className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors ml-1 mb-0.5"
                    onClick={() => {
                        try {
                            onNewTab();
                        } catch (err) {
                            console.error("Error creating new tab:", err);
                        }
                    }}
                    title="New Tab"
                >
                    <FaPlus className="text-sm" />
                </button>
            </div>
        </div>
    );
};

export default ChatTabs;
