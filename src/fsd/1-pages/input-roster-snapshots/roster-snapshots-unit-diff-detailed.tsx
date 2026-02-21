/* eslint-disable import-x/no-internal-modules */
import { ArrowForward } from '@mui/icons-material';

import { CharacterPortraitImage } from '@/shared-components/images/character-portrait.image';
import { getImageUrl } from '@/shared-logic/functions';

import { RarityMapper } from '@/fsd/5-shared/model/mappers/rarity.mapper';
import { abilityIcons } from '@/fsd/5-shared/ui/ability-icons';
import { MiscIcon, RarityIcon, StarsIcon } from '@/fsd/5-shared/ui/icons';
import { tacticusIcons } from '@/fsd/5-shared/ui/icons/iconList';

import { CharactersService, RankIcon } from '@/fsd/4-entities/character';
import { EquipmentService, IEquipment } from '@/fsd/4-entities/equipment';
import { MowsService } from '@/fsd/4-entities/mow';

import { RosterSnapshotShowVariableSettings } from '@/fsd/3-features/view-settings/model';

import { ISnapshotCharacter, ISnapshotMachineOfWar, ISnapshotUnitDiff } from './models';

interface ProgressionRowProps {
    diffFlag: boolean;
    icon1: React.ReactNode;
    icon2: React.ReactNode;
    className?: string;
}

const ProgressionRow: React.FC<ProgressionRowProps> = ({
    diffFlag,
    icon1,
    icon2,
    className = '',
}: ProgressionRowProps) => (
    <div className={`flex items-center justify-start space-x-2 ${className}`}>
        <div className="flex h-6 w-10 items-center justify-center">
            {diffFlag ? icon1 : <span className="opacity-0">{icon1}</span>}
        </div>
        <div className="flex h-6 w-4 items-center justify-center">{diffFlag && <ArrowForward />}</div>
        <div className="flex h-6 w-10 items-center justify-center">{diffFlag ? icon2 : icon1}</div>
    </div>
);

interface Props {
    showShards: RosterSnapshotShowVariableSettings;
    showMythicShards: RosterSnapshotShowVariableSettings;
    showXpLevel: RosterSnapshotShowVariableSettings;
    showAbilities: RosterSnapshotShowVariableSettings;
    showEquipment: RosterSnapshotShowVariableSettings;
    char?: ISnapshotCharacter;
    mow?: ISnapshotMachineOfWar;
    diff: ISnapshotUnitDiff;
}

