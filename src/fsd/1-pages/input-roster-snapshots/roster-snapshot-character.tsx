/* eslint-disable import-x/no-internal-modules */

import { getImageUrl } from 'src/shared-logic/functions';

import { RarityMapper, RarityStars } from '@/fsd/5-shared/model';
import { Rank } from '@/fsd/5-shared/model/enums/rank.enum';
import { tacticusIcons } from '@/fsd/5-shared/ui/icons/iconList';

import { ICharacterData } from '@/fsd/4-entities/character';
import { IEquipment } from '@/fsd/4-entities/equipment/model';
import { IMowStatic2 } from '@/fsd/4-entities/mow/model';

import { RosterSnapshotShowVariableSettings } from '@/fsd/3-features/view-settings/model';

import { ISnapshotCharacter, ISnapshotMachineOfWar } from './models';
import { useRosterSnapshotAssets } from './roster-snapshots.hooks';

function getRank(rank: number): Rank {
    if (rank in Rank) {
        return rank as Rank;
    }
    return Rank.Locked;
}

function formatShardCount(count: number): string {
    if (count < 0) return '0';
    if (count < 1000) return count.toString();
    if (count < 10000) return `${Math.floor(count / 1000)}k`;
    return '>10k';
}

interface Props {
    showShards: RosterSnapshotShowVariableSettings;
    showMythicShards: RosterSnapshotShowVariableSettings;
    showXpLevel: RosterSnapshotShowVariableSettings;
    showAbilities: RosterSnapshotShowVariableSettings;
    showEquipment: RosterSnapshotShowVariableSettings;
    showTooltip: boolean;
    char?: ISnapshotCharacter;
    charData?: ICharacterData;
    mow?: ISnapshotMachineOfWar;
    mowData?: IMowStatic2;
    isDisabled?: boolean;
}

