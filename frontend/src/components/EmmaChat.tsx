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

export default function EmmaChat({ conceptTitle, conceptOneLiner }: EmmaChatProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: `Hey! I'm Emma. I know ${conceptTitle} might seem dense at first glance. What part of it doesn't click for you yet?`
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = { role: 'user' as const, content: input.trim() };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messages: [...messages, userMessage],
                    conceptTitle,
                    conceptOneLiner
                })
            });

            if (!response.ok) {
                throw new Error('Failed to fetch response');
            }

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

    if (!isOpen) {
        return (
            <button className={styles.triggerBtn} onClick={() => setIsOpen(true)}>
                <span className={styles.icon}>💬</span> Ask Emma a question
            </button>
        );
    }

    return (
        <div className={styles.chatContainer}>
            <div className={styles.header}>
                <div className={styles.headerTitle}>
                    <span className={styles.statusDot}></span>
                    EMMA // Vibe Coder Support
                </div>
                <button className={styles.closeBtn} onClick={() => setIsOpen(false)}>×</button>
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
                <div ref={messagesEndRef} />
            </div>

            <form className={styles.inputArea} onSubmit={handleSend}>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={`Ask Emma about ${conceptTitle}...`}
                    className={styles.input}
                    disabled={isLoading}
                />
                <button type="submit" className={styles.sendBtn} disabled={isLoading || !input.trim()}>
                    SEND
                </button>
            </form>
        </div>
    );
}
