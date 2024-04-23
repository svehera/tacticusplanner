import React, { useMemo } from 'react';
import { Badge, DialogActions, DialogContent, DialogTitle, IconButton, Popover } from '@mui/material';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import { IDailyRaidsFilters } from 'src/models/interfaces';
import Button from '@mui/material/Button';
import { Alliance, CampaignType, Faction, Rarity, RarityString } from 'src/models/enums';
import factionsData from 'src/v2/data/factions.json';
import MultipleSelectCheckmarks from 'src/routes/characters/multiple-select';
import Dialog from '@mui/material/Dialog';

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

    const filtersCount =
        +!!filter.enemiesAlliance.length +
        +!!filter.alliesAlliance.length +
        +!!filter.alliesFactions.length +
        +!!filter.enemiesFactions.length +
        +!!filter.upgradesRarity.length +
        +!!filter.slotsCount?.length +
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
        });
        setCurrFilter({
            alliesFactions: [],
            alliesAlliance: [],
            enemiesFactions: [],
            enemiesAlliance: [],
            campaignTypes: [],
            upgradesRarity: [],
            slotsCount: [],
        });
        setOpen(false);
    };

    const renderFilters = (type: 'allies' | 'enemies', alliance: Alliance[], factions: Faction[]) => {
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
            <div className="flex-box column start gap5">
                <MultipleSelectCheckmarks
                    size="small"
                    placeholder="Alliances"
                    selectedValues={alliance}
                    values={Object.values(Alliance)}
                    selectionChanges={allianceFilterChanged}
                />

                <MultipleSelectCheckmarks
                    size="small"
                    placeholder="Factions"
                    selectedValues={factions}
                    values={allowedFactions}
                    selectionChanges={factionsFilterChanged}
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
            <Dialog open={open} onClose={handleClose}>
                <DialogTitle>Raids Filters</DialogTitle>
                <DialogContent>
                    <h5>Deployable factions</h5>
                    {renderFilters('allies', currFilter.alliesAlliance, currFilter.alliesFactions)}

                    <hr />

                    <h5>Enemies factions</h5>
                    {renderFilters('enemies', currFilter.enemiesAlliance, currFilter.enemiesFactions)}

                    <h5>Locations</h5>
                    <MultipleSelectCheckmarks
                        size="small"
                        placeholder="Types"
                        selectedValues={currFilter.campaignTypes}
                        values={[CampaignType.Elite, CampaignType.Mirror, CampaignType.Normal, CampaignType.Early]}
                        selectionChanges={values => {
                            setCurrFilter({ ...currFilter, campaignTypes: values as CampaignType[] });
                        }}
                    />

                    <MultipleSelectCheckmarks
                        size="small"
                        placeholder="Slots"
                        selectedValues={currFilter.slotsCount?.map(x => x.toString()) ?? []}
                        values={['3', '4', '5']}
                        selectionChanges={values => {
                            setCurrFilter({ ...currFilter, slotsCount: values.map(x => +x) });
                        }}
                    />

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
