import React from 'react';

import { cn } from '@/fsd/5-shared/lib';

interface MobileNavCardProps {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    className?: string;
}

export const MobileNavCard = ({ icon, label, onClick, className }: MobileNavCardProps) => (
    <div
        className={cn(
            'flex w-full max-w-[350px] cursor-pointer items-center gap-3 overflow-hidden rounded-xl border border-(--card-border) bg-(--card-bg) px-4 py-4 shadow-sm transition-colors',
            className
        )}
        onClick={onClick}>
        <span className="inline-flex items-center text-(--muted-fg)">{icon}</span>
        <span className="font-medium">{label}</span>
    </div>
);
