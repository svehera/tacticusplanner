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
        1: 'border-2 border-sky-500/50 bg-sky-950/10 shadow-sm',
        2: 'border-2 border-indigo-500/45 bg-indigo-950/10',
        3: 'border border-violet-500/40 bg-violet-950/10',
    } as const;

    const sectionClass = sectionClassByLevel[level as 1 | 2 | 3] ?? sectionClassByLevel[3];

    const headingAccentByLevel = {
        1: 'text-sky-200',
        2: 'text-indigo-200',
        3: 'text-violet-200',
    } as const;

    const headingAccent = headingAccentByLevel[level as 1 | 2 | 3] ?? headingAccentByLevel[3];

    return (
        <div key={section.id} className={`mb-4 rounded-md p-3 ${sectionClass}`}>
            <button
                type="button"
                aria-expanded={isExpanded}
                onClick={() => onToggleSection(section.id)}
                className="mb-2 flex w-full items-center gap-2 rounded px-1 py-1 text-left hover:bg-white/5">
                <span className="inline-flex w-5 items-center justify-center text-base leading-none font-bold text-gray-200">
                    {isExpanded ? '▾' : '▸'}
                </span>
                <span className={`font-semibold ${headingClass} ${headingAccent}`}>{section.title}</span>
            </button>
            {isExpanded && (
                <div className="flex flex-col gap-3">
                    {renderedSubsections}
                    {renderedTeams.map(team => (
                        <div key={team.id} className="rounded-md border border-gray-600/60 bg-black/10 p-2">
                            {!team.hideTitle && <div className="mb-2 text-sm font-medium">{team.title}</div>}
                            {team.diffItems.length > 0 && (
                                <div className="mb-2 flex flex-wrap gap-5">{team.diffItems}</div>
                            )}
                            {team.unitItems.length > 0 && <div className="flex flex-wrap gap-5">{team.unitItems}</div>}
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
        <div style={{ zoom }} className="p-4">
            {sections.map(section => renderSection(section, 1, expandedSections, toggleSection))}
        </div>
    );
};
