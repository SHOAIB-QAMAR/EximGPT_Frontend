
import React, { useState, useEffect } from 'react';
import { FaMagnifyingGlass, FaXmark } from "react-icons/fa6";

const SearchData = [
    { id: 1, title: "Freight Rates", description: "Check shipping costs for different routes", category: "Features", keywords: ["shipping", "cost", "transport", "rates", "freight"] },
    { id: 2, title: "HSN Code", description: "Find Harmonized System Nomenclature codes", category: "Features", keywords: ["hsn", "code", "classification", "tariff", "customs"] },
    { id: 3, title: "Vessel Schedule", description: "Track ship departure and arrival times", category: "Features", keywords: ["vessel", "schedule", "ship", "departure", "arrival"] },
    { id: 4, title: "Import Duty Calculator", description: "Calculate import taxes and duties", category: "Features", keywords: ["import", "duty", "tax", "calculator", "customs"] },
    { id: 5, title: "Real-Time Tracking", description: "Track shipments in real-time", category: "Features", keywords: ["tracking", "real-time", "shipment", "location", "gps"] },
    { id: 6, title: "Export Documents", description: "List of required export documentation", category: "Documents", keywords: ["export", "documents", "paperwork", "certificate", "license"] },
    { id: 7, title: "Bill of Lading", description: "Template and guide for Bill of Lading", category: "Documents", keywords: ["bill", "lading", "bl", "shipping", "document"] },
    { id: 8, title: "Customs Declaration", description: "How to fill customs declaration forms", category: "Documents", keywords: ["customs", "declaration", "form", "clearance", "import"] },
    { id: 9, title: "Get Help", description: "Contact support or read FAQs", category: "Help", keywords: ["help", "support", "faq", "contact", "assistance"] }
];