export const RosterSnapshotCharacter = ({
    showShards,
    showMythicShards,
    showXpLevel,
    showAbilities,
    showEquipment,
    char,
    charData,
    mow,
    mowData,
    isDisabled,
}: Props) => {
    const { frame, rankIcon, starIcon, shardIcon, mythicShardIcon } = useRosterSnapshotAssets(
        mow !== undefined,
        char?.rarity ?? mow?.rarity ?? 0,
        char?.rank ?? undefined,
        char?.stars ?? mow?.stars ?? 0
    );
    const charIcon = getImageUrl(charData?.icon ?? mowData?.icon ?? 'default-character-icon.png');
    const rank = getRank(char?.rank ?? 0);
    const isLocked = rank === Rank.Locked && (mow === undefined || mow.locked);

    const shouldShowShards = () => {
        if (showShards === RosterSnapshotShowVariableSettings.Always) return true;
        if (showShards === RosterSnapshotShowVariableSettings.Never) return false;
        // Auto
        return (char?.shards ?? mow?.shards ?? 0) > 0;
    };

    const shouldShowMythicShards = () => {
        if (showMythicShards === RosterSnapshotShowVariableSettings.Always) return true;
        if (showMythicShards === RosterSnapshotShowVariableSettings.Never) return false;
        // Auto
        return (char?.mythicShards ?? mow?.mythicShards ?? 0) > 0;
    };

    const shouldShowXpLevel = () => {
        if (mow !== undefined) return false;
        if (isLocked) return false;
        if (showXpLevel === RosterSnapshotShowVariableSettings.Always) return true;
        if (showXpLevel === RosterSnapshotShowVariableSettings.Never) return false;
        return (char?.xpLevel ?? 0) > 0;
    };

    const shouldShowEquipment = () => {
        if (mow !== undefined) return false;
        if (showEquipment === RosterSnapshotShowVariableSettings.Always) return true;
        if (showEquipment === RosterSnapshotShowVariableSettings.Never) return false;
        return true;
    };

    const shouldShowAbilities = () => {
        if (isLocked) return false;
        if (showAbilities === RosterSnapshotShowVariableSettings.Never) return false;
        return true;
    };

    const canvasWidth = 96;
    const equipmentHeight = showEquipment ? 30 : 0;
    const equipmentPadding = 4;
    const canvasHeight = 170 + equipmentHeight;
    const starSize = 24;
    const blueStarWidth = 34;
    const bigStarSize = 30;

    const renderShards = (count: number) => {
        const iconWidth = 30;
        const iconHeight = 29;
        return (
            <div className="absolute top-[24px] left-0" style={{ width: iconWidth, height: iconHeight, zIndex: 13 }}>
                <img src={shardIcon[0]?.src} className="h-full w-full" />
                <div className="absolute inset-0 flex items-center justify-center text-[13px] font-bold text-white">
                    {formatShardCount(count)}
                </div>
            </div>
        );
    };

    const renderMythicShards = (count: number) => {
        const iconWidth = 30;
        const iconHeight = 29;
        return (
            <div
                className="absolute top-[24px]"
                style={{ left: canvasWidth - iconWidth, width: iconWidth, height: iconHeight, zIndex: 13 }}>
                <img src={mythicShardIcon[0]?.src} className="h-full w-full" />
                <div className="absolute inset-0 flex items-center justify-center text-[13px] font-bold text-white">
                    {formatShardCount(count)}
                </div>
            </div>
        );
    };
    const renderEquipmentType = (type: string | undefined) => {
        if (type === undefined) {
            return <div style={{ width: equipmentHeight, height: equipmentHeight }} />;
        }

        const imageUrl = getImageUrl(
            `snowprint_assets/equipment/ui_icon_itemtype_${type?.substring(2).toLowerCase()}.png`
        );

        return (
            <div className="relative" style={{ width: equipmentHeight, height: equipmentHeight }}>
                <img
                    src={imageUrl}
                    className="absolute"
                    style={{
                        left: equipmentPadding,
                        top: equipmentPadding,
                        width: equipmentHeight - equipmentPadding * 2,
                        height: equipmentHeight - equipmentPadding * 2,
                    }}
                />
            </div>
        );
    };

    const renderEquipmentItem = (
        equipment: IEquipment | undefined,
        level: number | undefined,
        type: string | undefined
    ) => {
        if (equipment === undefined) return renderEquipmentType(type);

        const frameKey = (RarityMapper.rarityToRarityString(equipment.rarity).toLocaleLowerCase() +
            'EquipmentFrame') as keyof typeof tacticusIcons;
        const frameDetails = tacticusIcons[frameKey] ?? { file: '', label: frameKey };
        const relicDetails = tacticusIcons['relicEquipmentFrame'] ?? { file: '', label: 'relicEquipmentFrame' };
        const equip = getImageUrl(equipment.icon ?? '');
        const frame = frameDetails.file;
        const relicFrame = relicDetails.file;

        return (
            <div className="relative" style={{ width: equipmentHeight, height: equipmentHeight }}>
                <img
                    src={equip}
                    className="absolute"
                    style={{
                        left: equipmentPadding + 4,
                        top: equipmentPadding + 4,
                        width: equipmentHeight - equipmentPadding * 2 - 8,
                        height: equipmentHeight - equipmentPadding * 2 - 8,
                    }}
                />
                <img
                    src={frame}
                    className="absolute"
                    style={{
                        left: equipmentPadding,
                        top: equipmentPadding - 2,
                        width: equipmentHeight - equipmentPadding * 2,
                        height: equipmentHeight - equipmentPadding * 2 + 4,
                    }}
                />
                {equipment.isRelic && (
                    <img
                        src={relicFrame}
                        className="absolute"
                        style={{
                            left: equipmentPadding,
                            top: equipmentPadding - 2,
                            width: equipmentHeight - equipmentPadding * 2,
                            height: equipmentHeight - equipmentPadding * 2 + 4,
                        }}
                    />
                )}
                <div className="absolute top-0 right-0 text-[13px] font-bold text-white">
                    {Math.min(11, Math.max(1, level ?? 1)).toString()}
                </div>
            </div>
        );
    };

    const renderEquipment = () => {
        const typeOrder: Record<string, number> = {
            I_Crit: 0,
            R_Crit: 0,
            I_Block: 1,
            R_Block: 1,
            I_Defensive: 1,
            R_Defensive: 1,
            I_Booster_Block: 2,
            R_Booster_Block: 2,
            I_Booster_Crit: 2,
            R_Booster_Crit: 2,
        };

        const equips = [
            { equip: char?.equip0, level: char?.equip0Level, type: char?.equip0?.type ?? charData?.equipment1 },
            { equip: char?.equip1, level: char?.equip1Level, type: char?.equip1?.type ?? charData?.equipment2 },
            { equip: char?.equip2, level: char?.equip2Level, type: char?.equip2?.type ?? charData?.equipment3 },
        ].sort(
            (a, b) =>
                (typeOrder[a.type ?? ''] ?? Number.MAX_SAFE_INTEGER) -
                (typeOrder[b.type ?? ''] ?? Number.MAX_SAFE_INTEGER)
        );

        return (
            <div
                className="absolute left-0"
                style={{ top: canvasHeight - equipmentHeight, width: canvasWidth, height: equipmentHeight }}>
                <div className="absolute top-0 left-0">
                    {renderEquipmentItem(equips[0].equip, equips[0].level, equips[0].type)}
                </div>
                <div className="absolute top-0" style={{ left: canvasWidth / 2 - equipmentHeight / 2 }}>
                    {renderEquipmentItem(equips[1].equip, equips[1].level, equips[1].type)}
                </div>
                <div className="absolute top-0" style={{ left: canvasWidth - equipmentHeight }}>
                    {renderEquipmentItem(equips[2].equip, equips[2].level, equips[2].type)}
                </div>
            </div>
        );
    };
    const AbilityBadge = ({ val, x, y }: { val: number; x: number; y: number }) => {
        const badgeRadius = 12;
        return (
            <div
                className="absolute rounded-full border border-white bg-[#272424] text-white shadow-md"
                style={{
                    left: x - badgeRadius,
                    top: y - badgeRadius,
                    width: badgeRadius * 2,
                    height: badgeRadius * 2,
                }}>
                <div className="flex h-full w-full items-center justify-center text-[13px] font-bold">{val}</div>
            </div>
        );
    };

    const renderAbilities = (first: number, second: number) => {
        const yPos = 155; // Positioned near the bottom of your 170px height
        const leftX = 18; // Left side of the 96px frame
        const rightX = 78; // Right side of the 96px frame

        return (
            <>
                <AbilityBadge val={first} x={leftX} y={yPos} />
                <AbilityBadge val={second} x={rightX} y={yPos} />
            </>
        );
    };

    const renderXpLevel = (level: number) => {
        const yPos = 155; // Positioned near the bottom of your 170px height
        const centerX = 48; // Left side of the 96px frame

        return <AbilityBadge val={level} x={centerX} y={yPos} />;
    };

    const getStarSrc = () => (Array.isArray(starIcon) ? starIcon[0]?.src : starIcon) ?? '';

    const renderWings = () => {
        return (
            <img
                src={getStarSrc()}
                className={`absolute ${isLocked || (isDisabled ?? false) ? 'grayscale' : ''}`}
                style={{ left: 3, top: 2, width: 90, height: starSize, zIndex: 11 }}
            />
        );
    };

    const renderBlueStars = (starCount: number) => {
        const overlap = -5;
        const totalWidth = starCount * blueStarWidth - overlap * (starCount - 1);
        const startX = (canvasWidth - totalWidth) / 2;
        return Array.from({ length: starCount }).map((_, index) => {
            return (
                <img
                    key={`char-star-${index}`}
                    src={getStarSrc()}
                    className="absolute"
                    style={{
                        left: startX + index * blueStarWidth - overlap * index,
                        top: 3,
                        width: blueStarWidth,
                        height: starSize,
                        zIndex: 11,
                    }}
                />
            );
        });
    };

    const renderStars = () => {
        const stars = char?.stars ?? mow?.stars ?? 0;
        if (stars === RarityStars.MythicWings) {
            return renderWings();
        }
        let starCount = 0;
        if (stars >= RarityStars.OneBlueStar) {
            starCount = stars - RarityStars.OneBlueStar + 1;
            return renderBlueStars(starCount);
        }
        if (stars >= RarityStars.RedOneStar) {
            starCount = stars - RarityStars.RedOneStar + 1;
        }
        if (stars <= RarityStars.FiveStars) {
            starCount = stars;
        }
        const hasBigStar = starCount === 5;
        const overlap = 10;
        const totalWidth = starCount * starSize + (hasBigStar ? 6 : 0) - overlap * (starCount - 1);
        const startX = (canvasWidth - totalWidth) / 2;
        return Array.from({ length: starCount }).map((_, index) => {
            const isBigStar = hasBigStar && index === 2;
            let offset = 0;
            if (index > 0) offset += starSize * index - overlap * index;
            if (hasBigStar && index > 2) offset += bigStarSize - starSize;
            return (
                <img
                    key={`char-star-${index}`}
                    src={getStarSrc()}
                    className="absolute"
                    style={{
                        left: startX + offset,
                        top: isBigStar ? 0 : 3,
                        width: isBigStar ? bigStarSize : starSize,
                        height: isBigStar ? bigStarSize : starSize,
                        zIndex: isBigStar ? 12 : 11,
                    }}
                />
            );
        });
    };

    return (
        <div className={`relative h-[${canvasHeight}px] w-[${canvasWidth}px] origin-top-left transition-none`}>
            <div className="absolute inset-0 h-[170px] w-[96px] origin-top-left">
                <img
                    src={charIcon}
                    className={`absolute top-[17px] left-[3px] h-[120px] w-[90px] ${isLocked ? 'grayscale' : ''}`}
                />
                <img src={frame[0]?.src} className="absolute top-[14px] z-10 h-[126px] w-[96px]" />
                {rankIcon && rankIcon[0] && !isLocked && (
                    <img src={rankIcon[0]?.src} className={`absolute top-[110px] left-0 z-20 h-[30px] w-[30px]`} />
                )}
                {shouldShowAbilities() && char && renderAbilities(char.activeAbilityLevel, char.passiveAbilityLevel)}
                {shouldShowAbilities() && mow && renderAbilities(mow.primaryAbilityLevel, mow.secondaryAbilityLevel)}
                {shouldShowXpLevel() && char && renderXpLevel(char.xpLevel)}
                {starIcon && starIcon[0] && !isLocked && renderStars()}
                {shouldShowShards() && renderShards(char?.shards ?? mow?.shards ?? 0)}
                {shouldShowMythicShards() && renderMythicShards(char?.mythicShards ?? mow?.mythicShards ?? 0)}
                {shouldShowEquipment() && renderEquipment()}
            </div>
        </div>
    );
};
