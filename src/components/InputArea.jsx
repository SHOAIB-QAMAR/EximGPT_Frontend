import React, { useRef, useMemo } from 'react';
import useSpeechToText from '../hooks/useSpeechToText';
import { FaPaperclip, FaMicrophone, FaStop, FaPaperPlane, FaXmark } from "react-icons/fa6";

const InputArea = ({ inputValue, setInputValue, onSend, mode, selectedFile, setSelectedFile }) => {
    const textareaRef = useRef(null);
    const fileInputRef = useRef(null);

    const { isListening, transcript, interimTranscript, startListening, stopListening, resetTranscript } = useSpeechToText({
        lang: 'en-US'
    });

    // Effect to synchronise final transcript with main input
    React.useEffect(() => {
        if (transcript) {
            const spacer = inputValue && !inputValue.endsWith(' ') ? ' ' : '';
            setInputValue(inputValue + spacer + transcript);
            resetTranscript();
        }
    }, [transcript, inputValue, setInputValue, resetTranscript]);

    // Memoize the preview URL to prevent unnecessary recalculations
    const previewUrl = useMemo(() => {
        return selectedFile ? URL.createObjectURL(selectedFile) : null;
    }, [selectedFile]);

    // Cleanup blob URL when component unmounts or file changes
    React.useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    const handleSend = () => {
        if (inputValue.trim() || selectedFile) {
            onSend(inputValue);
            // Reset height
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
            }
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleInput = (e) => {
        setInputValue(e.target.value);
        // Auto-resize
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type
            const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
            if (!validTypes.includes(file.type)) {
                alert('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
                return;
            }
            // Validate file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                alert('Image size must be less than 10MB');
                return;
            }
            setSelectedFile(file);
        }
        // Reset input so same file can be selected again
        e.target.value = '';
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
    };

    const isStandalone = !mode;

    const toggleListening = () => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    };

    return (
        <div className={`${isStandalone ? 'input-area shrink-0 px-4 py-4 bg-[var(--bg-primary)] border-t border-[var(--border-color)] transition-colors duration-800' : 'w-full'}`}>
            <div className={`${isStandalone ? 'container max-w-[900px] mx-auto relative' : 'relative'}`}>

                {/* Image Preview */}
                {selectedFile && previewUrl && (
                    <div className="mb-2 relative inline-block">
                        <div className="relative group">
                            <img
                                src={previewUrl}
                                alt="Selected"
                                className="h-20 w-20 object-cover rounded-lg border-2 border-[var(--brand-primary)]/30 shadow-sm"
                            />
                            <button
                                type="button"
                                onClick={handleRemoveFile}
                                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md transition-colors"
                                title="Remove image"
                            >
                                <FaXmark className="text-xs" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Gradient Border Wrapper */}
                <div className={`relative p-[1px] rounded-xl transition-all duration-500 shadow-sm hover:-translate-y-1 hover:scale-[1.01] active:scale-[0.99]
                    ${isListening
                        ? 'bg-gradient-to-r from-red-500 via-orange-500 to-red-500 shadow-[0_0_20px_-5px_rgba(239,68,68,0.5)]'
                        : 'bg-gradient-to-r from-[var(--brand-primary)]/40 via-[var(--brand-highlight)]/40 to-[var(--brand-primary)]/40 dark:from-white/70 dark:via-white/70 dark:to-white/70 hover:from-[var(--brand-primary)] hover:via-[var(--brand-highlight)] hover:to-[var(--brand-primary)] focus-within:from-[var(--brand-primary)] focus-within:via-[var(--brand-highlight)] focus-within:to-[var(--brand-primary)] focus-within:shadow-[0_0_20px_-5px_var(--brand-primary)]'
                    }`}>

                    <div className={`input-wrapper relative flex items-end gap-2 p-3 rounded-xl bg-[var(--bg-card)] transition-all duration-200 overflow-hidden`}>
                        {/* Top-Right Background Gradient Blob */}
                        <div className="absolute top-0 right-0 w-48 h-48 bg-[radial-gradient(circle_at_top_right,var(--brand-primary),transparent_70%)] opacity-[0.25] blur-2xl rounded-tr-xl pointer-events-none"></div>

                        {/* Attach Button (Left) */}
                        <button
                            type="button"
                            className="group flex items-center justify-center w-10 h-10 rounded-full hover:bg-[var(--bg-tertiary)] transition-all shrink-0 mb-0.5"
                            onClick={() => fileInputRef.current?.click()}
                            title="Attach Image"
                        >
                            <FaPaperclip className="text-[var(--text-secondary)] group-hover:text-[var(--brand-primary)] text-lg" />
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            hidden
                            accept="image/jpeg,image/png,image/gif,image/webp"
                            onChange={handleFileChange}
                        />

                        {/* Text Input Area */}
                        <div className="flex-1 relative w-full">
                            <textarea
                                ref={textareaRef}
                                className="chat-input block w-full border-none outline-none bg-transparent text-base text-[var(--text-primary)] placeholder-[var(--text-secondary)] resize-none py-2.5 max-h-[200px] overflow-y-auto scrollbar-none"
                                placeholder={isListening ? "Listening..." : (window.innerWidth < 768 ? "Ask EximGPT" : "Send a message here...")}
                                value={isListening ? inputValue + (interimTranscript ? " " + interimTranscript : "") : inputValue}
                                onChange={handleInput}
                                onKeyDown={handleKeyDown}
                                rows={1}
                                style={{ minHeight: '44px' }}
                            />
                        </div>

                        <div className="flex items-center gap-1 mb-0.5 shrink-0">
                            <div className="relative flex items-center justify-center">
                                {isListening && (
                                    <div className="absolute inset-0 bg-red-400 rounded-full animate-pulse-ring z-0"></div>
                                )}
                                <button
                                    type="button"
                                    className={`group flex items-center justify-center w-10 h-10 rounded-full transition-all relative z-10 ${isListening ? 'bg-red-100 text-red-600' : 'hover:bg-[var(--bg-tertiary)]'}`}
                                    onClick={toggleListening}
                                    title={isListening ? "Stop Recording" : "Voice Input"}
                                >
                                    {isListening ? (
                                        <FaStop className="text-red-600 text-lg animate-pulse" />
                                    ) : (
                                        <FaMicrophone className="text-[var(--text-secondary)] group-hover:text-[var(--brand-primary)] text-lg" />
                                    )}
                                </button>
                            </div>

                            <button
                                type="button"
                                className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200 ${(inputValue.trim() || selectedFile)
                                    ? 'bg-[var(--brand-primary)] text-white shadow-md hover:shadow-lg active:scale-95 cursor-pointer'
                                    : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] cursor-not-allowed'}`}
                                onClick={handleSend}
                                disabled={!inputValue.trim() && !selectedFile}
                            >
                                <FaPaperPlane className="text-sm ml-0.5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InputArea;