'use client';

import React, { useState, useRef, useEffect } from 'react';
import styles from './EmmaChat.module.css';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

interface EmmaChatProps {
    conceptTitle: string;
    conceptOneLiner: string;
}

const SUGGESTED_FOLLOWUPS = [
    "Why does this break in production?",
    "Show a real example",
    "Explain it simply"
];

export default function EmmaChat({ conceptTitle, conceptOneLiner }: EmmaChatProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    const storageKey = `vibe2real_emma_${conceptTitle.replace(/\s+/g, '_')}`;

    useEffect(() => {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed.length > 0) {
                    setMessages([
                        ...parsed,
                        { role: 'assistant', content: 'Welcome back. We were discussing this concept. Continue?' }
                    ]);
                    setIsLoaded(true);
                    return;
                }
            } catch (e) { }
        }

        setMessages([
            {
                role: 'assistant',
                content: `You're looking at ${conceptTitle}. Most confusion here happens around ${conceptOneLiner.toLowerCase()}. What feels unclear?`
            }
        ]);
        setIsLoaded(true);
    }, [conceptTitle, conceptOneLiner, storageKey]);

    useEffect(() => {
        if (isLoaded && messages.length > 0) {
            // Only save actual conversation history, not the "Welcome back" prompts
            const historyToSave = messages.filter(m => !m.content.startsWith('Welcome back'));
            localStorage.setItem(storageKey, JSON.stringify(historyToSave));
        }
    }, [messages, isLoaded, storageKey]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isLoading, isOpen]);

    const handleSend = async (content: string) => {
        if (!content.trim() || isLoading) return;

        const userMessage = { role: 'user' as const, content: content.trim() };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [...messages.filter(m => !m.content.startsWith('Welcome back')), userMessage],
                    conceptTitle,
                    conceptOneLiner
                })
            });

            if (!response.ok) throw new Error('Failed to fetch response');

            const data = await response.json();
            const emmaReply = data.choices?.[0]?.message?.content;

            if (emmaReply) {
                setMessages(prev => [...prev, { role: 'assistant', content: emmaReply }]);
            } else {
                throw new Error('Invalid response format');
            }
        } catch (error) {
            console.error(error);
            setMessages(prev => [
                ...prev,
                { role: 'assistant', content: '[SYSTEM TRACE] Connection to Emma lost. She might be AFK.' }
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const onSubmitForm = (e: React.FormEvent) => {
        e.preventDefault();
        handleSend(input);
    };

    if (!isLoaded) return null;

    return (
        <div className={styles.wrapper}>
            {isOpen ? (
                <div className={styles.chatPopup}>
                    <div className={styles.header}>
                        <div className={styles.headerTitle}>
                            <span className={styles.statusDot}></span>
                            Emma
                        </div>
                        <button className={styles.closeBtn} onClick={() => setIsOpen(false)}>×</button>
                    </div>

                    <div className={styles.topicBanner}>
                        <span className="system-voice" style={{ marginRight: '8px' }}>Topic:</span> {conceptTitle}
                    </div>

                    <div className={styles.messageList}>
                        {messages.map((msg, i) => (
                            <div key={i} className={`${styles.messageWrapper} ${styles[msg.role]}`}>
                                {msg.role === 'assistant' && <div className={styles.avatar}>E.</div>}
                                <div className={styles.messageContent}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className={`${styles.messageWrapper} ${styles.assistant}`}>
                                <div className={styles.avatar}>E.</div>
                                <div className={styles.messageContent}>
                                    <span className={styles.typing}>Emma is typing...</span>
                                </div>
                            </div>
                        )}

                        {!isLoading && messages[messages.length - 1]?.role === 'assistant' && (
                            <div className={styles.suggestions}>
                                {SUGGESTED_FOLLOWUPS.map((suggestion, idx) => (
                                    <button
                                        key={idx}
                                        className={styles.suggestionBtn}
                                        onClick={() => handleSend(suggestion)}
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <form className={styles.inputArea} onSubmit={onSubmitForm}>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask anything about this concept..."
                            className={styles.input}
                            disabled={isLoading}
                        />
                        <button type="submit" className={styles.sendBtn} disabled={isLoading || !input.trim()}>
                            SEND
                        </button>
                    </form>
                </div>
            ) : (
                <button className={styles.triggerFab} onClick={() => setIsOpen(true)}>
                    <span className={styles.icon}>💬</span> Emma
                </button>
            )}
        </div>
    );
}
