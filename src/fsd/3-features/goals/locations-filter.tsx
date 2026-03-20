import FilterAltIcon from '@mui/icons-material/FilterAlt';
import { Autocomplete, Badge, DialogActions, DialogContent, DialogTitle, IconButton, TextField } from '@mui/material';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import React, { useMemo } from 'react';

// eslint-disable-next-line import-x/no-internal-modules
import factionsData from 'src/data/factions.json';

import { factionLookup } from '@/fsd/5-shared/lib';
import { Alliance, FactionId, FactionName, RarityMapper, RarityString } from '@/fsd/5-shared/model';
import { MultipleSelectCheckmarks } from '@/fsd/5-shared/ui';

import { CampaignsService, CampaignType, ICampaignsFilters } from '@/fsd/4-entities/campaign';

interface Props {
    filter: ICampaignsFilters;
    filtersChange: (value: ICampaignsFilters) => void;
}

export const LocationsFilter: React.FC<Props> = ({ filter, filtersChange }) => {
    const [currentFilter, setCurrentFilter] = React.useState<ICampaignsFilters>(filter);
    const [open, setOpen] = React.useState<boolean>(false);

    const allFactions = useMemo(
        () => factionsData.map(x => ({ alliance: x.alliance as Alliance, faction: x.name })),
        [factionsData]
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
        +!!filter.enemiesMinCount +
        +!!filter.enemiesMaxCount +
        +!!filter.campaignTypes.length;

    const handleClick = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setCurrentFilter(filter);
    };

    const saveChanges = () => {
        filtersChange(currentFilter);
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
        });
        setCurrentFilter({
            alliesFactions: [],
            alliesAlliance: [],
            enemiesFactions: [],
            enemiesAlliance: [],
            campaignTypes: [],
            upgradesRarity: [],
            slotsCount: [],
            enemiesTypes: [],
        });
        setOpen(false);
    };

    const renderUnitsFilter = (type: 'allies' | 'enemies', alliance: Alliance[], factions: FactionId[]) => {
        const allowedFactions = !alliance.length
            ? allFactions.map(x => x.faction)
            : allFactions.filter(x => alliance.includes(x.alliance)).map(x => x.faction);
        const selectedFactionNames = factions.map(factionId => factionLookup[factionId]?.name).filter(Boolean);

        const allianceFilterChanged = (values: string[]) => {
            if (type === 'allies') {
                setCurrentFilter({ ...currentFilter, alliesAlliance: values as Alliance[] });
            }

            if (type === 'enemies') {
                setCurrentFilter({ ...currentFilter, enemiesAlliance: values as Alliance[] });
            }
        };

        const factionsFilterChanged = (values: FactionName[]) => {
            const factionIds = values
                .map(factionName => Object.values(factionLookup).find(f => f.name === factionName)?.snowprintId)
                .filter((function_): function_ is FactionId => !!function_); // Use a type guard to clean up the filter
            if (type === 'allies') {
                setCurrentFilter({ ...currentFilter, alliesFactions: factionIds });
            }

            if (type === 'enemies') {
                setCurrentFilter({ ...currentFilter, enemiesFactions: factionIds });
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
                    selectedValues={selectedFactionNames}
                    values={allowedFactions}
                    selectionChanges={factionsFilterChanged as (value: string[]) => void}
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
                    {renderUnitsFilter('allies', currentFilter.alliesAlliance, currentFilter.alliesFactions)}

                    <h5>Enemies</h5>
                    {renderUnitsFilter('enemies', currentFilter.enemiesAlliance, currentFilter.enemiesFactions)}

                    <div className="mt-2.5 flex items-center gap-3">
                        <Autocomplete
                            fullWidth
                            size="small"
                            value={currentFilter.enemiesMinCount?.toString() ?? null}
                            options={enemiesCountOptions}
                            onChange={(_, value) => {
                                setCurrentFilter({ ...currentFilter, enemiesMinCount: value ? +value : undefined });
                            }}
                            sx={{ minWidth: 150, maxWidth: 300 }}
                            renderInput={params => <TextField {...params} label="Min Enemy" />}
                        />
                        <Autocomplete
                            fullWidth
                            size="small"
                            value={currentFilter.enemiesMaxCount?.toString() ?? null}
                            options={enemiesCountOptions}
                            onChange={(_, value) => {
                                setCurrentFilter({ ...currentFilter, enemiesMaxCount: value ? +value : undefined });
                            }}
                            sx={{ minWidth: 150, maxWidth: 300 }}
                            renderInput={params => <TextField {...params} label="Max Enemy" />}
                        />

                        <MultipleSelectCheckmarks
                            size="small"
                            placeholder="Enemy Types"
                            selectedValues={currentFilter.enemiesTypes ?? []}
                            values={enemiesTypeOptions}
                            selectionChanges={values => {
                                setCurrentFilter({ ...currentFilter, enemiesTypes: values });
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
                            selectedValues={
                                currentFilter.campaignTypes as (
                                    | CampaignType.Early
                                    | CampaignType.Extremis
                                    | CampaignType.Standard
                                    | CampaignType.Mirror
                                    | CampaignType.Normal
                                    | CampaignType.Elite
                                )[]
                            }
                            values={[
                                CampaignType.Elite,
                                CampaignType.Extremis,
                                CampaignType.Standard,
                                CampaignType.Mirror,
                                CampaignType.Normal,
                                CampaignType.Early,
                            ]}
                            selectionChanges={values => {
                                setCurrentFilter({ ...currentFilter, campaignTypes: values as CampaignType[] });
                            }}
                            disableCloseOnSelect={false}
                            minWidth={150}
                        />

                        <MultipleSelectCheckmarks
                            size="small"
                            placeholder="Slots"
                            // Cast the result of the map to the specific literals
                            selectedValues={
                                (currentFilter.slotsCount?.map(x => x.toString()) ?? []) as ('3' | '4' | '5')[]
                            }
                            values={['3', '4', '5']}
                            selectionChanges={values => {
                                setCurrentFilter({
                                    ...currentFilter,
                                    slotsCount: values.map(x => Number(x) as 3 | 4 | 5),
                                });
                            }}
                            disableCloseOnSelect={false}
                            minWidth={150}
                        />
                    </div>

                    <h5>Upgrades</h5>
                    <MultipleSelectCheckmarks
                        size="small"
                        placeholder="Rarity"
                        selectedValues={currentFilter.upgradesRarity.map(x => {
                            if (x === 'Shard') return 'Shard';
                            if (x === 'Mythic Shard') return 'Mythic Shard';
                            return RarityMapper.rarityToRarityString(x);
                        })}
                        values={[Object.values(RarityString), 'Shard', 'Mythic Shard'].flat()}
                        selectionChanges={values => {
                            setCurrentFilter({
                                ...currentFilter,
                                upgradesRarity: values.map(x => {
                                    if (x === 'Shard') return 'Shard';
                                    if (x === 'Mythic Shard') return 'Mythic Shard';
                                    return RarityMapper.stringToNumber[x as RarityString];
                                }),
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
