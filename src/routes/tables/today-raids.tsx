import { sum } from 'lodash';
import { FC, lazy, Suspense } from 'react';

import { Accordion, AccordionHeader, AccordionBody } from '@/fsd/5-shared/ui';
import { MiscIcon } from '@/fsd/5-shared/ui/icons';

import { IUpgradeRaid } from '@/fsd/3-features/goals/goals.models';

const RaidUpgradeMaterialCard = lazy(() =>
    import('@/routes/tables/raid-upgrade-material-card').then(m => ({ default: m.RaidUpgradeMaterialCard }))
);

interface Props {
    raids: IUpgradeRaid[];
    bonusRaids: IUpgradeRaid[];
}

const isShardRaid = (raid: IUpgradeRaid) => raid.rarity === 'Shard' || raid.rarity === 'Mythic Shard';

export const TodayRaids: FC<Props> = ({ raids, bonusRaids }) => {
    const locs = raids.flatMap(raid => raid.raidLocations);
    const energySpent = sum(locs.map(loc => loc.raidsAlreadyPerformed * loc.energyCost));
    const raidsCount = sum(locs.map(loc => loc.raidsAlreadyPerformed));

    const completedRaids = raids
        .filter(raid => raid.raidLocations.length > 0)
        .filter(raid => raid.raidLocations.every(loc => loc.raidsToPerform === 0));
    const upgradesRaids = raids
        .filter(raid => raid.raidLocations.length > 0)
        .filter(raid => raid.raidLocations.some(loc => loc.raidsToPerform > 0));
    const completedMaterialRaids = completedRaids.filter(raid => !isShardRaid(raid));
    const completedShardRaids = completedRaids.filter(raid => isShardRaid(raid));

    return (
        <>
            <Accordion defaultExpanded className="mt-2">
                <AccordionHeader>
                    <span className="text-sm font-semibold sm:text-base">
                        Today (<b>{energySpent}</b> <MiscIcon icon={'energy'} height={15} width={15} /> spent |{' '}
                        <b>{raidsCount}</b> raids done)
                    </span>
                </AccordionHeader>
                <AccordionBody>
                    <Suspense fallback={undefined}>
                        <div className="m-2.5 flex flex-wrap items-start justify-center gap-2">
                            {upgradesRaids.map((raid, index) => (
                                <RaidUpgradeMaterialCard
                                    key={raid.id + '-' + index}
                                    upgradeEstimate={raid}
                                    showRelatedCharacters={false}
                                    showAdditionalInfo={false}
                                    showPlannedRaidLocationsOnly={true}
                                />
                            ))}
                            {completedMaterialRaids.map((raid, index) => (
                                <RaidUpgradeMaterialCard
                                    key={raid.id + '-' + index}
                                    upgradeEstimate={raid}
                                    showRelatedCharacters={false}
                                    showAdditionalInfo={false}
                                    showPlannedRaidLocationsOnly={true}
                                />
                            ))}
                            {completedShardRaids.map((raid, index) => (
                                <RaidUpgradeMaterialCard
                                    key={raid.id + '-' + index}
                                    upgradeEstimate={raid}
                                    showRelatedCharacters={false}
                                    showAdditionalInfo={false}
                                    showPlannedRaidLocationsOnly={true}
                                />
                            ))}
                        </div>
                    </Suspense>
                </AccordionBody>
            </Accordion>
            <Accordion className="my-5">
                <AccordionHeader>
                    <span className="text-sm font-semibold sm:text-base">
                        Bonus Raids (when you have extra energy <MiscIcon icon={'energy'} height={15} width={15} />)
                    </span>
                </AccordionHeader>
                <AccordionBody>
                    <Suspense fallback={undefined}>
                        <div className="m-2.5 flex flex-wrap items-start justify-center gap-2">
                            {bonusRaids.map((raid, index) => (
                                <RaidUpgradeMaterialCard
                                    key={raid.id + '-' + index}
                                    upgradeEstimate={raid}
                                    showRelatedCharacters={false}
                                    showAdditionalInfo={false}
                                    showPlannedRaidLocationsOnly={true}
                                />
                            ))}
                        </div>
                    </Suspense>
                </AccordionBody>
            </Accordion>
        </>
    );
};
