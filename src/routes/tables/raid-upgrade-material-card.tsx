import { FC, Suspense, lazy } from 'react';

import { Rarity } from '@/fsd/5-shared/model/enums/rarity.enum';
import { RarityMapper } from '@/fsd/5-shared/model/mappers/rarity.mapper';
import { UnitShardIcon } from '@/fsd/5-shared/ui/icons';

import { CharactersService } from '@/fsd/4-entities/character';
import { mows2Data } from '@/fsd/4-entities/mow';
import { UpgradeImage } from '@/fsd/4-entities/upgrade';

import { ICharacterUpgradeEstimate, IItemRaidLocation } from '@/fsd/3-features/goals/goals.models';
import { getDisplayName } from '@/fsd/3-features/goals/raid-day-helpers';
import { RaidLocations } from '@/fsd/3-features/goals/raid-locations';

const MaterialEstimatesRow = lazy(() => import('./material-estimates-row'));

interface Props {
    showRelatedCharacters?: boolean;
    showAdditionalInfo?: boolean;
    maxLocations?: number;
    upgradeEstimate: ICharacterUpgradeEstimate;
    widthClass?: string;
    compactRaidLocations?: boolean;
    showPlannedRaidLocationsOnly?: boolean;
}

const mowMap = new Map(mows2Data.mows.map(m => [m.snowprintId, m]));

const mapUpgradeRarity = (rarity: Rarity | 'Shard' | 'Mythic Shard'): Rarity => {
    return typeof rarity === 'number' ? rarity : Rarity.Common;
};

const resolveUnit = (id: string) => {
    const char = CharactersService.getUnit(id);
    if (char) return { name: char.name, icon: char.roundIcon };
    const mow = mowMap.get(id);
    if (mow) return { name: mow.name, icon: mow.roundIcon };
    return;
};

const hasRaidLocations = (
    estimate: ICharacterUpgradeEstimate
): estimate is ICharacterUpgradeEstimate & { raidLocations: IItemRaidLocation[] } => {
    return (
        'raidLocations' in estimate &&
        Array.isArray((estimate as { raidLocations?: IItemRaidLocation[] }).raidLocations)
    );
};

