import { ExpandMore } from '@mui/icons-material';
import { Accordion, AccordionDetails, AccordionSummary } from '@mui/material';
import { sum } from 'lodash';
import { isMobile } from 'react-device-detect';

import { MiscIcon } from '@/fsd/5-shared/ui/icons';

import { IUpgradeRaid } from '@/fsd/3-features/goals/goals.models';
import { MaterialItemInput } from '@/fsd/3-features/goals/material-item-input';

interface Props {
    raids: IUpgradeRaid[];
    bonusRaids: IUpgradeRaid[];
}

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

    return (
        <>
            <Accordion defaultExpanded={true}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                    <p style={{ fontSize: isMobile ? 16 : 20 }}>
                        Today (<b>{energySpent}</b> <MiscIcon icon={'energy'} height={15} width={15} /> spent |{' '}
                        <b>{raidsCount}</b> raids done)
                    </p>
                </AccordionSummary>
                <AccordionDetails>
                    <div className="mt-2.5 flex flex-wrap items-start justify-center gap-2">
                        {upgradesRaids.map((raid, index) => (
                            <div
                                className="bg-overlay w-[240px] overflow-hidden rounded-lg p-2 shadow-md"
                                key={raid.id + '-' + index}>
                                <MaterialItemInput upgradeRaid={raid} />
                            </div>
                        ))}
                        {completedRaids.map((raid, index) => (
                            <div
                                className="bg-overlay w-[240px] overflow-hidden rounded-lg p-2 shadow-md"
                                key={raid.id + '-' + index}>
                                <MaterialItemInput
                                    upgradeRaid={{ ...raid, relatedCharacters: [] }}
                                    isExhausted={true}
                                />
                            </div>
                        ))}
                    </div>
                </AccordionDetails>
            </Accordion>
            <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                    <p style={{ fontSize: isMobile ? 16 : 20 }}>
                        Bonus Raids (when you have extra energy <MiscIcon icon={'energy'} height={15} width={15} />)
                    </p>
                </AccordionSummary>
                <AccordionDetails>
                    <div className="mt-2.5 flex flex-wrap items-start justify-center gap-2">
                        {bonusRaids.map((raid, index) => (
                            <div
                                className="bg-overlay w-[240px] overflow-hidden rounded-lg p-2 shadow-md"
                                key={raid.id + '-' + index}>
                                <MaterialItemInput upgradeRaid={raid} />
                            </div>
                        ))}
                    </div>
                </AccordionDetails>
            </Accordion>
        </>
    );
};