const SearchPanel = ({ isOpen, onClose, onResultClick, onStartChat, onLoadChat, threads = [] }) => {

    const [searchTerm, setSearchTerm] = useState("");
    const [results, setResults] = useState([]);

    useEffect(() => {
        if (isOpen) {
            setSearchTerm("");
            // Merge SearchData (Starters) and History Threads
            setResults([...SearchData, ...threads]);
        }
    }, [isOpen, threads]);

    const handleSearch = (e) => {
        const term = e.target.value;
        setSearchTerm(term);

        if (!term.trim()) {
            setResults([...SearchData, ...threads]);
            return;
        }

        const lowerTerm = term.toLowerCase();

        // Filter Starters
        const filteredStarters = SearchData.filter(item =>
            item.title.toLowerCase().includes(lowerTerm) ||
            item.description.toLowerCase().includes(lowerTerm) ||
            item.keywords.some(k => k.toLowerCase().includes(lowerTerm))
        );

        // Filter History
        const filteredHistory = threads.filter(item =>
            (item.title || "New Chat").toLowerCase().includes(lowerTerm)
        );

        setResults([...filteredStarters, ...filteredHistory]);
    };

    const highlightText = (text, term) => {
        if (!term) return text;

        const parts = text.split(new RegExp(`(${term})`, 'gi'));
        return parts.map((part, i) =>
            part.toLowerCase() === term.toLowerCase()
                ? <span key={i} className="bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] rounded-sm font-bold px-0.5">{part}</span>
                : part
        );
    };

    const groupedResults = React.useMemo(() => {
        if (!results || results.length === 0) return {};

        const groups = {
            "Suggested Actions": [],
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

        results.forEach(item => {
            // Check if it's a Starter Item (has category/description)
            if (item.category && item.description) {
                groups["Suggested Actions"].push(item);
                return;
            }

            // History Logic
            const threadDate = new Date(item.updatedAt || item.createdAt);
            const dateCheck = new Date(threadDate.getFullYear(), threadDate.getMonth(), threadDate.getDate());

            if (dateCheck.getTime() === today.getTime()) {
                groups["Today"].push(item);
            } else if (dateCheck.getTime() === yesterday.getTime()) {
                groups["Yesterday"].push(item);
            } else if (dateCheck >= last7Days) {
                groups["Previous 7 Days"].push(item);
            } else if (dateCheck >= last30Days) {
                groups["Previous 30 Days"].push(item);
            } else {
                groups["Older"].push(item);
            }
        });

        // Remove empty groups and LIMIT to 3 items per category
        const finalGroups = {};
        Object.keys(groups).forEach(key => {
            if (groups[key].length > 0) {
                finalGroups[key] = groups[key].slice(0, 3);
            }
        });

        return finalGroups;
    }, [results]);

    return (
        <>
            {/* Overlay */}
            <div
                className={`search-overlay fixed inset-0 bg-black/50 z-[1999] backdrop-blur-[3px] transition-all duration-300 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
                onClick={onClose}
            ></div>

            {/* Panel */}
            <div className={`search-panel fixed top-0 left-0 w-[380px] h-screen bg-[var(--bg-card)]/95 backdrop-blur-2xl border-r border-[var(--border-color)] z-[2000] shadow-2xl flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.2,0,0,1)] ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>

                {/* Header */}
                <div className="search-panel-header p-5 pb-2 shrink-0">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold tracking-tight text-[var(--text-primary)]">Search</h2>
                        <button
                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] transition-colors"
                            onClick={onClose}
                        >
                            <FaXmark />
                        </button>
                    </div>

                    <div className="search-input-wrapper relative group">
                        <FaMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] group-focus-within:text-[var(--brand-primary)] transition-colors" />
                        <input
                            type="text"
                            className="w-full py-3 pl-11 pr-4 rounded-xl bg-[var(--bg-sidebar)] border border-transparent focus:bg-[var(--bg-primary)] focus:border-[var(--brand-primary)] text-[var(--text-primary)] text-sm outline-none transition-all shadow-inner placeholder:text-[var(--text-tertiary)]"
                            placeholder="Find chats, tools, docs..."
                            value={searchTerm}
                            onChange={handleSearch}
                            autoFocus
                        />
                    </div>
                </div>

                {/* Results Area */}
                <div className="flex-1 overflow-y-auto px-3 py-2 custom-scrollbar">
                    {results.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-[var(--text-tertiary)] animate-in fade-in zoom-in duration-300">
                            <div className="w-16 h-16 bg-[var(--bg-sidebar)] rounded-full flex items-center justify-center mb-4">
                                <FaMagnifyingGlass className="text-2xl opacity-40" />
                            </div>
                            <p className="text-sm font-medium">No results found</p>
                            <p className="text-xs opacity-60 mt-1">Try "Freight" or "Report"</p>
                        </div>
                    ) : (
                        Object.keys(groupedResults).map(category => (
                            <div key={category} className="mb-4">
                                <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)] sticky top-0 bg-[var(--bg-card)]/90 backdrop-blur-md z-10 rounded-b-lg mb-1">
                                    {category}
                                </div>
                                <div className="space-y-1">
                                    {groupedResults[category].map(item => (
                                        <div
                                            key={item.id}
                                            className="group flex items-start gap-3 p-3 rounded-xl cursor-pointer hover:bg-[var(--bg-tertiary)] transition-all duration-200 border border-transparent hover:border-[var(--border-color)]"
                                            onClick={() => {
                                                if (item.category && item.description && onStartChat) {
                                                    onStartChat(item.title);
                                                } else {
                                                    onLoadChat(item.id || item.threadId);
                                                }
                                                onClose();
                                            }}
                                        >
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-sm font-medium text-[var(--text-primary)] group-hover:text-[var(--brand-primary)] transition-colors truncate">
                                                    {highlightText(item.title || "New Chat", searchTerm)}
                                                </h3>
                                                {item.description && (
                                                    <p className="text-xs text-[var(--text-secondary)] truncate mt-0.5 opacity-80 group-hover:opacity-100">
                                                        {highlightText(item.description, searchTerm)}
                                                    </p>
                                                )}
                                                {/* If it's a chat history item with no description, maybe show date? */}
                                                {!item.description && (
                                                    <p className="text-[10px] text-[var(--text-tertiary)] mt-1">
                                                        {new Date(item.updatedAt || item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </>
    );
};

export default SearchPanel;