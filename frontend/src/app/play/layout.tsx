import type { Metadata } from 'next';
import GameLayoutClient from './GameLayoutClient';

export const metadata: Metadata = {
    title: 'Vibe2Real — Simulation',
    description: 'Debug real systems. Build instinct under pressure.',
};

export default function PlayLayout({ children }: { children: React.ReactNode }) {
    return <GameLayoutClient>{children}</GameLayoutClient>;
}