export const RosterSnapshotsUnitDiffDetailed: React.FC<Props> = ({
    showShards,
    showMythicShards,
    showXpLevel,
    showAbilities,
    showEquipment,
    char,
    mow,
    diff,
}: Props) => {
    const staticChar = char ? CharactersService.resolveCharacter(char.id) : undefined;
    const staticMow = mow ? MowsService.resolveToStatic(mow.id) : undefined;

    // Derived properties for comparison
    const rarity1 = char ? char.rarity : mow!.rarity;
    const rarity2 = diff.rarity ?? rarity1;
    const stars1 = char ? char.stars : mow!.stars;
    const stars2 = diff.stars ?? stars1;
    const rank1 = char ? char.rank : undefined;
    const rank2 = diff.rank ?? rank1;
    const active1 = char ? char.activeAbilityLevel : mow!.primaryAbilityLevel;
    const active2 = diff.active ?? active1;
    const passive1 = char ? char.passiveAbilityLevel : mow!.secondaryAbilityLevel;
    const passive2 = diff.passive ?? passive1;
    const shards1 = char ? char.shards : mow!.shards;
    const shards2 = diff.shards ?? shards1;
    const mythicShards1 = char ? char.mythicShards : mow!.mythicShards;
    const mythicShards2 = diff.mythicShards ?? mythicShards1;
    const xp1 = char?.xpLevel ?? 0;
    const xp2 = diff.xpLevel ?? xp1;

    // Difference flags
    const rarityDiff = rarity1 !== rarity2;
    const starsDiff = stars1 !== stars2;
    const rankDiff = rank1 !== rank2;
    const activeDiff = active1 !== active2;
    const passiveDiff = passive1 !== passive2;
    const shardsDiff = shards1 !== shards2;
    const mythicShardsDiff = mythicShards1 !== mythicShards2;
    const xpDiff = xp1 !== xp2;

    const showRank = char && rank1 !== undefined;

    const shouldShowShards = () => {
        if (showShards === RosterSnapshotShowVariableSettings.Always) {
            return true;
        } else if (showShards === RosterSnapshotShowVariableSettings.Never) {
            return false;
        }
        return shardsDiff;
    };

    const shouldShowMythicShards = () => {
        if (showMythicShards === RosterSnapshotShowVariableSettings.Always) {
            return true;
        } else if (showMythicShards === RosterSnapshotShowVariableSettings.Never) {
            return false;
        }
        return mythicShardsDiff;
    };

    const shouldShowXpLevel = () => {
        if (char === undefined) return false;
        if (showXpLevel === RosterSnapshotShowVariableSettings.Always) {
            return true;
        } else if (showXpLevel === RosterSnapshotShowVariableSettings.Never) {
            return false;
        }
        return (diff.xpLevel ?? char?.xpLevel) !== char?.xpLevel;
    };

    const shouldShowAbilities = () => {
        if (showAbilities === RosterSnapshotShowVariableSettings.Always) {
            return true;
        } else if (showAbilities === RosterSnapshotShowVariableSettings.Never) {
            return false;
        }
        return activeDiff || passiveDiff;
    };

    const shouldShowEquipment = () => {
        if (showEquipment === RosterSnapshotShowVariableSettings.Always) {
            return true;
        } else if (showEquipment === RosterSnapshotShowVariableSettings.Never) {
            return false;
        }
        return (
            diff.equip0 !== undefined ||
            diff.equip1 !== undefined ||
            diff.equip2 !== undefined ||
            diff.equip0Level !== undefined ||
            diff.equip1Level !== undefined ||
            diff.equip2Level !== undefined
        );
    };

    const renderEquipment = () => {
        if (!char) return <></>;
        const size = 40;
        const pad = 4;
        const base = staticChar;

        const order: Record<string, number> = {
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

        const renderType = (t?: string) => {
            if (!t) {
                return <div style={{ width: size, height: size }} />;
            }
            const url = getImageUrl(`snowprint_assets/equipment/ui_icon_itemtype_${t.slice(2).toLowerCase()}.png`);
            return (
                <div className="relative" style={{ width: size, height: size }}>
                    <img
                        src={url}
                        className="absolute"
                        style={{ left: pad, top: pad, width: size - pad * 2, height: size - pad * 2 }}
                    />
                </div>
            );
        };

        const renderItem = (item?: IEquipment, level?: number, t?: string) => {
            if (!item) {
                return renderType(t);
            }
            const key =
                `${RarityMapper.rarityToRarityString(item.rarity).toLowerCase()}EquipmentFrame` as keyof typeof tacticusIcons;
            const frame = tacticusIcons[key]?.file ?? '';
            const relic = tacticusIcons.relicEquipmentFrame?.file ?? '';
            const icon = getImageUrl(item.icon ?? '');
            return (
                <div className="relative" style={{ width: size, height: size }}>
                    <img
                        src={icon}
                        className="absolute"
                        style={{
                            left: pad + 4,
                            top: pad + 4,
                            width: size - pad * 2 - 8,
                            height: size - pad * 2 - 8,
                        }}
                    />
                    <img
                        src={frame}
                        className="absolute"
                        style={{
                            left: pad,
                            top: pad - 2,
                            width: size - pad * 2,
                            height: size - pad * 2 + 4,
                        }}
                    />
                    {item.isRelic && (
                        <img
                            src={relic}
                            className="absolute"
                            style={{
                                left: pad,
                                top: pad - 2,
                                width: size - pad * 2,
                                height: size - pad * 2 + 4,
                            }}
                        />
                    )}
                    <div className="absolute top-0 right-0 text-[13px] font-bold text-white">
                        {Math.min(11, Math.max(1, level ?? 1))}
                    </div>
                </div>
            );
        };

        const slots = [
            {
                before: char.equip0,
                beforeLevel: char.equip0Level,
                after: EquipmentService.equipmentData.find(eq => eq.id === diff.equip0) ?? char.equip0,
                afterLevel: diff.equip0Level ?? char.equip0Level,
                type: char.equip0?.type ?? base?.equipment1,
            },
            {
                before: char.equip1,
                beforeLevel: char.equip1Level,
                after: EquipmentService.equipmentData.find(eq => eq.id === diff.equip1) ?? char.equip1,
                afterLevel: diff.equip1Level ?? char.equip1Level,
                type: char.equip1?.type ?? base?.equipment2,
            },
            {
                before: char.equip2,
                beforeLevel: char.equip2Level,
                after: EquipmentService.equipmentData.find(eq => eq.id === diff.equip2) ?? char.equip2,
                afterLevel: diff.equip2Level ?? char.equip2Level,
                type: char.equip2?.type ?? base?.equipment3,
            },
        ].sort(
            (a, b) =>
                (order[a.type ?? ''] ?? Number.MAX_SAFE_INTEGER) - (order[b.type ?? ''] ?? Number.MAX_SAFE_INTEGER)
        );

        return (
            <div className="flex items-center justify-start gap-4">
                {slots.map((slot, i) => {
                    const changed = slot.before !== slot.after || slot.beforeLevel !== slot.afterLevel;
                    return (
                        <div key={i} className="flex items-center gap-0">
                            {renderItem(slot.before, slot.beforeLevel, slot.type)}
                            <ArrowForward style={{ opacity: changed ? 1 : 0 }} fontSize="inherit" />
                            <div style={{ opacity: changed ? 1 : 0 }}>
                                {renderItem(slot.after, slot.afterLevel, slot.type)}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-2 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg transition duration-300 hover:border-blue-500 hover:shadow-xl dark:border-gray-700 dark:bg-gray-800">
            <div className="flex h-28 w-82">
                <div className="relative flex h-full w-18 flex-shrink-0 items-center justify-center bg-gray-100 p-1 dark:bg-gray-900">
                    {(staticChar || staticMow) && <CharacterPortraitImage icon={(staticChar || staticMow)!.icon} />}
                </div>

                <div className="flex flex-grow justify-between p-3 text-gray-900 dark:text-white">
                    <div className="justify-center space-y-1">
                        <ProgressionRow
                            diffFlag={rarityDiff}
                            icon1={<RarityIcon rarity={rarity1} />}
                            icon2={<RarityIcon rarity={rarity2} />}
                        />
                        <ProgressionRow
                            diffFlag={starsDiff}
                            icon1={<StarsIcon stars={stars1} />}
                            icon2={<StarsIcon stars={stars2} />}
                        />
                        {showRank && (
                            <ProgressionRow
                                diffFlag={rankDiff}
                                icon1={<RankIcon rank={rank1!} />}
                                icon2={<RankIcon rank={rank2!} />}
                            />
                        )}
                    </div>

                    <div className="mx-2 w-px bg-gray-200 dark:bg-gray-700"></div>

                    <div className="flex flex-col justify-center space-y-1 text-sm">
                        <div className="grid grid-cols-[auto_auto_auto_auto] items-center gap-x-1">
                            {/* Headers */}
                            <div />
                            <div />
                            <div />
                            <div />

                            {/* Active/Primary Ability Row */}
                            <div className="h-[18px]" />
                            <div />
                            <div />
                            <div />
                            <span
                                className="w-6 text-right font-medium text-gray-600 dark:text-gray-400"
                                style={{ opacity: shouldShowAbilities() ? 1 : 0 }}>
                                {!!char &&
                                    (() => (
                                        <img
                                            src={abilityIcons[staticChar?.activeAbilityName ?? '']?.file}
                                            style={{ width: 24, height: 24 }}
                                        />
                                    ))()}
                                {!!mow &&
                                    (() => (
                                        <img
                                            src={abilityIcons[staticMow?.primaryAbility.name ?? '']?.file}
                                            style={{ width: 24, height: 24 }}
                                        />
                                    ))()}
                            </span>
                            <span
                                className={`w-6 text-center font-extrabold text-blue-500 dark:text-blue-400 ${
                                    shouldShowAbilities() && activeDiff ? '' : 'opacity-0'
                                }`}>
                                {active1}
                            </span>
                            <div
                                className={`flex w-4 justify-center ${shouldShowAbilities() && activeDiff ? '' : 'opacity-0'}`}>
                                <ArrowForward fontSize="inherit" />
                            </div>
                            <span
                                className="w-6 text-center font-extrabold text-blue-500 dark:text-blue-400"
                                style={{ opacity: shouldShowAbilities() ? 1 : 0 }}>
                                {active2}
                            </span>

                            {/* Passive/Secondary Ability Row */}
                            <span
                                className="w-6 text-right font-medium text-gray-600 dark:text-gray-400"
                                style={{ opacity: shouldShowAbilities() ? 1 : 0 }}>
                                {!!char &&
                                    (() => (
                                        <img
                                            src={abilityIcons[staticChar?.passiveAbilityName ?? '']?.file}
                                            style={{ width: 24, height: 24 }}
                                        />
                                    ))()}
                                {!!mow &&
                                    (() => (
                                        <img
                                            src={abilityIcons[staticMow?.secondaryAbility.name ?? '']?.file}
                                            style={{ width: 24, height: 24 }}
                                        />
                                    ))()}
                            </span>
                            <span
                                className={`w-6 text-center font-extrabold text-blue-500 dark:text-blue-400 ${
                                    shouldShowAbilities() && passiveDiff ? '' : 'opacity-0'
                                }`}>
                                {passive1}
                            </span>
                            <div
                                className={`flex w-4 justify-center ${shouldShowAbilities() && passiveDiff ? '' : 'opacity-0'}`}>
                                <ArrowForward fontSize="inherit" />
                            </div>
                            <span
                                className="w-6 text-center font-extrabold text-blue-500 dark:text-blue-400"
                                style={{ opacity: shouldShowAbilities() ? 1 : 0 }}>
                                {passive2}
                            </span>

                            {shouldShowXpLevel() && (
                                <>
                                    <span className="w-6 text-right font-medium text-gray-600 dark:text-gray-400">
                                        XP:
                                    </span>
                                    <span
                                        className={`w-6 text-center font-extrabold text-blue-500 dark:text-blue-400 ${
                                            xpDiff ? '' : 'opacity-0'
                                        }`}>
                                        {char?.xpLevel ?? 0}
                                    </span>
                                    <div className={`flex w-4 justify-center ${xpDiff ? '' : 'opacity-0'}`}>
                                        <ArrowForward fontSize="inherit" />
                                    </div>
                                    <span className="w-6 text-center font-extrabold text-blue-500 dark:text-blue-400">
                                        {diff.xpLevel ?? char?.xpLevel ?? 0}
                                    </span>
                                </>
                            )}

                            {shouldShowShards() && (
                                <>
                                    <div className="w-6 text-right font-medium text-gray-600 dark:text-gray-400">
                                        <MiscIcon icon="shard" width={24} height={20} />
                                    </div>
                                    <span
                                        className={`w-6 text-center font-extrabold text-blue-500 dark:text-blue-400 ${
                                            shardsDiff ? '' : 'opacity-0'
                                        }`}>
                                        {shards1}
                                    </span>
                                    <div className={`flex w-4 justify-center ${shardsDiff ? '' : 'opacity-0'}`}>
                                        <ArrowForward fontSize="inherit" />
                                    </div>
                                    <span className="w-6 text-center font-extrabold text-blue-500 dark:text-blue-400">
                                        {shards2}
                                    </span>
                                </>
                            )}

                            {shouldShowMythicShards() && (
                                <>
                                    <div className="w-6 text-right font-medium text-gray-600 dark:text-gray-400">
                                        <MiscIcon icon="mythicShard" width={24} height={20} />
                                    </div>
                                    <span
                                        className={`w-6 text-center font-extrabold text-blue-500 dark:text-blue-400 ${
                                            mythicShardsDiff ? '' : 'opacity-0'
                                        }`}>
                                        {mythicShards1}
                                    </span>
                                    <div className={`flex w-4 justify-center ${mythicShardsDiff ? '' : 'opacity-0'}`}>
                                        <ArrowForward fontSize="inherit" />
                                    </div>
                                    <span className="w-6 text-center font-extrabold text-blue-500 dark:text-blue-400">
                                        {mythicShards2}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            {shouldShowEquipment() && char && <div className="px-3 py-3">{renderEquipment()}</div>}
        </div>
    );
};
