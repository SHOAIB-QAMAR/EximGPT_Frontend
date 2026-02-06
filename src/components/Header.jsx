import React, { useState, useRef, useEffect } from 'react';
import { FaShip, FaHouse, FaBars, FaEllipsisVertical, FaGlobe } from "react-icons/fa6";
import { MdLibraryAdd } from "react-icons/md";

const Header = ({ toggleMobileSidebar, selectedLang, onToggleLang, onOpenThreadSwitcher, onNewChat }) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setMenuOpen(false);
            }
        };
        if (menuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [menuOpen]);

    return (
        <header className="header flex justify-between items-center px-3 md:px-5 py-2 md:py-3 bg-[var(--bg-card)]/95 backdrop-blur-md text-[var(--text-primary)] border-b border-[var(--border-color)] shrink-0 z-40 shadow-sm relative w-full h-14 md:h-16 transition-all duration-300">

            {/* Left: Logo & Toggle */}
            <div className="header-left flex items-center gap-2 md:gap-4 min-w-0 flex-shrink-0">
                {/* Mobile Menu Button */}
                <button
                    className="menu-btn lg:hidden flex items-center justify-center w-9 h-9 text-lg text-[var(--text-primary)] cursor-pointer hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors"
                    onClick={toggleMobileSidebar}
                >
                    <FaBars />
                </button>

                {/* Brand */}
                <div className="app-brand flex items-center gap-2">
                    {/* Logo Icon */}
                    <div className="hidden xs:flex w-8 h-8 md:w-9 md:h-9 rounded-lg bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-highlight)] items-center justify-center text-white shadow-sm">
                        <FaShip className="text-sm md:text-base" />
                    </div>
                    <div className="flex flex-col justify-center">
                        <h1 className="text-base md:text-lg font-bold leading-none tracking-tight font-display text-[var(--text-primary)]">
                            EximGPT
                        </h1>
                        <span className="hidden sm:block text-[9px] md:text-[10px] font-medium tracking-wider text-[var(--text-secondary)] uppercase">
                            Logistics AI
                        </span>
                    </div>
                </div>
            </div>

            {/* Center: Spacer */}
            <div className="flex-1" />

            {/* Right: Actions */}
            <div className="header-right flex items-center gap-1.5 md:gap-2.5 flex-shrink-0">

                {/* Mobile/Tablet Controls - Strictly controlled by index.css */}
                <div className="mobile-ui-visible flex items-center gap-1">
                    {/* Thread Switcher Button (MdLibraryAdd) */}
                    {onOpenThreadSwitcher && (
                        <button
                            type="button"
                            className="flex items-center justify-center w-8 h-8 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--brand-primary)] transition-all"
                            onClick={onOpenThreadSwitcher}
                            title="Switch Chats"
                        >
                            <MdLibraryAdd className="text-xl rotate-180" />
                        </button>
                    )}

                    {/* Language Flag Only */}
                    <button
                        className="flex items-center justify-center w-8 h-8 rounded-lg overflow-hidden border border-transparent hover:border-[var(--border-color)] transition-all"
                        onClick={onToggleLang}
                        title={selectedLang?.name || 'Language'}
                    >
                        <img
                            src={selectedLang?.flag || ""}
                            className="w-5 h-5 rounded-full object-cover shrink-0 border border-[var(--border-color)] shadow-sm"
                            alt={selectedLang?.name || "Lang"}
                        />
                    </button>

                    {/* Home Button */}
                    <button
                        className="flex items-center justify-center w-8 h-8 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--brand-primary)] transition-all"
                        onClick={() => {
                            // Add home navigation logic here if needed, or just keep visual for now as per previous deskop one
                        }}
                        title="Home"
                    >
                        <FaHouse className="text-base" />
                    </button>
                </div>

                {/* === DESKTOP: Full Controls - Strictly controlled by index.css (Requires Width >= 768px AND Height >= 600px) === */}
                <div className="hidden desktop-ui-visible items-center gap-2.5">
                    {/* Language Picker */}
                    <div className="relative p-[1px] rounded-full bg-gradient-to-r from-[var(--brand-primary)]/30 to-[var(--brand-highlight)]/30 hover:from-[var(--brand-primary)] hover:to-[var(--brand-highlight)] transition-all duration-300 group">
                        <button
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-[var(--bg-card)] cursor-pointer h-full"
                            onClick={onToggleLang}
                        >
                            <img src={selectedLang?.flag || ""} className="w-5 h-5 rounded-full object-cover shrink-0 border border-[var(--border-color)] shadow-sm" alt="" />
                            <span className="text-xs font-medium text-[var(--text-primary)] truncate group-hover:text-[var(--brand-primary)] transition-colors max-w-[80px]">
                                {selectedLang?.name || 'English'}
                            </span>
                        </button>
                    </div>

                    {/* Divider */}
                    <div className="h-5 w-px bg-[var(--border-color)]" />

                    {/* Home Button */}
                    <button
                        className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-all"
                        title="Home"
                    >
                        <FaHouse className="text-lg" />
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;