import React from 'react';

interface MobileCategoryCardProps {
    icon: React.ReactNode;
    label: string;
    items: string[];
    onClick: () => void;
}

export const MobileCategoryCard = ({ icon, label, items, onClick }: MobileCategoryCardProps) => (
    <div
        role="button"
        tabIndex={0}
        className="flex min-h-[140px] w-full max-w-[350px] cursor-pointer flex-col overflow-hidden rounded-xl border border-(--card-border) bg-(--card-bg) shadow-sm transition-colors"
        onClick={onClick}
        onKeyDown={event_ => {
            if (event_.key === 'Enter' || event_.key === ' ') {
                event_.preventDefault();
                onClick();
            }
        }}>
        <div className="border-b border-(--card-border) px-4 py-3">
            <div className="flex items-center gap-2.5 font-medium">
                {icon} {label}
            </div>
        </div>
        <div className="px-4 py-3 text-sm">
            <ul className="m-0 list-none p-0">
                {items.map(item => (
                    <li key={item}>{item}</li>
                ))}
            </ul>
        </div>
    </div>
);
