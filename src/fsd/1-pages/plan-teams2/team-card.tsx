/* eslint-disable import-x/no-internal-modules */
import { GripVertical, Users2, Swords, Shield, Users, Trophy, Map, Rocket } from 'lucide-react';
import React from 'react';

import { ICharacter2 } from '@/models/interfaces';

import { Rank } from '@/fsd/5-shared/model/enums/rank.enum';
import { type DragHandleProps } from '@/fsd/5-shared/ui';

import { IMow2 } from '@/fsd/4-entities/mow';

import { campaignStorylineLabel } from './campaign.constants';
import { ITeam2 } from './models';
import { TeamCardActions } from './team-card-actions';
import { TeamFlow } from './team-flow';

const CHIP_CLASSES: Record<string, string> = {
    warning: 'border-(--warning)/50 bg-(--warning)/15 text-(--warning)',
    info: 'border-(--primary)/50 bg-(--primary)/15 text-(--primary)',
    secondary: 'border-(--border) bg-(--soft) text-(--soft-fg)',
    success: 'border-(--success)/50 bg-(--success)/15 text-(--success)',
    error: 'border-(--danger)/50 bg-(--danger)/15 text-(--danger)',
};

const MetadataChip = ({
    icon,
    label,
    color = 'secondary',
}: {
    icon: React.ReactElement;
    label: string;
    color: string;
}) => (
    <span
        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[0.65rem] font-bold uppercase ${CHIP_CLASSES[color] ?? CHIP_CLASSES.secondary}`}>
        {icon}
        {label}
    </span>
);

interface Props {
    team: ITeam2;
    resolvedChars: ICharacter2[];
    resolvedMows: IMow2[];
    zoom: number;
    /** When provided, renders a drag grip in the header wired to the dnd-kit sortable activator. */
    dragHandle?: DragHandleProps;
    onMove: (delta: number) => void;
    canMoveUp: boolean;
    canMoveDown: boolean;
    onEdit: () => void;
    onDelete: () => void;
}

/** Renders a full team card: header (grip + priority + name + actions), metadata chips, notes, and roster. */
export const TeamCard: React.FC<Props> = ({
    team,
    resolvedChars,
    resolvedMows,
    zoom,
    dragHandle,
    onMove,
    canMoveUp,
    canMoveDown,
    onEdit,
    onDelete,
}) => (
    <div className="rounded-xl border border-(--card-border) bg-(--card) p-4 transition-colors">
        <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div
                    ref={dragHandle?.ref}
                    {...(dragHandle?.attributes ?? {})}
                    {...(dragHandle?.listeners ?? {})}
                    title={dragHandle ? 'Drag to reorder' : undefined}
                    className={`flex shrink-0 items-center gap-1 text-(--soft-fg) ${dragHandle ? 'cursor-grab touch-none py-1 pr-1 select-none active:cursor-grabbing' : ''}`}>
                    {dragHandle && (
                        <GripVertical className="size-4 opacity-40 transition-opacity hover:opacity-80 motion-reduce:transition-none" />
                    )}
                    <span className="text-lg leading-none font-extrabold">#{team.priority}</span>
                </div>
                <div>
                    <span className="font-mono text-xs tracking-wider text-(--soft-fg) uppercase">
                        Team Configuration
                    </span>
                    <h3 className="text-(--card-fg)">{team.name}</h3>
                </div>
            </div>

            <TeamCardActions
                onEdit={onEdit}
                onDelete={onDelete}
                onMove={onMove}
                canMoveUp={canMoveUp}
                canMoveDown={canMoveDown}
            />
        </div>
        <div className="mb-4 flex flex-wrap gap-2">
            {!!team.warOffense && (
                <MetadataChip icon={<Swords className="size-3" />} label="War Offense" color="warning" />
            )}
            {!!team.warDefense && (
                <MetadataChip icon={<Shield className="size-3" />} label="War Defense" color="info" />
            )}
            {!!team.raid && <MetadataChip icon={<Users className="size-3" />} label="Guild Raid" color="secondary" />}
            {!!team.ta && <MetadataChip icon={<Trophy className="size-3" />} label="Tournament" color="success" />}
            {!!team.horde && <MetadataChip icon={<Users2 className="size-3" />} label="Horde" color="error" />}
            {!!team.campaign && <MetadataChip icon={<Map className="size-3" />} label="Campaign" color="info" />}
            {!!team.incursion && <MetadataChip icon={<Rocket className="size-3" />} label="Incursion" color="info" />}
        </div>
        {!!team.campaign && !!team.campaignStoryline && (
            <div className="mb-4 flex flex-wrap gap-2">
                <MetadataChip
                    icon={<Map className="size-3" />}
                    label={campaignStorylineLabel(team.campaignStoryline)}
                    color="secondary"
                />
            </div>
        )}
        {!!team.incursion && !!team.incursionMows?.length && (
            <div className="mb-4 flex flex-wrap gap-2">
                {team.incursionMows.map(mowId => (
                    <MetadataChip
                        key={mowId}
                        icon={<Rocket className="size-3" />}
                        label={resolvedMows.find(m => m.snowprintId === mowId)?.name ?? mowId}
                        color="secondary"
                    />
                ))}
            </div>
        )}
        {team.notes && team.notes.trim().length > 0 && (
            <div className="mb-4">
                <span className="font-mono text-xs tracking-wider text-(--soft-fg) uppercase">Notes</span>
                <div className="mt-2 rounded border border-(--card-border) bg-(--soft) p-3">
                    <p className="text-sm whitespace-pre-wrap text-(--fg)">{team.notes}</p>
                </div>
            </div>
        )}
        <div className="rounded-lg bg-(--soft) p-3">
            <TeamFlow
                chars={
                    team.chars
                        .filter(id => resolvedChars.some(x => x.snowprintId === id))
                        .map(id => resolvedChars.find(x => x.snowprintId === id)!)
                        .filter(x => x !== undefined) ?? []
                }
                mows={
                    team.mows
                        ?.filter(id => resolvedMows.some(x => x.snowprintId === id))
                        .map(id => resolvedMows.find(x => x.snowprintId === id)!)
                        .filter(x => x !== undefined) ?? []
                }
                flexIndex={team.flexIndex}
                onCharClicked={() => {}}
                onMowClicked={() => {}}
                zoom={zoom}
                disabledUnits={[
                    ...team.chars.map(
                        char => resolvedChars.find(x => x.snowprintId === char && x.rank === Rank.Locked)?.snowprintId
                    ),
                    ...(team.mows?.map(
                        mow => resolvedMows.find(x => x.snowprintId === mow && !x.unlocked)?.snowprintId
                    ) ?? []),
                ]
                    .flatMap(id => (id ? [id] : []))
                    .filter(id => id !== undefined)}
            />
        </div>
    </div>
);
