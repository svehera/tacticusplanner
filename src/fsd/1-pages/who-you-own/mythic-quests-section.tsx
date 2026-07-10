/* eslint-disable import-x/no-internal-modules */
import { useMemo } from 'react';

import { Rarity } from '@/fsd/5-shared/model';
import { BadgeImage, MiscIcon, OrbIcon, UnitShardIcon } from '@/fsd/5-shared/ui/icons';

import { CharactersService } from '@/fsd/4-entities/character';
import { EquipmentIcon, EquipmentService } from '@/fsd/4-entities/equipment';
import {
    IMythicQuest,
    IMythicQuestReward,
    IMythicQuestRewardIcon,
    MythicQuestsService,
} from '@/fsd/4-entities/mythic_quests';

import { AbilityText } from '@/fsd/3-features/character-details/ability-text-renderer';

const ICON_SIZE = 32;
const QUEST_INDEXES = [0, 1, 2, 3, 4];

function renderMythicQuestRewardIcon(icon: IMythicQuestRewardIcon): React.ReactNode {
    switch (icon.kind) {
        case 'shard': {
            const character = CharactersService.charactersBySnowprintId[icon.characterId];
            if (!character) {
                return <MiscIcon icon="mythicShard" width={ICON_SIZE} height={ICON_SIZE} />;
            }
            return (
                <UnitShardIcon
                    icon={character.roundIcon}
                    name={character.name}
                    mythic
                    height={ICON_SIZE}
                    width={ICON_SIZE}
                />
            );
        }
        case 'ascensionOrb': {
            return <OrbIcon alliance={icon.alliance} rarity={Rarity.Mythic} size={ICON_SIZE} />;
        }
        case 'abilityToken': {
            return <BadgeImage alliance={icon.alliance} rarity={Rarity.Mythic} size="medium" />;
        }
        case 'xp': {
            return <MiscIcon icon="mythicBook" width={ICON_SIZE} height={ICON_SIZE} />;
        }
        case 'gold': {
            return <MiscIcon icon="coin" width={ICON_SIZE} height={ICON_SIZE} />;
        }
        case 'equipment': {
            const equipment = EquipmentService.equipmentData.find(item => item.id === icon.equipmentId);
            if (!equipment) {
                return <span className="text-xs break-all text-(--soft-fg)">{icon.equipmentId}</span>;
            }
            return <EquipmentIcon equipment={equipment} height={ICON_SIZE} width={ICON_SIZE} />;
        }
        case 'unknown': {
            return <span className="text-xs break-all text-(--soft-fg)">{icon.raw}</span>;
        }
    }
}

function MythicQuestRewardChip({ reward }: { reward: IMythicQuestReward }) {
    return (
        <div className="flex items-center gap-2">
            <div className="flex size-8 shrink-0 items-center justify-center">
                {renderMythicQuestRewardIcon(reward.icon)}
            </div>
            <span className="text-sm text-(--fg)">
                {reward.quantity !== undefined && (
                    <span className="mr-1 font-semibold">×{reward.quantity.toLocaleString()}</span>
                )}
                {reward.label}
            </span>
        </div>
    );
}

function MythicQuestCard({
    quest,
    index,
    rarity,
    unitName,
    factionId,
}: {
    quest: IMythicQuest;
    index: number;
    rarity: Rarity;
    unitName: string;
    factionId: string;
}) {
    return (
        <div className="rounded-lg border border-(--rarity-mythic)/40 bg-(--card) p-3">
            <div className="text-xs font-semibold text-(--soft-fg)">Quest {index + 1}</div>
            <div className="mt-1 flex flex-col gap-1">
                {quest.tasks.map((task, taskIndex) => (
                    <AbilityText
                        key={taskIndex}
                        text={task.languages}
                        level={1}
                        variables={task.variables}
                        constants={{}}
                        scaledVariableNames={[]}
                        rarity={rarity}
                        unitName={unitName}
                        factionId={factionId}
                    />
                ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 border-t border-(--border) pt-2">
                {quest.rewards.map((reward, rewardIndex) => (
                    <MythicQuestRewardChip key={rewardIndex} reward={reward} />
                ))}
            </div>
        </div>
    );
}

interface Props {
    characterId: string;
    rarity: Rarity;
    unitName: string;
    factionId: string;
}

export const MythicQuestsSection = ({ characterId, rarity, unitName, factionId }: Props) => {
    const quests = useMemo(
        () =>
            QUEST_INDEXES.map(questIndex => MythicQuestsService.getQuest(characterId, questIndex)).filter(
                (quest): quest is IMythicQuest => quest !== undefined
            ),
        [characterId]
    );

    if (quests.length === 0) {
        return <></>;
    }

    return (
        <div className="mt-6 border-t border-(--border) pt-4">
            <h3 className="text-xs font-bold tracking-widest text-(--soft-fg) uppercase">Mythic Quests</h3>
            <div className="mt-3 flex flex-col gap-4">
                {quests.map((quest, index) => (
                    <MythicQuestCard
                        key={index}
                        quest={quest}
                        index={index}
                        rarity={rarity}
                        unitName={unitName}
                        factionId={factionId}
                    />
                ))}
            </div>
        </div>
    );
};
