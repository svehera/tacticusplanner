import { ReactNode, useEffect, useMemo, useState } from 'react';

interface RosterSnapshotsGroupedTeam {
    id: string;
    title: string;
    hideTitle?: boolean;
    diffItems: ReactNode[];
    unitItems: ReactNode[];
}

export interface RosterSnapshotsGroupedSection {
    id: string;
    title: string;
    sections?: RosterSnapshotsGroupedSection[];
    teams?: RosterSnapshotsGroupedTeam[];
}

interface Props {
    zoom: number;
    sections: RosterSnapshotsGroupedSection[];
}

const getSectionIds = (sections: RosterSnapshotsGroupedSection[]): string[] => {
    const ids: string[] = [];

    const walk = (section: RosterSnapshotsGroupedSection) => {
        ids.push(section.id);
        for (const subsection of section.sections ?? []) {
            walk(subsection);
        }
    };

    for (const section of sections) {
        walk(section);
    }

    return ids;
};

const renderSection = (
    section: RosterSnapshotsGroupedSection,
    level: number,
    expandedSections: Record<string, boolean>,
    onToggleSection: (id: string) => void
): ReactNode => {
    const renderedTeams = (section.teams ?? []).filter(team => team.diffItems.length > 0 || team.unitItems.length > 0);
    const renderedSubsections = (section.sections ?? [])
        .map(subsection => renderSection(subsection, level + 1, expandedSections, onToggleSection))
        .filter(Boolean);

    if (renderedTeams.length === 0 && renderedSubsections.length === 0) {
        return undefined;
    }

    const isExpanded = expandedSections[section.id] ?? true;

    const headingClassByLevel = {
        1: 'text-lg',
        2: 'text-base',
        3: 'text-sm',
    } as const;

    const headingClass = headingClassByLevel[level as 1 | 2 | 3] ?? 'text-sm';

    const sectionClassByLevel = {
        1: 'border border-(--card-border) bg-(--card) shadow-sm',
        2: 'border border-(--border) bg-(--fg)/3',
        3: 'border border-(--border)/60 bg-(--fg)/2',
    } as const;

    const sectionClass = sectionClassByLevel[level as 1 | 2 | 3] ?? sectionClassByLevel[3];

    const headingAccentByLevel = {
        1: 'text-(--fg)',
        2: 'text-(--fg)',
        3: 'text-(--soft-fg)',
    } as const;

    const headingAccent = headingAccentByLevel[level as 1 | 2 | 3] ?? headingAccentByLevel[3];

    return (
        <div key={section.id} className={`mb-3 rounded-xl p-3 ${sectionClass}`}>
            <button
                type="button"
                aria-expanded={isExpanded}
                onClick={() => onToggleSection(section.id)}
                className="mb-2 flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors duration-100 hover:bg-(--primary)/10">
                <svg
                    aria-hidden="true"
                    className={`h-4 w-4 shrink-0 text-(--soft-fg) transition-transform duration-150 ${isExpanded ? 'rotate-90' : ''}`}
                    viewBox="0 0 16 16"
                    fill="currentColor">
                    <path d="M6.22 4.22a.75.75 0 0 1 1.06 0l3.25 3.25a.75.75 0 0 1 0 1.06l-3.25 3.25a.75.75 0 0 1-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 0 1 0-1.06Z" />
                </svg>
                <span className={`font-semibold ${headingClass} ${headingAccent}`}>{section.title}</span>
            </button>
            {isExpanded && (
                <div className="flex flex-col gap-3">
                    {renderedSubsections}
                    {renderedTeams.map(team => (
                        <div key={team.id} className="rounded-lg border border-(--border)/50 bg-(--card) p-3">
                            {!team.hideTitle && (
                                <div className="mb-2 text-xs font-semibold tracking-wide text-(--soft-fg) uppercase">
                                    {team.title}
                                </div>
                            )}
                            {team.diffItems.length > 0 && (
                                <div className="mb-2 flex flex-wrap gap-2 sm:gap-5">{team.diffItems}</div>
                            )}
                            {team.unitItems.length > 0 && (
                                <div className="flex flex-wrap gap-2 sm:gap-5">{team.unitItems}</div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export const RosterSnapshotsGroupedDisplay = ({ zoom, sections }: Props) => {
    const sectionIds = useMemo(() => getSectionIds(sections), [sections]);
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

    useEffect(() => {
        setExpandedSections(current => {
            const next: Record<string, boolean> = {};

            for (const id of sectionIds) {
                next[id] = current[id] ?? true;
            }

            return next;
        });
    }, [sectionIds]);

    const toggleSection = (id: string) => {
        setExpandedSections(current => ({
            ...current,
            [id]: !(current[id] ?? true),
        }));
    };

    return (
        <div style={{ zoom }} className="p-2 sm:p-4">
            {sections.map(section => renderSection(section, 1, expandedSections, toggleSection))}
        </div>
    );
};
