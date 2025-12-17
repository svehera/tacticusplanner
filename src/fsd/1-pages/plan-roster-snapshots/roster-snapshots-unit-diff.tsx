import { ArrowForward } from '@mui/icons-material';

// eslint-disable-next-line import-x/no-internal-modules
import { CharacterPortraitImage } from '@/v2/components/images/character-portrait.image';

import { RarityIcon, StarsIcon } from '@/fsd/5-shared/ui/icons';

import { CharactersService, RankIcon } from '@/fsd/4-entities/character';
import { MowsService } from '@/fsd/4-entities/mow';

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

interface AbilityRowProps {
    label: string;
    level1: number;
    level2: number;
    diffFlag: boolean;
}

const AbilityRow: React.FC<AbilityRowProps> = ({ label, level1, level2, diffFlag }: AbilityRowProps) => (
    <div className="flex items-center space-x-2 text-sm">
        <span className="w-6 text-right font-medium text-gray-600 dark:text-gray-400">{label}:</span>
        <div className="flex items-center space-x-1">
            {/* Before Level (only shown if different) */}
            {diffFlag && (
                <>
                    <span className="font-extrabold text-blue-500 dark:text-blue-400">{level1}</span>
                    <div className="w-4 flex justify-center">
                        <ArrowForward />
                    </div>
                </>
            )}
            {/* After Level */}
            <span className="font-extrabold text-blue-500 dark:text-blue-400">{level2}</span>
        </div>
    </div>
);

interface Props {
    char?: ISnapshotCharacter;
    mow?: ISnapshotMachineOfWar;
    diff: ISnapshotUnitDiff;
}
export const RosterSnapshotsUnitDiff: React.FC<Props> = ({ char, mow, diff }: Props) => {
    const staticChar = char ? CharactersService.resolveCharacter(char.id) : undefined;
    const staticMow = mow ? MowsService.resolveToStatic(mow.id) : undefined;
    const unit = char || mow; // The base unit (Character or MoW)

    // Derived properties for comparison
    const rarity1 = char ? char.rarity : mow!.rarity;
    const rarity2 = diff.rarity ?? rarity1;
    const stars1 = char ? char.stars : mow!.stars;
    const stars2 = diff.stars ?? stars1;
    const rank1 = char ? char.rank : undefined;
    const rank2 = diff.rank ?? rank1;
    const active1 = unit!.active;
    const active2 = diff.active ?? active1;
    const passive1 = unit!.passive;
    const passive2 = diff.passive ?? passive1;

    // Difference flags
    const rarityDiff = rarity1 !== rarity2;
    const starsDiff = stars1 !== stars2;
    const rankDiff = rank1 !== rank2;
    const activeDiff = active1 !== active2;
    const passiveDiff = passive1 !== passive2;

    const showRank = char && rank1 !== undefined;

    return (
        <div className="flex w-78 h-24 dark:bg-gray-800 bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 transition duration-300 hover:shadow-xl hover:border-blue-500">
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

                <div className="flex flex-col justify-center space-y-2">
                    <AbilityRow label={char ? 'A' : 'P'} level1={active1} level2={active2} diffFlag={activeDiff} />
                    <AbilityRow label={char ? 'P' : 'S'} level1={passive1} level2={passive2} diffFlag={passiveDiff} />
                </div>
            </div>
        </div>
    );
};
