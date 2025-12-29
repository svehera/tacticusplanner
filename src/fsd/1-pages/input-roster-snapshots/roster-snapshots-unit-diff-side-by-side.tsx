import { ArrowForward } from '@mui/icons-material';

import { Rank } from '@/fsd/5-shared/model';

import { CharactersService } from '@/fsd/4-entities/character';
import { MowsService } from '@/fsd/4-entities/mow';

// eslint-disable-next-line import-x/no-internal-modules
import { RosterSnapshotShowVariableSettings } from '@/fsd/3-features/view-settings/model';

import { ISnapshotCharacter, ISnapshotMachineOfWar, ISnapshotUnitDiff } from './models';
import { RosterSnapshotCharacter } from './roster-snapshot-character';

interface Props {
    showShards: RosterSnapshotShowVariableSettings;
    showMythicShards: RosterSnapshotShowVariableSettings;
    showXpLevel: RosterSnapshotShowVariableSettings;
    char?: ISnapshotCharacter;
    mow?: ISnapshotMachineOfWar;
    diff: ISnapshotUnitDiff;
}

export const RosterSnapshotsUnitDiffSideBySide: React.FC<Props> = ({
    showShards,
    showMythicShards,
    showXpLevel,
    char,
    mow,
    diff,
}: Props) => {
    const staticChar = char ? CharactersService.resolveCharacter(char.id) : undefined;
    const staticMow = mow ? MowsService.resolveToStatic(mow.id) : undefined;

    return (
        <div className="flex w-56 170px dark:bg-gray-800 bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 transition duration-300 hover:shadow-xl hover:border-blue-500">
            <div className="w-1"></div>
            <div className="w-[96px] h-[170px]">
                <RosterSnapshotCharacter
                    showShards={showShards}
                    showMythicShards={showMythicShards}
                    showXpLevel={showXpLevel}
                    char={char}
                    charData={staticChar}
                    mow={mow}
                    mowData={staticMow}
                />
            </div>
            <div className="flex items-center px-0">
                <ArrowForward className="text-gray-500" />
            </div>
            <RosterSnapshotCharacter
                showShards={showShards}
                showMythicShards={showMythicShards}
                showXpLevel={showXpLevel}
                char={
                    staticChar == undefined
                        ? undefined
                        : {
                              id: char!.id,
                              rarity: diff.rarity ?? char!.rarity,
                              stars: diff.stars ?? char!.stars,
                              rank: diff.rank ?? (char ? char.rank : Rank.Locked),
                              activeAbilityLevel: diff.active ?? char?.activeAbilityLevel ?? 1,
                              passiveAbilityLevel: diff.passive ?? char?.passiveAbilityLevel ?? 1,
                              level: diff.level ?? (char ? char.level : 0),
                              shards: diff.shards ?? char!.shards,
                              mythicShards: diff.mythicShards ?? char!.mythicShards,
                          }
                }
                charData={staticChar}
                mow={
                    staticMow == undefined
                        ? undefined
                        : {
                              id: mow!.id,
                              rarity: diff.rarity ?? mow!.rarity,
                              stars: diff.stars ?? mow!.stars,
                              primaryAbilityLevel: diff.active ?? mow!.primaryAbilityLevel ?? 1,
                              secondaryAbilityLevel: diff.passive ?? mow!.secondaryAbilityLevel ?? 1,
                              locked: false,
                              shards: diff.shards ?? mow!.shards,
                              mythicShards: diff.mythicShards ?? mow!.mythicShards,
                          }
                }
                mowData={staticMow}
            />
        </div>
    );
};