export const RaidUpgradeMaterialCard: FC<Props> = ({
    showRelatedCharacters = true,
    showAdditionalInfo = true,
    maxLocations,
    upgradeEstimate,
    widthClass = 'w-76',
    compactRaidLocations = true,
    showPlannedRaidLocationsOnly = false,
}) => {
    const isShard = upgradeEstimate.rarity === 'Shard';
    const isMythicShard = upgradeEstimate.rarity === 'Mythic Shard';

    const materialId = isShard
        ? upgradeEstimate.snowprintId.slice(7)
        : isMythicShard
          ? upgradeEstimate.snowprintId.slice(13)
          : upgradeEstimate.snowprintId;

    const resolvedUnit = isShard || isMythicShard ? resolveUnit(materialId) : undefined;

    const name =
        isShard || isMythicShard
            ? isMythicShard
                ? `${resolvedUnit?.name ?? materialId} (Mythic)`
                : (resolvedUnit?.name ?? materialId)
            : upgradeEstimate.label;

    const displayedLocations =
        showPlannedRaidLocationsOnly && hasRaidLocations(upgradeEstimate)
            ? upgradeEstimate.raidLocations
            : upgradeEstimate.locations;

    const hasSuggestedRaidsRemaining = hasRaidLocations(upgradeEstimate)
        ? upgradeEstimate.raidLocations.some(loc => loc.raidsToPerform > 0)
        : displayedLocations.some(loc => loc.isSuggested && (loc.isUnlocked ?? true));

    const noSuggestedRaidsRemaining = !hasSuggestedRaidsRemaining;

    const tooltipContent =
        upgradeEstimate.relatedCharacters.length > 0 ? (
            <div>
                {name}
                <ul className="ps-[15px]">
                    {upgradeEstimate.relatedCharacters.map(id => (
                        <li key={id}>{getDisplayName(id)}</li>
                    ))}
                </ul>
            </div>
        ) : (
            name
        );

    const icon =
        isShard || isMythicShard ? (
            resolvedUnit ? (
                <UnitShardIcon
                    name={upgradeEstimate.snowprintId}
                    icon={resolvedUnit.icon}
                    mythic={isMythicShard}
                    tooltip={tooltipContent}
                />
            ) : (
                materialId
            )
        ) : (
            <UpgradeImage
                material={upgradeEstimate.label}
                iconPath={upgradeEstimate.iconPath}
                rarity={RarityMapper.rarityToRarityString(mapUpgradeRarity(upgradeEstimate.rarity))}
                tooltip={tooltipContent}
            />
        );

    const isSufficient = upgradeEstimate.acquiredCount >= upgradeEstimate.requiredCount;
    const flooredAcquiredCount = Math.min(Math.floor(upgradeEstimate.acquiredCount), upgradeEstimate.requiredCount);
    const characterIconHeight = 24;

    return (
        <div
            className={`flex flex-col justify-between rounded-lg border p-3 shadow-lg ${widthClass} border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--card-fg)] ${
                noSuggestedRaidsRemaining ? 'opacity-80' : ''
            }`.trim()}>
            <div className="flex w-full flex-row items-start! text-inherit">
                {/* Left: Icon, quantity */}
                <div
                    className={`flex w-14 shrink-0 flex-col items-center justify-start gap-1 ${
                        noSuggestedRaidsRemaining ? 'opacity-70' : ''
                    }`}>
                    <div className="mt-2 flex h-10 w-10 items-center justify-center">{icon}</div>
                    <span
                        className={`mt-1 flex h-6 items-center text-sm font-bold text-inherit ${
                            noSuggestedRaidsRemaining
                                ? 'opacity-70'
                                : showPlannedRaidLocationsOnly
                                  ? ''
                                  : isSufficient
                                    ? 'text-green-400'
                                    : 'text-red-400'
                        }`}>
                        {flooredAcquiredCount}/{upgradeEstimate.requiredCount}
                    </span>
                </div>

                {/* Right: Content */}
                <div className="flex min-w-0 flex-1 flex-col justify-start gap-2 pl-2">
                    <div className="flex items-center justify-between gap-1">
                        <h4 className={`mb-0 truncate text-xs font-normal text-inherit`}>
                            {name ?? upgradeEstimate.snowprintId}
                        </h4>
                    </div>
                    {showRelatedCharacters && upgradeEstimate.relatedCharacters.length > 0 && (
                        <div
                            className={`flex flex-row items-center gap-1 ${
                                noSuggestedRaidsRemaining ? 'opacity-70' : ''
                            }`}>
                            {upgradeEstimate.relatedCharacters.map(id => (
                                <UnitShardIcon
                                    key={id}
                                    icon={
                                        CharactersService.getUnit(id)?.roundIcon ??
                                        mows2Data.mows.find(m => id === m.name)?.roundIcon ??
                                        id
                                    }
                                    height={characterIconHeight}
                                    width={characterIconHeight}
                                />
                            ))}
                        </div>
                    )}
                    <div className={`flex flex-1 items-start ${noSuggestedRaidsRemaining ? 'opacity-75' : ''}`}>
                        <RaidLocations
                            locations={displayedLocations}
                            maxLocations={maxLocations}
                            compactRaidLocations={compactRaidLocations}
                        />
                    </div>
                </div>
            </div>
            {/* Estimates row at the bottom of the card */}
            {showAdditionalInfo && (
                <div className="mt-2">
                    <Suspense fallback={undefined}>
                        <MaterialEstimatesRow estimate={upgradeEstimate} />
                    </Suspense>
                </div>
            )}
        </div>
    );
};
