import React from 'react';

export function PageToolbar({ children }: { children: React.ReactNode }) {
    return (
        <div className="mb-4 flex flex-wrap items-center gap-[7px] border-b border-(--hairline) pt-[10px] pb-[12px]">
            {children}
        </div>
    );
}

export function PageToolbarSpacer() {
    return <div className="flex-1" />;
}

export function PageToolbarDivider() {
    return <div className="mx-1 h-[22px] w-px bg-(--hairline)" />;
}
