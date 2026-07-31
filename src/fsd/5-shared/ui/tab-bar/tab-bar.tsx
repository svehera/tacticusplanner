interface Props<T extends string> {
    tabs: readonly T[];
    labels: Record<T, string>;
    active: T;
    onChange: (tab: T) => void;
}

/** Underlined tab bar shared by pages with a fixed set of sub-view tabs (e.g. Survival, Shop Events). */
export function TabBar<T extends string>({ tabs, labels, active, onChange }: Props<T>) {
    return (
        <div className="flex gap-1 border-b border-(--border)">
            {tabs.map(id => (
                <button
                    key={id}
                    type="button"
                    onClick={() => onChange(id)}
                    className={[
                        'px-4 py-2 text-sm font-medium transition-colors',
                        active === id
                            ? 'border-b-2 border-(--primary) text-(--primary)'
                            : 'text-(--soft-fg) hover:text-(--fg)',
                    ].join(' ')}>
                    {labels[id]}
                </button>
            ))}
        </div>
    );
}
