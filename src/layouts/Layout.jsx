import React, { useState, useEffect, useRef } from 'react';
import { FaChevronLeft } from "react-icons/fa6";

import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import FAQ from '../components/FAQ';
import StarterGrid from '../components/StarterGrid';
import InputArea from '../components/InputArea';
import SearchPanel from '../components/SearchPanel';
import ChatTabs from '../components/ChatTabs';
import ThreadSwitcher from '../components/ThreadSwitcher';
import LogisticsLoader from '../components/LogisticsLoader';
import MessageContent, { TypingMessage } from '../components/MessageContent';
import ContextPanel from '../components/ContextPanel';

// Hooks
import { useThreads } from '../hooks/useThreads';
import { useChatSessions } from '../hooks/useChatSessions';
import { useWebSocket } from '../hooks/useWebSocket';

// Services
import ChatService from '../services/chat.service';
import API_CONFIG from '../services/api.config';

/**
 * Helper function to log errors with detailed context
 * @param {string} component - Component name
 * @param {string} method - Method where error occurred
 * @param {Error} error - Error object
 * @param {Object} context - Additional context
 */
const logError = (component, method, error, context = {}) => {
    const errorInfo = {
        file: 'Layout.jsx',
        component,
        method,
        message: error.message,
        stack: error.stack,
        context,
        timestamp: new Date().toISOString()
    };
    console.error(`[${component}.${method}] Error:`, errorInfo);
    return errorInfo;
};

