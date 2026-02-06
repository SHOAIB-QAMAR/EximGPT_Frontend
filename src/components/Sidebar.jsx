import { FaMagnifyingGlass, FaEllipsisVertical, FaChevronDown, FaShip, FaMapLocationDot, FaFileContract, FaBars, FaChevronLeft, FaSun, FaMoon } from "react-icons/fa6";
import { FaQuestionCircle } from "react-icons/fa";
import { useTheme } from '../context/ThemeContext';
import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import Tooltip from './Tooltip';

// ChatItem component that shows tooltip only when title is truncated (has ellipsis)
const ChatItem = ({ title, firstMessage }) => {
    const textRef = useRef(null);
    const [isTruncated, setIsTruncated] = useState(false);

    useEffect(() => {
        // Check truncation on mount and when title changes
        const checkTruncation = () => {
            if (textRef.current) {
                setIsTruncated(textRef.current.scrollWidth > textRef.current.clientWidth);
            }
        };
        checkTruncation();
        // Also check on window resize
        window.addEventListener('resize', checkTruncation);
        return () => window.removeEventListener('resize', checkTruncation);
    }, [title]);

    return (
        <Tooltip
            content={firstMessage || title}
            position="right"
            disabled={!isTruncated}
            className="flex-1 min-w-0 overflow-hidden block"
        >
            <div
                ref={textRef}
                className="text-sm ml-2 font-medium text-[var(--text-primary)] truncate max-w-[180px]"
            >
                {title}
            </div>
        </Tooltip>
    );
};

