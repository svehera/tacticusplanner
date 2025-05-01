import FilterAltIcon from '@mui/icons-material/FilterAlt';
import { Badge, DialogActions, DialogContent, DialogTitle, IconButton } from '@mui/material';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import React, { useMemo } from 'react';

import { Alliance, CampaignType, Faction, Rarity, RarityString } from 'src/models/enums';
import { IDailyRaidsFilters } from 'src/models/interfaces';
import { MultipleSelectCheckmarks } from 'src/routes/characters/multiple-select';
import factionsData from 'src/v2/data/factions.json';

import { CampaignsService } from 'src/v2/features/goals/campaigns.service';

interface Props {
    filter: IDailyRaidsFilters;
    filtersChange: (value: IDailyRaidsFilters) => void;
}

export const LocationsFilter: React.FC<Props> = ({ filter, filtersChange }) => {
    const [currFilter, setCurrFilter] = React.useState<IDailyRaidsFilters>(filter);
    const [open, setOpen] = React.useState<boolean>(false);

    const allFactions = useMemo(
        () => factionsData.map(x => ({ alliance: x.alliance as Alliance, faction: x.name as Faction })),
        []
    );

    const enemiesTypeOptions = useMemo(() => CampaignsService.getPossibleEnemiesTypes(), []);
    const enemiesCountOptions = useMemo(() => CampaignsService.getPossibleEnemiesCount().map(x => x.toString()), []);

    const filtersCount =
        +!!filter.enemiesAlliance.length +
        +!!filter.alliesAlliance.length +
        +!!filter.alliesFactions.length +
        +!!filter.enemiesFactions.length +
        +!!filter.upgradesRarity.length +
        +!!filter.slotsCount?.length +
        +!!filter.enemiesTypes?.length +
        +!!filter.enemiesCount?.length +
        +!!filter.campaignTypes.length;

    const handleClick = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setCurrFilter(filter);
    };

    const saveChanges = () => {
        filtersChange(currFilter);
        setOpen(false);
    };

    const resetFilters = () => {
        filtersChange({
            alliesFactions: [],
            alliesAlliance: [],
            enemiesFactions: [],
            enemiesAlliance: [],
            campaignTypes: [],
            upgradesRarity: [],
            slotsCount: [],
            enemiesTypes: [],
            enemiesCount: [],
        });
        setCurrFilter({
            alliesFactions: [],
            alliesAlliance: [],
            enemiesFactions: [],
            enemiesAlliance: [],
            campaignTypes: [],
            upgradesRarity: [],
            slotsCount: [],
            enemiesTypes: [],
            enemiesCount: [],
        });
        setOpen(false);
    };

    const renderUnitsFilter = (type: 'allies' | 'enemies', alliance: Alliance[], factions: Faction[]) => {
        const allowedFactions = !alliance.length
            ? allFactions.map(x => x.faction)
            : allFactions.filter(x => alliance.includes(x.alliance)).map(x => x.faction);

        const allianceFilterChanged = (values: string[]) => {
            if (type === 'allies') {
                setCurrFilter({ ...currFilter, alliesAlliance: values as Alliance[] });
            }

            if (type === 'enemies') {
                setCurrFilter({ ...currFilter, enemiesAlliance: values as Alliance[] });
            }
        };

        const factionsFilterChanged = (values: string[]) => {
            if (type === 'allies') {
                setCurrFilter({ ...currFilter, alliesFactions: values as Faction[] });
            }

            if (type === 'enemies') {
                setCurrFilter({ ...currFilter, enemiesFactions: values as Faction[] });
            }
        };

        return (
            <div className="flex items-center gap-3">
                <MultipleSelectCheckmarks
                    size="small"
                    placeholder="Alliances"
                    selectedValues={alliance}
                    values={Object.values(Alliance)}
                    selectionChanges={allianceFilterChanged}
                    disableCloseOnSelect={false}
                    minWidth={150}
                />

                <MultipleSelectCheckmarks
                    sortByAlphabet
                    size="small"
                    placeholder="Factions"
                    selectedValues={factions}
                    values={allowedFactions}
                    selectionChanges={factionsFilterChanged}
                    disableCloseOnSelect={false}
                    minWidth={150}
                />
            </div>
        );
    };

    return (
        <>
            <IconButton onClick={handleClick}>
                <Badge color="warning" badgeContent={filtersCount}>
                    <FilterAltIcon />
                </Badge>
            </IconButton>
            <Dialog open={open} onClose={handleClose} fullWidth>
                <DialogTitle>Raids Filters</DialogTitle>
                <DialogContent>
                    <h5>Allies</h5>
                    {renderUnitsFilter('allies', currFilter.alliesAlliance, currFilter.alliesFactions)}

                    <h5>Enemies</h5>
                    {renderUnitsFilter('enemies', currFilter.enemiesAlliance, currFilter.enemiesFactions)}

                    <div className="flex items-center gap-3" style={{ marginTop: 10 }}>
                        <MultipleSelectCheckmarks
                            size="small"
                            placeholder="Enemies Count"
                            selectedValues={currFilter.enemiesCount?.map(x => x.toString()) ?? []}
                            values={enemiesCountOptions}
                            selectionChanges={values => {
                                setCurrFilter({ ...currFilter, enemiesCount: values.map(x => +x) });
                            }}
                            disableCloseOnSelect={false}
                            minWidth={150}
                        />

                        <MultipleSelectCheckmarks
                            size="small"
                            placeholder="Enemies Types"
                            selectedValues={currFilter.enemiesTypes ?? []}
                            values={enemiesTypeOptions}
                            selectionChanges={values => {
                                setCurrFilter({ ...currFilter, enemiesTypes: values });
                            }}
                            disableCloseOnSelect={false}
                            minWidth={150}
                        />
                    </div>

                    <h5>Locations</h5>
                    <div className="flex items-center gap-3">
                        <MultipleSelectCheckmarks
                            size="small"
                            placeholder="Types"
                            selectedValues={currFilter.campaignTypes}
                            values={[
                                CampaignType.Elite,
                                CampaignType.Extremis,
                                CampaignType.Mirror,
                                CampaignType.Normal,
                                CampaignType.Early,
                            ]}
                            selectionChanges={values => {
                                setCurrFilter({ ...currFilter, campaignTypes: values as CampaignType[] });
                            }}
                            disableCloseOnSelect={false}
                            minWidth={150}
                        />

                        <MultipleSelectCheckmarks
                            size="small"
                            placeholder="Slots"
                            selectedValues={currFilter.slotsCount?.map(x => x.toString()) ?? []}
                            values={['3', '4', '5']}
                            selectionChanges={values => {
                                setCurrFilter({ ...currFilter, slotsCount: values.map(x => +x) });
                            }}
                            disableCloseOnSelect={false}
                            minWidth={150}
                        />
                    </div>

                    <h5>Upgrades</h5>
                    <MultipleSelectCheckmarks
                        size="small"
                        placeholder="Rarity"
                        selectedValues={currFilter.upgradesRarity.map(x => Rarity[x])}
                        values={Object.values(RarityString)}
                        selectionChanges={values => {
                            setCurrFilter({
                                ...currFilter,
                                upgradesRarity: values.map(x => +Rarity[x as unknown as number]),
                            });
                        }}
                        disableCloseOnSelect={false}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Close</Button>
                    <Button onClick={resetFilters} variant="outlined" color="error">
                        Reset
                    </Button>
                    <Button onClick={saveChanges} variant="outlined" color="success">
                        Apply
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};
