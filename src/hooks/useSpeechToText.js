import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Helper function to log errors with detailed context
 * @param {string} hookName - Name of the hook
 * @param {string} method - Method where error occurred
 * @param {Error|string} error - Error object or message
 * @param {Object} context - Additional context
 */
const logError = (hookName, method, error, context = {}) => {
    const errorInfo = {
        file: 'useSpeechToText.js',
        hook: hookName,
        method,
        message: typeof error === 'string' ? error : error.message,
        stack: error?.stack,
        context,
        timestamp: new Date().toISOString()
    };
    console.error(`[${hookName}.${method}] Error:`, errorInfo);
    return errorInfo;
};

const useSpeechToText = (options = {}) => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [interimTranscript, setInterimTranscript] = useState("");
    const [error, setError] = useState(null);

    const recognitionRef = useRef(null);

    useEffect(() => {
        const method = 'useEffect:init';
        try {
            // Check browser support
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognition) {
                const errorMsg = "Speech recognition is not supported in this browser.";
                console.warn(`[useSpeechToText.${method}] ${errorMsg}`);
                setError(errorMsg);
                return;
            }

            console.log(`[useSpeechToText.${method}] Initializing speech recognition`);

            const recognition = new SpeechRecognition();
            recognitionRef.current = recognition;

            // Default configurations
            recognition.continuous = true; // Keep listening even if user pauses
            recognition.interimResults = true; // Show results as they are spoken
            recognition.lang = options.lang || 'en-US';

            console.log(`[useSpeechToText.${method}] Configuration - lang: ${recognition.lang}, continuous: ${recognition.continuous}`);

            recognition.onstart = () => {
                console.log(`[useSpeechToText.onstart] Speech recognition started`);
                setIsListening(true);
                setError(null);
            };

            recognition.onresult = (event) => {
                try {
                    let finalTranscript = "";
                    let interim = "";

                    for (let i = event.resultIndex; i < event.results.length; i++) {
                        const result = event.results[i];
                        if (result.isFinal) {
                            finalTranscript += result[0].transcript + " ";
                        } else {
                            interim += result[0].transcript;
                        }
                    }

                    setInterimTranscript(interim);

                    if (finalTranscript) {
                        console.log(`[useSpeechToText.onresult] Final transcript received: ${finalTranscript.substring(0, 50)}...`);
                        setTranscript(prev => prev + finalTranscript);
                    }
                } catch (resultError) {
                    logError('useSpeechToText', 'onresult', resultError, {
                        eventResultsLength: event?.results?.length
                    });
                }
            };

            recognition.onerror = (event) => {
                const errorMsg = `Speech recognition error: ${event.error}`;
                logError('useSpeechToText', 'onerror', errorMsg, {
                    errorCode: event.error,
                    errorMessage: event.message
                });
                setError(errorMsg);
                setIsListening(false);
            };

            recognition.onend = () => {
                console.log(`[useSpeechToText.onend] Speech recognition ended`);
                setIsListening(false);
            };

            return () => {
                try {
                    if (recognitionRef.current) {
                        console.log(`[useSpeechToText.cleanup] Stopping speech recognition`);
                        recognitionRef.current.stop();
                    }
                } catch (cleanupError) {
                    logError('useSpeechToText', 'cleanup', cleanupError, {});
                }
            };
        } catch (initError) {
            logError('useSpeechToText', method, initError, {
                options
            });
            setError(`Failed to initialize speech recognition: ${initError.message}`);
        }
    }, []);

    const startListening = useCallback(() => {
        const method = 'startListening';
        if (recognitionRef.current && !isListening) {
            console.log(`[useSpeechToText.${method}] Starting speech recognition`);
            setTranscript("");
            setInterimTranscript("");
            try {
                recognitionRef.current.start();
            } catch (e) {
                logError('useSpeechToText', method, e, {
                    isListening,
                    hasRecognition: !!recognitionRef.current
                });
                setError(`Failed to start speech recognition: ${e.message}`);
            }
        } else if (!recognitionRef.current) {
            console.warn(`[useSpeechToText.${method}] Cannot start - recognition not initialized`);
        }
    }, [isListening]);

    const stopListening = useCallback(() => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
        }
    }, [isListening]);

    const resetTranscript = useCallback(() => {
        setTranscript("");
        setInterimTranscript("");
    }, []);

    return {
        isListening,
        transcript,
        interimTranscript,
        startListening,
        stopListening,
        resetTranscript,
        error
    };
};

export default useSpeechToText;
