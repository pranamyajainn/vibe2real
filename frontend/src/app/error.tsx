'use client';

import { useEffect } from 'react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Optionally log the error to an error reporting service
        console.error(error);
    }, [error]);

    return (
        <div style={{
            backgroundColor: '#050505',
            minHeight: '100vh',
            width: '100vw',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
            backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            overflow: 'hidden'
        }}>
            {/* Scanline overlay */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)',
                pointerEvents: 'none',
                zIndex: 10
            }} />

            <div style={{
                position: 'absolute',
                top: '2rem',
                left: '2rem',
                fontFamily: 'var(--font-display)',
                fontSize: '2rem',
                letterSpacing: '0.05em',
                color: '#EAEAEA',
                zIndex: 20
            }}>
                VIBE<span style={{ color: '#E8000D' }}>2</span>REAL
            </div>

            <div style={{ textAlign: 'center', zIndex: 20 }}>
                <div style={{
                    color: '#E8000D',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem',
                    letterSpacing: '0.3em',
                    marginBottom: '1rem'
                }}>
          // ERROR
                </div>

                <div style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '12rem',
                    color: '#EAEAEA',
                    lineHeight: '1',
                    textShadow: '0 0 20px rgba(234, 234, 234, 0.2)'
                }}>
                    500
                </div>

                <div style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '3rem',
                    color: '#E8000D',
                    marginTop: '-1rem',
                    marginBottom: '2rem'
                }}>
                    SYSTEM FAILURE.
                </div>

                <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '1rem',
                    color: '#666',
                    marginBottom: '4rem'
                }}>
                    Something broke on our end. Even we have incidents.
                </div>

                <button
                    onClick={() => reset()}
                    style={{
                        display: 'inline-block',
                        backgroundColor: '#E8000D',
                        color: '#050505',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        padding: '1rem 2rem',
                        textDecoration: 'none',
                        textTransform: 'uppercase',
                        border: '2px solid #E8000D',
                        cursor: 'pointer',
                        transition: 'all 0.1s ease'
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = '#E8000D';
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = '#E8000D';
                        e.currentTarget.style.color = '#050505';
                    }}
                >
                    RELOAD →
                </button>
            </div>
        </div>
    );
}
