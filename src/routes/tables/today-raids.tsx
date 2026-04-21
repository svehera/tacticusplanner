import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { Accordion, AccordionDetails, AccordionSummary } from '@mui/material';
import { sum } from 'lodash';

import { RaidUpgradeMaterialCard } from '@/routes/tables/raid-upgrade-material-card';

import { MiscIcon } from '@/fsd/5-shared/ui/icons';

import { IUpgradeRaid } from '@/fsd/3-features/goals/goals.models';

interface Props {
    raids: IUpgradeRaid[];
    bonusRaids: IUpgradeRaid[];
}

const isShardRaid = (raid: IUpgradeRaid) => raid.rarity === 'Shard' || raid.rarity === 'Mythic Shard';

export const TodayRaids: React.FC<Props> = ({ raids, bonusRaids }: Props) => {
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
            <Accordion
                defaultExpanded={true}
                disableGutters
                className="mt-2 overflow-hidden rounded-xl! border border-(--border) bg-transparent shadow-none">
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon className="text-(--muted-fg)" />}
                    className="px-4 py-0 [&_.MuiAccordionSummary-content]:my-1.5">
                    <span className="text-sm font-semibold sm:text-base">
                        Today (<b>{energySpent}</b> <MiscIcon icon={'energy'} height={15} width={15} /> spent |{' '}
                        <b>{raidsCount}</b> raids done)
                    </span>
                </AccordionSummary>
                <AccordionDetails className="px-4 pt-0 pb-4">
                    <div className="m-2.5 flex flex-wrap items-start justify-center gap-2">
                        {upgradesRaids.map((raid, index) => (
                            <RaidUpgradeMaterialCard
                                key={raid.id + '-' + index}
                                index={index}
                                upgradeEstimate={raid}
                                showRelatedCharacters={false}
                                showAdditionalInfo={false}
                                showPlannedRaidLocationsOnly={true}
                            />
                        ))}
                        {completedMaterialRaids.map((raid, index) => (
                            <RaidUpgradeMaterialCard
                                key={raid.id + '-' + index}
                                index={index}
                                upgradeEstimate={raid}
                                showRelatedCharacters={false}
                                showAdditionalInfo={false}
                                showPlannedRaidLocationsOnly={true}
                            />
                        ))}
                        {completedShardRaids.map((raid, index) => (
                            <RaidUpgradeMaterialCard
                                key={raid.id + '-' + index}
                                index={index}
                                upgradeEstimate={raid}
                                showRelatedCharacters={false}
                                showAdditionalInfo={false}
                                showPlannedRaidLocationsOnly={true}
                            />
                        ))}
                    </div>
                </AccordionDetails>
            </Accordion>
            <Accordion
                disableGutters
                className="my-5 overflow-hidden rounded-xl! border border-(--border) bg-transparent shadow-none">
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon className="text-(--muted-fg)" />}
                    className="px-4 py-0 [&_.MuiAccordionSummary-content]:my-1.5">
                    <span className="text-sm font-semibold sm:text-base">
                        Bonus Raids (when you have extra energy <MiscIcon icon={'energy'} height={15} width={15} />)
                    </span>
                </AccordionSummary>
                <AccordionDetails className="px-4 pt-0 pb-4">
                    <div className="m-2.5 flex flex-wrap items-start justify-center gap-2">
                        {bonusRaids.map((raid, index) => (
                            <RaidUpgradeMaterialCard
                                key={raid.id + '-' + index}
                                index={index}
                                upgradeEstimate={raid}
                                showRelatedCharacters={false}
                                showAdditionalInfo={false}
                                showPlannedRaidLocationsOnly={true}
                            />
                        ))}
                    </div>
                </AccordionDetails>
            </Accordion>
        </>
    );
};