const Layout = () => {

    // UI Toggle States
    const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [searchPanelOpen, setSearchPanelOpen] = useState(false);
    const [threadSwitcherOpen, setThreadSwitcherOpen] = useState(false);

    // Context Panel State
    const [contextPanelOpen, setContextPanelOpen] = useState(false);
    const [contextPanelData, setContextPanelData] = useState(null);

    // Callbacks for Sidebar
    const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);
    const toggleMobileSidebar = () => setMobileSidebarOpen(!mobileSidebarOpen);
    const closeMobileSidebar = () => setMobileSidebarOpen(false);

    const openSearchPanel = () => {
        setSearchPanelOpen(true);
        if (window.innerWidth <= 768) {
            closeMobileSidebar();
        }
    };

    const closeSearchPanel = () => setSearchPanelOpen(false);

    // --- 1. Thread Management Hook ---
    const { threads, deleteThread } = useThreads();

    // --- 2. Chat Session Management Hook ---
    const {
        activeSessions,
        setActiveSessions,
        activeSessionId,
        setActiveSessionId,
        activeSession,
        updateActiveSession,
        handleNewChat,
        handleTabClick,
        handleTabClose,
        handleLoadChat
    } = useChatSessions(threads, closeMobileSidebar);


    // --- Scroll Logic (UI Concern, kept in Layout) ---
    const chatContainerRef = useRef(null);
    const messagesEndRef = useRef(null);
    const prevSessionIdRef = useRef(activeSessionId);
    const lastScrollTimeRef = useRef(0);
    const isStickyRef = useRef(true);

    const handleScroll = () => {
        if (!chatContainerRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
        const isAtBottom = scrollHeight - scrollTop - clientHeight <= 10;
        isStickyRef.current = isAtBottom;
    };

    const scrollToBottom = (force = false) => {
        if (!chatContainerRef.current) return;
        const now = Date.now();
        if (!force && now - lastScrollTimeRef.current < 50) return;
        lastScrollTimeRef.current = now;

        if (force || isStickyRef.current) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    };

    const saveCurrentScroll = () => {
        if (chatContainerRef.current) {
            const scrollTop = chatContainerRef.current.scrollTop;
            updateActiveSession({ scrollPosition: scrollTop });
        }
    };

    // --- 3. WebSocket Management Hook ---
    const { sendMessage } = useWebSocket(activeSessions, setActiveSessions, activeSessionId, scrollToBottom);

    // Auto-scroll logic when session changes or thinking starts
    useEffect(() => {
        if (activeSessionId !== prevSessionIdRef.current) {
            // Restore scroll position
            if (chatContainerRef.current) {
                requestAnimationFrame(() => {
                    if (chatContainerRef.current) {
                        chatContainerRef.current.scrollTop = activeSession.scrollPosition || 0;
                    }
                });
            }
            prevSessionIdRef.current = activeSessionId;
        } else {
            scrollToBottom();
        }
    }, [activeSession.messages.length, activeSession.isThinking, activeSessionId]);


    // --- Handlers ---

    // Wrap tab switching to save scroll
    const onTabClick = (id) => {
        saveCurrentScroll();
        handleTabClick(id);
    };

    const onNewChatWithScroll = () => {
        saveCurrentScroll();
        handleNewChat();
    }

    const onLoadChatWithScroll = (id) => {
        saveCurrentScroll();
        handleLoadChat(id);
    }

    // Handle Typing Complete
    const handleTypingComplete = (index) => {
        const newMessages = activeSession.messages.map((msg, i) => i === index ? { ...msg, isNew: false } : msg);
        updateActiveSession({ messages: newMessages });
    };

    const handleSend = async (text) => {
        const method = 'handleSend';
        try {
            if (!text.trim() && !activeSession.selectedFile) {
                console.log(`[Layout.${method}] Empty message, skipping send`);
                return;
            }

            console.log(`[Layout.${method}] Sending message for session: ${activeSessionId}`);

            const timestamp = Date.now();
            let userMsg = { role: 'user', content: text, timestamp };

            // Handle Image Upload
            let uploadedImageUrl = null;
            if (activeSession.selectedFile) {
                console.log(`[Layout.${method}] Processing image upload: ${activeSession.selectedFile.name}`);
                // Optimistic update with blob URL
                const blobUrl = URL.createObjectURL(activeSession.selectedFile);
                userMsg.image = blobUrl;

                try {
                    // Upload to backend
                    const response = await ChatService.uploadImage(activeSession.selectedFile);
                    uploadedImageUrl = response.url;
                    console.log(`[Layout.${method}] Image uploaded successfully: ${uploadedImageUrl}`);
                } catch (uploadError) {
                    logError('Layout', method, uploadError, {
                        operation: 'image upload',
                        fileName: activeSession.selectedFile?.name,
                        fileSize: activeSession.selectedFile?.size
                    });
                    // Continue without image - don't block the message
                }
            }

            // Optimistic update
            const newTitle = activeSession.messages.length === 0 ? text.split(' ').slice(0, 4).join(' ') : activeSession.title;

            setActiveSessions(prev => prev.map(s => s.id === activeSessionId ? {
                ...s,
                messages: [...s.messages, userMsg],
                inputValue: "",
                isThinking: true,
                title: newTitle,
                selectedFile: null
            } : s));

            setTimeout(() => scrollToBottom(true), 10);

            // Prepare payload - always JSON with language
            let payload;
            try {
                payload = JSON.stringify({
                    content: text,
                    image: uploadedImageUrl || null,
                    language: selectedLang.name  // e.g., "Hindi", "English (IN)"
                });
            } catch (serializeError) {
                logError('Layout', method, serializeError, {
                    operation: 'JSON serialization',
                    text: text?.substring(0, 100),
                    language: selectedLang?.name
                });
                throw serializeError;
            }

            console.log(`[Layout.${method}] Sending WebSocket message for thread: ${activeSessionId}`);
            const sent = sendMessage(activeSessionId, payload);

            if (!sent) {
                console.error(`[Layout.${method}] Failed to send message - WebSocket not connected`);
                setActiveSessions(prev => prev.map(s => s.id === activeSessionId ? {
                    ...s,
                    isThinking: false,
                    messages: [...s.messages, { role: 'assistant', content: "Error: Connection failed. Please try again.", isNew: true, timestamp: Date.now() }]
                } : s));
            }
        } catch (error) {
            logError('Layout', method, error, {
                activeSessionId,
                textLength: text?.length,
                hasFile: !!activeSession.selectedFile
            });
            // Show error to user
            setActiveSessions(prev => prev.map(s => s.id === activeSessionId ? {
                ...s,
                isThinking: false,
                messages: [...s.messages, { role: 'assistant', content: `Error: Could not send message. ${error.message}`, isNew: true, timestamp: Date.now() }]
            } : s));
        }
    };

    const handleFeatureClick = (text) => {
        updateActiveSession({ inputValue: text });
        const inputElement = document.querySelector('.chat-input');
        if (inputElement) inputElement.focus();
    };

    const handleSearchResultClick = (text) => {
        updateActiveSession({ inputValue: text });
        closeSearchPanel();
        closeMobileSidebar();
        const inputElement = document.querySelector('.chat-input');
        if (inputElement) inputElement.focus();
    };

    const handleSearchStartChat = (text) => {
        saveCurrentScroll();
        handleNewChat();

        setTimeout(() => {
            setActiveSessions(prev => {
                const last = prev[prev.length - 1];
                return prev.map(s => s.id === last.id ? { ...s, inputValue: text } : s);
            });
            const inputElement = document.querySelector('.chat-input');
            if (inputElement) inputElement.focus();
        }, 50);

        closeSearchPanel();
        closeMobileSidebar();
    };


    const handleDeleteChatProxy = async (threadId) => {
        const method = 'handleDeleteChatProxy';
        try {
            if (!threadId) {
                console.error(`[Layout.${method}] threadId is required`);
                return;
            }

            console.log(`[Layout.${method}] Deleting thread: ${threadId}`);

            // Close tab if open
            const isOpen = activeSessions.find(s => s.id === threadId);
            if (isOpen) {
                console.log(`[Layout.${method}] Thread is open in tabs, closing it first`);
                handleTabClose(threadId);
            }

            await deleteThread(threadId);
            console.log(`[Layout.${method}] Successfully deleted thread: ${threadId}`);
        } catch (error) {
            logError('Layout', method, error, {
                threadId,
                wasOpenInTabs: !!activeSessions.find(s => s.id === threadId)
            });
        }
    };

    const handleLinkClick = (url) => {
        setContextPanelData({
            title: 'Reference',
            type: 'link',
            content: url
        });
        setContextPanelOpen(true);
    };

    // Close search panel on escape
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                closeSearchPanel();
                setLangOpen(false);
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, []);

    // Language State
    const languages = [
        { "name": "English (IN)", "flag": "https://zipaworld.s3.ap-south-1.amazonaws.com/unTracked/s3Bucketoo0.6407552849127816-1732870612423.png" },
        { "name": "Hindi", "flag": "https://zipaworld.s3.ap-south-1.amazonaws.com/unTracked/s3Bucketoo0.6407552849127816-1732870612423.png" },
        { "name": "Marathi", "flag": "https://zipaworld.s3.ap-south-1.amazonaws.com/unTracked/s3Bucketoo0.6407552849127816-1732870612423.png" },
        { "name": "Gujarati", "flag": "https://zipaworld.s3.ap-south-1.amazonaws.com/unTracked/s3Bucketoo0.6407552849127816-1732870612423.png" },
        { "name": "Malayalam", "flag": "https://zipaworld.s3.ap-south-1.amazonaws.com/unTracked/s3Bucketoo0.6407552849127816-1732870612423.png" },
        { "name": "Tamil", "flag": "https://zipaworld.s3.ap-south-1.amazonaws.com/unTracked/s3Bucketoo0.6407552849127816-1732870612423.png" },
        { "name": "Telugu", "flag": "https://zipaworld.s3.ap-south-1.amazonaws.com/unTracked/s3Bucketoo0.6407552849127816-1732870612423.png" },
        { "name": "Urdu", "flag": "https://zipaworld.s3.ap-south-1.amazonaws.com/unTracked/s3Bucketoo0.6407552849127816-1732870612423.png" },
        { "name": "Arabic", "flag": "https://zipaworld.s3.ap-south-1.amazonaws.com/unTracked/s3Bucketoo0.5683194480717881-1732878984366.jpg" },
        { "name": "Chinese", "flag": "https://zipaworld.s3.ap-south-1.amazonaws.com/unTracked/s3Bucketoo0.9722954366024594-1732876216228.png" },
        { "name": "Spanish", "flag": "https://zipaworld.s3.ap-south-1.amazonaws.com/unTracked/s3Bucketoo0.4771612376845238-1732878261030.png" },
        { "name": "French", "flag": "https://zipaworld.s3.ap-south-1.amazonaws.com/unTracked/s3Bucketoo0.7404369069177423-1732878162789.png" },
        { "name": "German", "flag": "https://zipaworld.s3.ap-south-1.amazonaws.com/unTracked/s3Bucketoo0.413777746668861-1732877934981.png" },
        { "name": "Russian", "flag": "https://zipaworld.s3.ap-south-1.amazonaws.com/unTracked/s3Bucketoo0.8216443374656774-1732877827441.png" },
        { "name": "Italian", "flag": "https://zipaworld.s3.ap-south-1.amazonaws.com/unTracked/s3Bucketoo0.9532484524761495-1732877759098.png" },
        { "name": "Indonesian", "flag": "https://zipaworld.s3.ap-south-1.amazonaws.com/unTracked/s3Bucketoo0.8911968685628548-1733113600412.png" },
        { "name": "Korean", "flag": "https://zipaworld.s3.ap-south-1.amazonaws.com/unTracked/s3Bucketoo0.9427068072727796-1733113629781.png" },
        { "name": "Hebrew", "flag": "https://zipaworld.s3.ap-south-1.amazonaws.com/unTracked/s3Bucketoo0.6388368028242402-1733113696672.png" },
        { "name": "Dutch", "flag": "https://zipaworld.s3.ap-south-1.amazonaws.com/unTracked/s3Bucketoo0.3183218883630936-1733113764665.png" },
        { "name": "Polish", "flag": "https://zipaworld.s3.ap-south-1.amazonaws.com/unTracked/s3Bucketoo0.6920747261778075-1733113855412.png" },
        { "name": "Danish", "flag": "https://zipaworld.s3.ap-south-1.amazonaws.com/unTracked/s3Bucketoo0.4967450305478682-1733113917612.png" },
        { "name": "Swedish", "flag": "https://zipaworld.s3.ap-south-1.amazonaws.com/unTracked/s3Bucketoo0.007779654785072365-1733113961419.png" },
        { "name": "Turkish", "flag": "https://zipaworld.s3.ap-south-1.amazonaws.com/unTracked/s3Bucketoo0.588575429207939-1733114051331.png" },
        { "name": "Portuguese", "flag": "https://zipaworld.s3.ap-south-1.amazonaws.com/unTracked/s3Bucketoo0.28944340281008674-1733114105330.png" },
        { "name": "Czech", "flag": "https://zipaworld.s3.ap-south-1.amazonaws.com/unTracked/s3Bucketoo0.810582609207481-1733114266011.png" },
        { "name": "Portuguese (BR)", "flag": "https://zipaworld.s3.ap-south-1.amazonaws.com/unTracked/s3Bucketoo0.07435228321668519-1733114334767.png" },
        { "name": "Finnish", "flag": "https://zipaworld.s3.ap-south-1.amazonaws.com/unTracked/s3Bucketoo0.6684993068132175-1733114406213.png" },
        { "name": "Greek", "flag": "https://zipaworld.s3.ap-south-1.amazonaws.com/unTracked/s3Bucketoo0.8462945105919195-1733114455796.png" },
        { "name": "Hungarian", "flag": "https://zipaworld.s3.ap-south-1.amazonaws.com/unTracked/s3Bucketoo0.4193755301721305-1733114718683.jpg" },
        { "name": "Thai", "flag": "https://zipaworld.s3.ap-south-1.amazonaws.com/unTracked/s3Bucketoo0.5081577918650666-1734334659004.png" },
        { "name": "Bulgarian", "flag": "https://zipaworld.s3.ap-south-1.amazonaws.com/unTracked/s3Bucketoo0.913978277476591-1733114881873.png" },
        { "name": "Malay", "flag": "https://zipaworld.s3.ap-south-1.amazonaws.com/unTracked/s3Bucketoo0.05188326701593571-1733114864720.png" },
        { "name": "Slovenian", "flag": "https://zipaworld.s3.ap-south-1.amazonaws.com/unTracked/s3Bucketoo0.03962132062258128-1733114806470.png" },
        { "name": "Ukrainian", "flag": "https://zipaworld.s3.ap-south-1.amazonaws.com/unTracked/s3Bucketoo0.37307904559820826-1733114787346.png" },
        { "name": "Croatian", "flag": "https://zipaworld.s3.ap-south-1.amazonaws.com/unTracked/s3Bucketoo0.492679905094078-1733114763762.png" },
        { "name": "Romania", "flag": "https://zipaworld.s3.ap-south-1.amazonaws.com/unTracked/s3Bucketoo0.35571138457848983-1733114746656.png" },
        { "name": "Japanese", "flag": "https://zipaworld.s3.ap-south-1.amazonaws.com/unTracked/s3Bucketoo0.40422567309313995-1733114911027.png" }
    ];

    const [langOpen, setLangOpen] = useState(false);
    const [selectedLang, setSelectedLang] = useState(languages[0]);
    const [langSearchTerm, setLangSearchTerm] = useState("");

    const filteredLanguages = languages.filter(l => l.name.toLowerCase().includes(langSearchTerm.toLowerCase()));

    const [showFAQ, setShowFAQ] = useState(false);


    return (
        <div className="app flex w-screen h-screen overflow-hidden bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-800 font-sans relative">
            {/* Top-Right Background Gradient Blob (Darker) */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[radial-gradient(circle_at_center,var(--brand-primary),transparent_70%)] opacity-[0.15] blur-3xl pointer-events-none z-0"></div>
            <Sidebar
                collapsed={sidebarCollapsed}
                toggleSidebar={toggleSidebar}
                isOpenMobile={mobileSidebarOpen}
                closeMobileSidebar={closeMobileSidebar}
                onSearchClick={openSearchPanel}
                onNewChat={onNewChatWithScroll}
                onLoadChat={onLoadChatWithScroll}
                onDeleteChat={handleDeleteChatProxy}
                threads={threads}
                currThreadId={activeSessionId}
                onFAQClick={() => setShowFAQ(!showFAQ)}
                showFAQ={showFAQ}
            />

            <div className="content flex-1 flex flex-col h-screen overflow-hidden relative transition-colors duration-800">
                <Header
                    toggleMobileSidebar={toggleMobileSidebar}
                    selectedLang={selectedLang}
                    onToggleLang={() => setLangOpen(!langOpen)}
                    onOpenThreadSwitcher={() => setThreadSwitcherOpen(true)}
                    onNewChat={onNewChatWithScroll}
                />

                {/* TAB BAR - Strictly controlled by index.css (Requires Width >= 768px AND Height >= 600px) */}
                <div className="hidden desktop-ui-visible">
                    <ChatTabs
                        tabs={activeSessions}
                        activeTabId={activeSessionId}
                        onTabClick={onTabClick}
                        onTabClose={handleTabClose}
                        onNewTab={onNewChatWithScroll}
                    />
                </div>

                {/* Main Content Area (Chat Only) - Updates based on activeSession */}
                <div className={`chat-area flex-1 flex flex-col overflow-hidden bg-[var(--bg-secondary)] transition-colors duration-800 relative ${searchPanelOpen ? 'blur-[3px] pointer-events-none' : ''}`}>

                    {/* Scrolling Content Wrapper */}
                    <div ref={chatContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto w-full h-full relative">
                        {activeSession.messages.length === 0 ? (
                            /* Welcome State - ChatGPT-like centered layout */
                            <div className="relative flex flex-col h-full bg-gradient-to-b from-[var(--bg-secondary)] via-[var(--bg-secondary)] to-[var(--bg-tertiary)]/30">
                                {/* Main content area - flex grow to push input to bottom */}
                                <div className="flex-1 flex flex-col justify-center items-center overflow-y-auto custom-scrollbar w-full px-4 pb-4">
                                    <div className="flex flex-col items-center w-full max-w-[1000px]">
                                        {/* Mobile: Simple greeting */}
                                        <h2 className="md:hidden text-[24px] font-semibold mb-6 text-center tracking-tight drop-shadow-sm bg-gradient-to-r from-[var(--brand-primary)] to-[var(--text-primary)] bg-clip-text text-transparent">
                                            How can I help?
                                        </h2>
                                        {/* Desktop: Full greeting */}
                                        <h2 className="hidden md:block text-[32px] font-semibold mb-10 text-center tracking-tight drop-shadow-sm bg-gradient-to-r from-[var(--brand-primary)] to-[var(--text-primary)] bg-clip-text text-transparent">
                                            How can I streamline your logistics today?
                                        </h2>

                                        <StarterGrid onStarterClick={handleFeatureClick} />
                                    </div>
                                </div>

                                {/* Bottom Input - sticky at bottom, keyboard responsive */}
                                <div className="shrink-0 w-full bg-gradient-to-t from-[var(--bg-secondary)] via-[var(--bg-secondary)] to-transparent pt-4 pb-4 md:pb-8 px-4">
                                    <div className="max-w-[900px] mx-auto">
                                        <InputArea
                                            inputValue={activeSession.inputValue}
                                            setInputValue={(val) => updateActiveSession({ inputValue: val })}
                                            onSend={handleSend}
                                            mode="bottom"
                                            selectedFile={activeSession.selectedFile}
                                            setSelectedFile={(file) => updateActiveSession({ selectedFile: file })}
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Chat State - Scrolling Messages */
                            <div className="flex flex-col min-h-full">
                                <div className="flex-1 w-full max-w-5xl mx-auto px-2 md:px-6 py-4 space-y-3 md:space-y-4 pb-32">
                                    {activeSession.messages.map((msg, idx) => (
                                        <div key={idx} className={`flex gap-2 md:gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            {msg.role === 'assistant' && (
                                                <div className="hidden md:flex w-10 h-10 rounded-full bg-[var(--bg-card)] border-2 border-[var(--text-secondary)] items-center justify-center text-[var(--text-primary)] font-bold text-sm shrink-0 mt-1">
                                                    A
                                                </div>
                                            )}
                                            <div className={`px-3 py-2.5 md:p-4 rounded-2xl leading-relaxed text-[13px] sm:text-sm md:text-base ${msg.role === 'user'
                                                ? 'max-w-[70%] md:max-w-[80%] bg-[var(--brand-primary)]/15 border border-[var(--brand-primary)]/20 text-[var(--text-primary)] rounded-tr-sm'
                                                : 'w-full md:max-w-[85%] bg-transparent text-[var(--text-primary)] rounded-tl-sm'
                                                }`}>
                                                {msg.role === 'assistant' ? (
                                                    msg.isNew ? (
                                                        <TypingMessage
                                                            content={msg.content}
                                                            timestamp={msg.timestamp}
                                                            onComplete={() => handleTypingComplete(idx)}
                                                            onTyping={scrollToBottom}
                                                            onLinkClick={handleLinkClick}
                                                        />
                                                    ) : (
                                                        <MessageContent content={msg.content} onLinkClick={handleLinkClick} />
                                                    )
                                                ) : (
                                                    <>
                                                        {msg.image && (
                                                            <img
                                                                src={msg.image.startsWith('blob:') ? msg.image : `${API_CONFIG.BASE_URL}${msg.image}`}
                                                                alt="Attached"
                                                                className="max-w-full max-h-36 rounded-lg mb-2 border border-[var(--border-color)]"
                                                            />
                                                        )}
                                                        {msg.content}
                                                    </>
                                                )}
                                            </div>
                                            {msg.role === 'user' && (
                                                <div className="hidden md:flex w-10 h-10 rounded-full bg-[var(--bg-card)] border-2 border-[var(--text-secondary)] items-center justify-center text-[var(--text-primary)] font-bold text-sm shrink-0 mt-1">
                                                    U
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {activeSession.isThinking && (
                                        <div className="flex gap-4 justify-start">
                                            <div className="hidden md:flex w-10 h-10 rounded-full bg-[var(--bg-card)] border-2 border-[var(--text-secondary)] items-center justify-center text-[var(--text-primary)] font-bold text-sm shrink-0 mt-1">
                                                A
                                            </div>
                                            <LogisticsLoader />
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Fixed Bottom Input for Chat Mode */}
                                <div className="sticky bottom-0 w-full bg-gradient-to-t from-[var(--bg-secondary)] via-[var(--bg-secondary)] to-transparent pt-10 pb-6 px-4">
                                    <div className="max-w-5xl mx-auto">
                                        <InputArea
                                            inputValue={activeSession.inputValue}
                                            setInputValue={(val) => updateActiveSession({ inputValue: val })}
                                            onSend={handleSend}
                                            mode="bottom"
                                            selectedFile={activeSession.selectedFile}
                                            setSelectedFile={(file) => updateActiveSession({ selectedFile: file })}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* FAQ Overlay - Fixed over the Chat Area Viewport */}
                    {showFAQ && (
                        <div
                            className="absolute inset-0 z-20 flex items-center justify-center p-8 bg-[var(--bg-primary)]/60 backdrop-blur animate-in fade-in duration-300"
                            onClick={() => setShowFAQ(false)}
                        >
                            <div
                                className="w-full max-w-4xl bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-2xl p-6 overflow-y-auto max-h-full"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex justify-between items-center mb-6 px-2">
                                    <h3 className="text-xl font-bold text-[var(--text-primary)] uppercase tracking-wider">Frequently Asked Questions</h3>
                                    <button onClick={() => setShowFAQ(false)} className="p-2 rounded-full hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                                        <FaChevronLeft className="w-5 h-5 rotate-180" />
                                        <span className="sr-only">Close</span>
                                    </button>
                                </div>
                                <FAQ onFeatureClick={(text) => {
                                    handleFeatureClick(text);
                                    setShowFAQ(false);
                                }} />
                            </div>
                        </div>
                    )}
                </div>

                {/* Search Panel Overlay */}
                <SearchPanel
                    isOpen={searchPanelOpen}
                    onClose={closeSearchPanel}
                    onResultClick={handleSearchResultClick}
                    onStartChat={handleSearchStartChat}
                    onLoadChat={onLoadChatWithScroll}
                    threads={threads}
                />
            </div>

            {/* Split View Context Panel - Right Sidebar (Squeezes content on desktop) */}
            <ContextPanel
                isOpen={contextPanelOpen}
                onClose={() => setContextPanelOpen(false)}
                data={contextPanelData}
            />



            {/* Language Panel - Absolute Top Right (Inside Content) */}
            {langOpen && (
                <>
                    <div className="fixed inset-0 z-[40]" onClick={() => setLangOpen(false)}></div>
                    <div className="language-panel absolute top-[64px] right-4 w-56 max-h-[320px] bg-[var(--bg-card)] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] flex flex-col z-[50] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 border border-[var(--border-color)] rounded-xl">
                        <div className="panel-header flex items-center gap-3 p-3 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]">
                            <input
                                type="text"
                                className="language-search flex-1 w-full p-2 text-xs rounded-md border border-[var(--border-color)] outline-none bg-[var(--bg-card)] text-[var(--text-primary)] focus:border-[var(--brand-primary)] placeholder:text-[var(--text-tertiary)]"
                                placeholder="Search language..."
                                value={langSearchTerm}
                                onChange={(e) => setLangSearchTerm(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                autoFocus
                            />
                        </div>


                        <div className="language-grid p-1.5 flex flex-col gap-0.5 overflow-y-auto custom-scrollbar bg-[var(--bg-card)]">
                            {filteredLanguages.map((lang, idx) => (
                                <div
                                    key={idx}
                                    className={`lang-item flex items-center gap-3 p-2 text-sm cursor-pointer rounded-md transition-all text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] ${selectedLang.name === lang.name ? 'active bg-[var(--bg-tertiary)] text-[var(--brand-primary)] font-semibold' : ''}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedLang(lang);
                                        setLangOpen(false);
                                    }}
                                >
                                    <img src={lang.flag} alt="Flag" className={`w-5 h-5 rounded-full shrink-0 object-cover border border-[var(--border-color)]`} />
                                    <span className="truncate flex-1">{lang.name}</span>
                                    {selectedLang.name === lang.name && <span className="text-[var(--status-attentive)] text-xs">●</span>}
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {/* Thread Switcher Bottom Sheet - Mobile Only */}
            <ThreadSwitcher
                isOpen={threadSwitcherOpen}
                onClose={() => setThreadSwitcherOpen(false)}
                sessions={activeSessions}
                activeSessionId={activeSessionId}
                onSelectSession={(id) => {
                    onTabClick(id);
                }}
                onCloseSession={handleTabClose}
                onNewChat={onNewChatWithScroll}
            />
        </div>
    );
};

export default Layout;


