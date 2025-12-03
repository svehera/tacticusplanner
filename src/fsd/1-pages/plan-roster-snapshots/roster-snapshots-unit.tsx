// eslint-disable-next-line import-x/no-internal-modules
import { CharacterPortraitImage } from '@/v2/components/images/character-portrait.image';

import { RarityIcon, StarsIcon } from '@/fsd/5-shared/ui/icons';

import { CharactersService, RankIcon } from '@/fsd/4-entities/character';
import { MowsService } from '@/fsd/4-entities/mow';

import { ISnapshotCharacter, ISnapshotMachineOfWar } from './models';

interface Props {
    char?: ISnapshotCharacter;
    mow?: ISnapshotMachineOfWar;
}

export const RosterSnapshotsUnit: React.FC<Props> = ({ char, mow }: Props) => {
    const staticChar = char ? CharactersService.resolveCharacter(char.id) : undefined;
    const staticMow = mow ? MowsService.resolveToStatic(mow.id) : undefined;

    return (
        <div className="flex w-80 h-30 dark:bg-gray-800 bg-white rounded-lg shadow-xl overflow-hidden border dark:border-gray-700/50 border-gray-200 transition duration-300 hover:shadow-2xl hover:border-blue-500/50">
            <div className="w-20 h-full flex-shrink-0 relative p-1 dark:bg-gray-900 bg-gray-100 flex items-center justify-center">
                {staticChar && <CharacterPortraitImage icon={staticChar.icon} />}
                {staticMow && <CharacterPortraitImage icon={staticMow.icon} />}
            </div>

            <div className="flex-grow flex p-2 dark:text-white text-gray-900">
                <div className="flex flex-col items-center justify-center space-y-1">
                    {char && (
                        <>
                            <RarityIcon rarity={char.rarity} />
                            <RankIcon rank={char.rank} />
                            <StarsIcon stars={char.stars} />
                        </>
                    )}
                    {mow && (
                        <>
                            <RarityIcon rarity={mow.rarity} />
                            <StarsIcon stars={mow.stars} />
                        </>
                    )}
                </div>
                <div className="flex-grow flex flex-col justify-center items-center px-2"></div>
                <div className="flex flex-col flex-grow space-y-1 justify-center">
                    <div className="flex items-center justify-between text-xs dark:text-gray-300 text-gray-600">
                        <span className="flex items-center space-x-1">
                            {char && <span>Active:</span>}
                            {mow && <span>Primary:</span>}
                        </span>
                        <span className="font-bold dark:text-purple-300 text-purple-700">
                            {char ? char.active : mow!.active}
                        </span>
                    </div>

                    <div className="flex items-center justify-between text-xs dark:text-gray-300 text-gray-600">
                        <span className="flex items-center space-x-1">
                            {char && <span>Passive:</span>}
                            {mow && <span>Secondary:</span>}
                        </span>
                        <span className="font-bold dark:text-purple-300 text-purple-700">
                            {char ? char.passive : mow!.passive}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};
