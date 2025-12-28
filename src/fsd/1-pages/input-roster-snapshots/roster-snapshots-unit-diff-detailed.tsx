import { ArrowForward } from '@mui/icons-material';

// eslint-disable-next-line import-x/no-internal-modules
import { CharacterPortraitImage } from '@/v2/components/images/character-portrait.image';

import { MiscIcon, RarityIcon, StarsIcon } from '@/fsd/5-shared/ui/icons';

import { CharactersService, RankIcon } from '@/fsd/4-entities/character';
import { MowsService } from '@/fsd/4-entities/mow';

// eslint-disable-next-line import-x/no-internal-modules
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
        <div className="flex justify-center items-center h-6 w-10">
            {diffFlag ? icon1 : <span className="opacity-0">{icon1}</span>}
        </div>
        <div className="flex justify-center items-center h-6 w-4">{diffFlag && <ArrowForward />}</div>
        <div className="flex justify-center items-center h-6 w-10">{diffFlag ? icon2 : icon1}</div>
    </div>
);

interface Props {
    showShards: RosterSnapshotShowVariableSettings;
    showMythicShards: RosterSnapshotShowVariableSettings;
    showXpLevel: RosterSnapshotShowVariableSettings;
    char?: ISnapshotCharacter;
    mow?: ISnapshotMachineOfWar;
    diff: ISnapshotUnitDiff;
}

export const RosterSnapshotsUnitDiffDetailed: React.FC<Props> = ({
    showShards,
    showMythicShards,
    showXpLevel,
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

    // Difference flags
    const rarityDiff = rarity1 !== rarity2;
    const starsDiff = stars1 !== stars2;
    const rankDiff = rank1 !== rank2;
    const activeDiff = active1 !== active2;
    const passiveDiff = passive1 !== passive2;
    const shardsDiff = shards1 !== shards2;
    const mythicShardsDiff = mythicShards1 !== mythicShards2;

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

    return (
        <div className="flex w-82 h-28 dark:bg-gray-800 bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 transition duration-300 hover:shadow-xl hover:border-blue-500">
            <div className="w-18 h-full flex-shrink-0 relative p-1 dark:bg-gray-900 bg-gray-100 flex items-center justify-center">
                {(staticChar || staticMow) && <CharacterPortraitImage icon={(staticChar || staticMow)!.icon} />}
            </div>

            <div className="flex-grow flex p-3 dark:text-white text-gray-900 justify-between">
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
                        <span className="w-6 text-right font-medium text-gray-600 dark:text-gray-400">
                            {char ? 'A' : 'P'}:
                        </span>
                        <span
                            className={`w-6 text-center font-extrabold text-blue-500 dark:text-blue-400 ${
                                activeDiff ? '' : 'opacity-0'
                            }`}>
                            {active1}
                        </span>
                        <div className={`w-4 flex justify-center ${activeDiff ? '' : 'opacity-0'}`}>
                            <ArrowForward fontSize="inherit" />
                        </div>
                        <span className="w-6 text-center font-extrabold text-blue-500 dark:text-blue-400">
                            {active2}
                        </span>

                        {/* Passive/Secondary Ability Row */}
                        <span className="w-6 text-right font-medium text-gray-600 dark:text-gray-400">
                            {char ? 'P' : 'S'}:
                        </span>
                        <span
                            className={`w-6 text-center font-extrabold text-blue-500 dark:text-blue-400 ${
                                passiveDiff ? '' : 'opacity-0'
                            }`}>
                            {passive1}
                        </span>
                        <div className={`w-4 flex justify-center ${passiveDiff ? '' : 'opacity-0'}`}>
                            <ArrowForward fontSize="inherit" />
                        </div>
                        <span className="w-6 text-center font-extrabold text-blue-500 dark:text-blue-400">
                            {passive2}
                        </span>

                        {shouldShowXpLevel() && (
                            <>
                                <span className="w-6 text-right font-medium text-gray-600 dark:text-gray-400">XP:</span>
                                <span
                                    className={`w-6 text-center font-extrabold text-blue-500 dark:text-blue-400 ${
                                        (diff.xpLevel ?? char?.xpLevel ?? 0) !== char?.xpLevel ? '' : 'opacity-0'
                                    }`}>
                                    {char?.xpLevel ?? 0}
                                </span>
                                <div
                                    className={`w-4 flex justify-center ${
                                        (diff.xpLevel ?? char?.xpLevel ?? 0) !== (char?.xpLevel ?? 0) ? '' : 'opacity-0'
                                    }`}>
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
                                    <MiscIcon icon="shard" width={20} height={20} />
                                </div>
                                <span
                                    className={`w-6 text-center font-extrabold text-blue-500 dark:text-blue-400 ${
                                        shardsDiff ? '' : 'opacity-0'
                                    }`}>
                                    {shards1}
                                </span>
                                <div className={`w-4 flex justify-center ${shardsDiff ? '' : 'opacity-0'}`}>
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
                                    <MiscIcon icon="mythicShard" width={20} height={20} />
                                </div>
                                <span
                                    className={`w-6 text-center font-extrabold text-blue-500 dark:text-blue-400 ${
                                        mythicShardsDiff ? '' : 'opacity-0'
                                    }`}>
                                    {mythicShards1}
                                </span>
                                <div className={`w-4 flex justify-center ${mythicShardsDiff ? '' : 'opacity-0'}`}>
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
    );
};