const Sidebar = ({ collapsed, toggleSidebar, isOpenMobile, closeMobileSidebar, onSearchClick, onNewChat, threads = [], currThreadId, onLoadChat, onDeleteChat, onFAQClick, showFAQ }) => {
    const { theme, toggleTheme } = useTheme();
    const [activeMenu, setActiveMenu] = useState(null); // Track which chat menu is open
    const [isDeleting, setIsDeleting] = useState(false);

    // Sidebar is "expanded" when: not collapsed on desktop, OR open on mobile
    const isExpanded = !collapsed || isOpenMobile;

    const handleDeleteChat = async (threadId) => {
        if (!onDeleteChat) return;
        setIsDeleting(true);
        await onDeleteChat(threadId);
        setIsDeleting(false);
        setActiveMenu(null);
    };

    const [showHistory, setShowHistory] = useState(false);

    // Category Expansion State
    const [expandedCategories, setExpandedCategories] = useState({
        freight: false,
        vessel: false,
        docs: false
    });

    const toggleCategory = (cat) => {
        setExpandedCategories(prev => ({
            ...prev,
            [cat]: !prev[cat]
        }));
    };

    // Categorize threads
    // Categorize threads - Memoized for performance
    const categories = React.useMemo(() => {
        const cats = {
            freight: [],
            vessel: [],
            docs: [],
            history: []
        };

        threads.forEach(thread => {
            const title = (thread.title || "").toLowerCase();
            if (title.match(/rate|freight|shipping|container|lcl|fcl|quote/)) {
                cats.freight.push(thread);
            } else if (title.match(/vessel|track|route|map|locat|position|schedule/)) {
                cats.vessel.push(thread);
            } else if (title.match(/bill|lading|invoice|doc|contract|certificate/)) {
                cats.docs.push(thread);
            } else {
                cats.history.push(thread);
            }
        });
        return cats;
    }, [threads]);

    // Group history threads by date - Memoized
    const groupedHistory = React.useMemo(() => {
        const historyThreads = categories.history;
        const groups = {
            "Today": [],
            "Yesterday": [],
            "Previous 7 Days": [],
            "Previous 30 Days": [],
            "Older": []
        };

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const last7Days = new Date(today);
        last7Days.setDate(last7Days.getDate() - 7);
        const last30Days = new Date(today);
        last30Days.setDate(last30Days.getDate() - 30);

        historyThreads.forEach(thread => {
            const threadDate = new Date(thread.updatedAt || thread.createdAt);
            const dateCheck = new Date(threadDate.getFullYear(), threadDate.getMonth(), threadDate.getDate());

            if (dateCheck.getTime() === today.getTime()) {
                groups["Today"].push(thread);
            } else if (dateCheck.getTime() === yesterday.getTime()) {
                groups["Yesterday"].push(thread);
            } else if (dateCheck >= last7Days) {
                groups["Previous 7 Days"].push(thread);
            } else if (dateCheck >= last30Days) {
                groups["Previous 30 Days"].push(thread);
            } else {
                groups["Older"].push(thread);
            }
        });

        return Object.entries(groups).filter(([_, list]) => list.length > 0);
    }, [categories.history]);

    // Helper to render a thread item
    const renderThreadItem = (thread) => (
        <div
            key={thread.threadId}
            className={`chat-item flex items-center gap-1 p-2  rounded-lg cursor-pointer hover:bg-[var(--bg-tertiary)] transition-all group relative ${currThreadId === thread.threadId ? 'bg-[var(--bg-tertiary)] border-l-2 border-[var(--brand-primary)]' : 'border-l-2 border-transparent'}`}
            onClick={() => onLoadChat(thread.threadId)}
        >
            <ChatItem title={thread.title || "New Chat"} firstMessage={thread.messages?.[0]?.content} />
            <button
                className={`chat-menu p-1.5 rounded-full hover:bg-[var(--bg-secondary)] transition-all ${activeMenu === thread.threadId ? 'opacity-100 bg-[var(--bg-secondary)]' : 'opacity-0 group-hover:opacity-100'}`}
                onClick={(e) => {
                    e.stopPropagation();
                    setActiveMenu(activeMenu === thread.threadId ? null : thread.threadId);
                }}
            >
                <FaEllipsisVertical className="text-[var(--text-secondary)] text-sm" />
            </button>

            {activeMenu === thread.threadId && ReactDOM.createPortal(
                <>
                    <div
                        className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-md"
                        onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenu(null);
                        }}
                    ></div>
                    <div
                        className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
                        onClick={(e) => e.stopPropagation()} // Stop propagation from the flex container (optional but safe)
                    >
                        <div
                            className="bg-[var(--bg-card)] rounded-2xl shadow-xl border border-[var(--border-color)] w-[380px]"
                            onClick={(e) => e.stopPropagation()} // Vital: Stop clicks on the modal itself from bubbling
                        >
                            <div className="px-6 py-4">
                                <h3 className="text-xl py-2 font-semibold text-[var(--text-primary)]">Delete Chat?</h3>
                                <p className="text-sm text-[var(--text-secondary)] mt-2">
                                    Permanently delete <span className="font-medium text-[var(--text-primary)]">{thread.title}.</span>
                                </p>
                            </div>
                            <div className="flex justify-end gap-4 p-4 pt-2">
                                <button
                                    className="px-5 py-2 rounded-lg text-sm font-medium hover:bg-[var(--bg-tertiary)] transition-colors"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveMenu(null);
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="px-5 py-2 rounded-lg bg-[var(--brand-primary)] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteChat(thread.threadId);
                                    }}
                                >
                                    {isDeleting ? "Deleting..." : "Delete"}
                                </button>
                            </div>
                        </div>
                    </div>
                </>,
                document.body
            )}
        </div>
    );

    return (
        <>
            <div
                className={`sidebar h-screen flex flex-col justify-between overflow-hidden border-r border-[var(--border-color)] bg-[var(--bg-sidebar)] text-[var(--text-primary)] transition-all duration-300 ease-in-out fixed lg:relative z-50
          ${isExpanded ? 'w-68' : 'w-16'} 
          ${isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
                id="sidebar"
            >
                {/* Top Icons */}
                <div className="flex flex-col gap-1.5 p-1.5 pt-2 md:pt-1.5">
                    <div className={`sidebar-header flex items-center text-xl pt-1 md:pt-2.5 gap-2.5 ${isExpanded ? 'pl-3 md:pl-4 pr-2 mb-3 md:mb-4' : 'justify-center pb-1.5'}`}>
                        {/* Expanded Mode: Brand Icon on Left, Title, and Close Button on Right */}
                        {isExpanded ? (
                            <>
                                <div className="flex items-center gap-3 flex-1 overflow-hidden">
                                    <div className="bg-[var(--brand-primary)] min-w-[32px] w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-sm">
                                        <FaShip className="text-sm" />
                                    </div>
                                </div>

                                <button
                                    className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                                    onClick={isOpenMobile ? closeMobileSidebar : toggleSidebar}
                                >
                                    <FaChevronLeft className="w-5 h-5" />
                                </button>
                            </>
                        ) : (
                            /* Collapsed Mode: Toggle Button (Ship -> Hamburger) */
                            <button
                                className="sidebar-toggle-btn group relative p-0 rounded-lg bg-[var(--brand-primary)] text-white shadow-md hover:shadow-lg transition-all duration-300 transform active:scale-95 flex items-center justify-center w-8 h-8 mx-auto mt-1"
                                onClick={toggleSidebar}
                            >
                                {/* Default Icon (Ship) */}
                                <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 opacity-100 group-hover:opacity-0`}>
                                    <FaShip className="text-sm" />
                                </div>

                                {/* Hamburger Icon on Hover */}
                                <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 opacity-0 group-hover:opacity-100`}>
                                    <FaBars className="text-sm" />
                                </div>
                            </button>
                        )}
                    </div>

                    {/* Actions Section */}
                    <div className="flex flex-col gap-1.5 p-1.5 mb-2">

                        <Tooltip
                            content="Search Chats"
                            disabled={isExpanded}
                            position="right"
                        >
                            <button
                                className={`flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] transition-colors w-full ${isExpanded ? '' : 'justify-center'}`}
                                onClick={onSearchClick}
                            >
                                <FaMagnifyingGlass className="text-lg" />
                                <span className={`text-sm font-medium whitespace-nowrap transition-opacity duration-200 ${isExpanded ? 'block opacity-100' : 'hidden opacity-0'}`}>Search Chats</span>
                            </button>
                        </Tooltip>
                    </div>
                </div>

                {/* Categorized Menus - Independent Section */}
                <div className="shrink-0 overflow-y-auto max-h-[40%] px-2 custom-scrollbar space-y-4">

                    {/* Freight Category */}
                    {categories.freight.length > 0 && (
                        <div className="category-section">
                            <div
                                className={`flex items-center justify-between text-[var(--brand-primary)] px-2 mb-1.5 cursor-pointer hover:bg-[var(--bg-tertiary)] rounded-md py-1 transition-colors ${isExpanded ? 'opacity-100' : 'hidden'}`}
                                onClick={() => toggleCategory('freight')}
                            >
                                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                                    <FaShip /> FREIGHT & SHIPPING
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] px-1.5 rounded text-[10px]">{categories.freight.length}</span>
                                    <FaChevronDown className={`text-[10px] transition-transform duration-200 ${expandedCategories.freight ? 'rotate-180' : ''}`} />
                                </div>
                            </div>
                            <div className={`flex flex-col transition-all duration-300 overflow-hidden ${expandedCategories.freight ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                {categories.freight.map(thread => renderThreadItem(thread))}
                            </div>
                        </div>
                    )}

                    {/* Tracking Category */}
                    {categories.vessel.length > 0 && (
                        <div className="category-section">
                            <div
                                className={`flex items-center justify-between text-[var(--brand-primary)] px-2 mb-1.5 cursor-pointer hover:bg-[var(--bg-tertiary)] rounded-md py-1 transition-colors ${isExpanded ? 'opacity-100' : 'hidden'}`}
                                onClick={() => toggleCategory('vessel')}
                            >
                                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                                    <FaMapLocationDot /> VESSEL & TRACKING
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] px-1.5 rounded text-[10px]">{categories.vessel.length}</span>
                                    <FaChevronDown className={`text-[10px] transition-transform duration-200 ${expandedCategories.vessel ? 'rotate-180' : ''}`} />
                                </div>
                            </div>
                            <div className={`flex flex-col gap-0.5 transition-all duration-300 overflow-hidden ${expandedCategories.vessel ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                {categories.vessel.map(thread => renderThreadItem(thread))}
                            </div>
                        </div>
                    )}

                    {/* Docs Category */}
                    {categories.docs.length > 0 && (
                        <div className="category-section">
                            <div
                                className={`flex items-center justify-between text-[var(--brand-primary)] px-2 mb-1.5 cursor-pointer hover:bg-[var(--bg-tertiary)] rounded-md py-1 transition-colors ${isExpanded ? 'opacity-100' : 'hidden'}`}
                                onClick={() => toggleCategory('docs')}
                            >
                                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                                    <FaFileContract /> DOCUMENTATION
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] px-1.5 rounded text-[10px]">{categories.docs.length}</span>
                                    <FaChevronDown className={`text-[10px] transition-transform duration-200 ${expandedCategories.docs ? 'rotate-180' : ''}`} />
                                </div>
                            </div>
                            <div className={`flex flex-col gap-0.5 transition-all duration-300 overflow-hidden ${expandedCategories.docs ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                {categories.docs.map(thread => renderThreadItem(thread))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Divider */}
                {isExpanded && <div className="border-t border-[var(--border-color)] my-2 mx-2 shrink-0"></div>}

                {/* Chat History Section - Independent Scroll */}
                <div className="flex-1 overflow-y-auto min-h-0 px-2 custom-scrollbar mb-2 relative">
                    {/* Chat History Header - Toggleable */}
                    <div className={`chat-history-section ${!isExpanded ? 'hidden' : ''} sticky top-0 bg-[var(--bg-sidebar)] z-10 pb-2 pt-1`}>
                        <div
                            className="px-2 mb-1.5 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex justify-between items-center cursor-pointer hover:text-[var(--text-primary)] transition-colors"
                            onClick={() => setShowHistory(!showHistory)}
                        >
                            <span className="flex items-center gap-2">History</span>
                            <span className="text-[10px] bg-[var(--bg-tertiary)] border border-[var(--border-color)] px-1.5 rounded hover:bg-[var(--bg-card)]">
                                {showHistory ? 'Hide' : 'Show'}
                            </span>
                        </div>
                    </div>

                    {/* Render History only if toggled ON and Expanded */}
                    {isExpanded && showHistory && (
                        <div className="chat-list mb-4 animate-in slide-in-from-top-2 duration-200">
                            {groupedHistory.length === 0 ? (
                                <div className="text-center text-sm text-[var(--text-secondary)] mt-4">
                                    No history
                                </div>
                            ) : (
                                groupedHistory.map(([groupName, groupThreads]) => (
                                    <div key={groupName} className="mb-4">
                                        <div className="chat-history-header px-2 mb-1">
                                            <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">{groupName}</span>
                                        </div>
                                        {groupThreads.map(thread => renderThreadItem(thread))}
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="sidebar-footer flex flex-col p-1.5 ">
                    <Tooltip
                        content={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                        disabled={isExpanded}
                        position="right"
                    >
                        <button
                            className={`icon-item flex items-center gap-3 p-3 rounded-md hover:bg-[var(--bg-tertiary)] transition-colors w-full ${isExpanded ? '' : 'justify-center'}`}
                            onClick={toggleTheme}
                        >
                            {theme === 'dark' ? <FaSun className="text-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:scale-110 transition-all" /> : <FaMoon className="text-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:scale-110 transition-all" />}
                            <span className={`label text-[14px] font-medium whitespace-nowrap transition-opacity duration-200 text-[var(--text-secondary)] ${isExpanded ? 'block opacity-100' : 'hidden opacity-0'}`}>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                        </button>
                    </Tooltip>

                    <Tooltip
                        content="Frequently Asked Questions"
                        disabled={isExpanded}
                        position="right"
                    >
                        <button
                            className={`icon-item flex items-center gap-3 p-3 rounded-md hover:bg-[var(--bg-tertiary)] transition-colors w-full ${isExpanded ? '' : 'justify-center'} ${showFAQ ? 'bg-[var(--bg-tertiary)] text-[var(--brand-primary)]' : 'text-[var(--text-secondary)]'}`}
                            onClick={() => {
                                if (isOpenMobile) {
                                    closeMobileSidebar();
                                }
                                onFAQClick();
                            }}
                        >
                            <FaQuestionCircle className="text-lg hover:scale-105 transition-all" />
                            <span className={`label text-[14px] font-medium whitespace-nowrap transition-opacity duration-200 ${isExpanded ? 'block opacity-100' : 'hidden opacity-0'}`}>FAQ</span>
                        </button>
                    </Tooltip>
                </div>
            </div >

            {/* Mobile Overlay */}
            {isOpenMobile && (<div className="sidebar-overlay fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={closeMobileSidebar}></div>)}
        </>
    );
};

export default Sidebar;