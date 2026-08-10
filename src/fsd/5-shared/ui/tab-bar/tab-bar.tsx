interface Props<T extends string> {
    tabs: readonly T[];
    labels: Record<T, string>;
    active: T;
    onChange: (tab: T) => void;
}

/**
 * Underlined tab bar shared by pages with a fixed set of sub-view tabs (e.g. Survival, Shop Events).
 *
 * Wraps rather than scrolling. A horizontal scroller hides the tabs past the fold with nothing to
 * signal they exist, and needs scroll-into-view logic to keep the active one visible; wrapping shows
 * every tab at any width and needs neither. This matches the local copy in
 * `learn-daily-shops/daily-shops-lookup.tsx`, which independently arrived at the same answer.
 *
 * Inactive tabs carry a transparent bottom border so they match the active tab's height. Without it
 * the row containing the active tab is 2px taller than the others once the bar wraps.
 */
export function TabBar<T extends string>({ tabs, labels, active, onChange }: Props<T>) {
    return (
        <div className="flex flex-wrap gap-1 border-b border-(--border)">
            {tabs.map(id => (
                <button
                    key={id}
                    type="button"
                    onClick={() => onChange(id)}
                    className={[
                        'border-b-2 px-4 py-2 text-sm font-medium transition-colors',
                        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--ring)',
                        active === id
                            ? 'border-(--primary) text-(--primary)'
                            : 'border-transparent text-(--soft-fg) hover:text-(--fg)',
                    ].join(' ')}>
                    {labels[id]}
                </button>
            ))}
        </div>
    );
}
