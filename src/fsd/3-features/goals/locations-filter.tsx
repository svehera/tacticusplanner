import { SlidersHorizontal } from 'lucide-react';
import React, { useMemo } from 'react';

// eslint-disable-next-line import-x/no-internal-modules
import factionsData from 'src/data/factions.json';

import { factionLookup } from '@/fsd/5-shared/lib';
import { Alliance, FactionId, Rarity } from '@/fsd/5-shared/model';
import { Button, PortalDialog, MultipleSelectCheckmarks } from '@/fsd/5-shared/ui';
import { ComponentImage, RarityIcon } from '@/fsd/5-shared/ui/icons';
import { ComboBox, SelectMulti } from '@/fsd/5-shared/ui/selects';

import { CampaignsService, CampaignType, ICampaignsFilters } from '@/fsd/4-entities/campaign';
import { FactionImage } from '@/fsd/4-entities/faction';

const UPGRADE_RARITY_OPTIONS: (Rarity | 'Shard' | 'Mythic Shard')[] = [
    Rarity.Common,
    Rarity.Uncommon,
    Rarity.Rare,
    Rarity.Epic,
    Rarity.Legendary,
    Rarity.Mythic,
    'Shard',
    'Mythic Shard',
];

interface Props {
    filter: ICampaignsFilters;
    filtersChange: (value: ICampaignsFilters) => void;
}

export const LocationsFilter: React.FC<Props> = ({ filter, filtersChange }) => {
    const [currentFilter, setCurrentFilter] = React.useState<ICampaignsFilters>(filter);
    const [open, setOpen] = React.useState<boolean>(false);

    const allFactions = useMemo(
        () => factionsData.map(x => ({ alliance: x.alliance as Alliance, id: x.snowprintId as FactionId })),
        [factionsData]
    );

    const enemiesTypeOptions = useMemo(() => CampaignsService.getPossibleEnemiesTypes(), []);
    const enemiesCountOptions = useMemo(() => CampaignsService.getPossibleEnemiesCount().map(x => x.toString()), []);

    const filtersCount =
        +(filter.enemiesAlliance.length > 0) +
        +(filter.alliesAlliance.length > 0) +
        +(filter.alliesFactions.length > 0) +
        +(filter.enemiesFactions.length > 0) +
        +(filter.upgradesRarity.length > 0) +
        +!!filter.slotsCount?.length +
        +!!filter.enemiesTypes?.length +
        +!!filter.enemiesMinCount +
        +!!filter.enemiesMaxCount +
        +(filter.campaignTypes.length > 0);

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
        const allowedFactionIds =
            alliance.length === 0
                ? allFactions.map(x => x.id)
                : allFactions.filter(x => alliance.includes(x.alliance)).map(x => x.id);

        return (
            <div className="flex items-center gap-3">
                <SelectMulti<Alliance>
                    options={Object.values(Alliance) as Alliance[]}
                    value={alliance}
                    onChange={values =>
                        setCurrentFilter({
                            ...currentFilter,
                            ...(type === 'allies' ? { alliesAlliance: values } : { enemiesAlliance: values }),
                        })
                    }
                    label="Alliances"
                    placeholder="All alliances"
                    renderOption={a => (
                        <div className="flex items-center gap-2">
                            <ComponentImage alliance={a} size="small" />
                            <span>{a}</span>
                        </div>
                    )}
                    renderValue={selected => (
                        <div className="flex flex-wrap items-center gap-1">
                            {selected.map(a => (
                                <ComponentImage key={a} alliance={a} size="small" />
                            ))}
                        </div>
                    )}
                />

                <SelectMulti<FactionId>
                    options={allowedFactionIds}
                    value={factions}
                    onChange={values =>
                        setCurrentFilter({
                            ...currentFilter,
                            ...(type === 'allies' ? { alliesFactions: values } : { enemiesFactions: values }),
                        })
                    }
                    label="Factions"
                    placeholder="All factions"
                    renderOption={id => (
                        <div className="flex items-center gap-2">
                            <FactionImage faction={id} />
                            <span>{factionLookup[id]?.name ?? id}</span>
                        </div>
                    )}
                    renderValue={selected => (
                        <div className="flex flex-wrap items-center gap-1">
                            {selected.map(id => (
                                <FactionImage key={id} faction={id} />
                            ))}
                        </div>
                    )}
                />
            </div>
        );
    };

    return (
        <>
            <div className="relative inline-flex">
                <Button intent="secondary" size="square-petite" appearance="outline" onPress={handleClick}>
                    <SlidersHorizontal data-slot="icon" />
                </Button>
                {filtersCount > 0 && (
                    <span className="pointer-events-none absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-(--warning) text-[10px] font-bold text-(--warning-fg)">
                        {filtersCount}
                    </span>
                )}
            </div>

            <PortalDialog open={open} onClose={handleClose} aria-label="Raids Filters">
                <PortalDialog.Header>Raids Filters</PortalDialog.Header>
                <PortalDialog.Body>
                    <div className="space-y-4">
                        <section className="space-y-2">
                            <span className="text-xs font-bold tracking-widest text-(--soft-fg) uppercase">Allies</span>
                            {renderUnitsFilter('allies', currentFilter.alliesAlliance, currentFilter.alliesFactions)}
                        </section>

                        <section className="space-y-2">
                            <span className="text-xs font-bold tracking-widest text-(--soft-fg) uppercase">
                                Enemies
                            </span>
                            {renderUnitsFilter('enemies', currentFilter.enemiesAlliance, currentFilter.enemiesFactions)}
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                                <div className="flex w-full gap-3">
                                    <ComboBox<string>
                                        options={enemiesCountOptions}
                                        value={currentFilter.enemiesMinCount?.toString() ?? undefined}
                                        onChange={value =>
                                            setCurrentFilter({
                                                ...currentFilter,
                                                enemiesMinCount: value ? +value : undefined,
                                            })
                                        }
                                        displayValue={v => v ?? ''}
                                        label="Min Enemy"
                                    />
                                    <ComboBox<string>
                                        options={enemiesCountOptions}
                                        value={currentFilter.enemiesMaxCount?.toString() ?? undefined}
                                        onChange={value =>
                                            setCurrentFilter({
                                                ...currentFilter,
                                                enemiesMaxCount: value ? +value : undefined,
                                            })
                                        }
                                        displayValue={v => v ?? ''}
                                        label="Max Enemy"
                                    />
                                </div>

                                <MultipleSelectCheckmarks
                                    placeholder="Enemy Types"
                                    selectedValues={currentFilter.enemiesTypes ?? []}
                                    values={enemiesTypeOptions}
                                    selectionChanges={values => {
                                        setCurrentFilter({ ...currentFilter, enemiesTypes: values });
                                    }}
                                />
                            </div>
                        </section>

                        <section className="space-y-2">
                            <span className="text-xs font-bold tracking-widest text-(--soft-fg) uppercase">
                                Locations
                            </span>
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                <MultipleSelectCheckmarks
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
                                />

                                <MultipleSelectCheckmarks
                                    placeholder="Slots"
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
                                />
                            </div>
                        </section>

                        <section className="space-y-2">
                            <span className="text-xs font-bold tracking-widest text-(--soft-fg) uppercase">
                                Upgrades
                            </span>
                            <SelectMulti<Rarity | 'Shard' | 'Mythic Shard'>
                                options={UPGRADE_RARITY_OPTIONS}
                                value={currentFilter.upgradesRarity}
                                onChange={values => setCurrentFilter({ ...currentFilter, upgradesRarity: values })}
                                label="Rarity"
                                placeholder="All rarities"
                                renderOption={opt =>
                                    typeof opt === 'string' ? (
                                        <span>{opt}</span>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <RarityIcon rarity={opt} />
                                            <span>{Rarity[opt]}</span>
                                        </div>
                                    )
                                }
                                renderValue={selected => (
                                    <div className="flex flex-wrap items-center gap-1">
                                        {selected.map((opt, index) =>
                                            typeof opt === 'string' ? (
                                                <span key={index} className="text-xs">
                                                    {opt === 'Mythic Shard' ? 'M.Shard' : opt}
                                                </span>
                                            ) : (
                                                <RarityIcon key={index} rarity={opt} />
                                            )
                                        )}
                                    </div>
                                )}
                            />
                        </section>
                    </div>
                </PortalDialog.Body>
                <PortalDialog.Footer>
                    <Button intent="secondary" appearance="plain" onPress={handleClose}>
                        Close
                    </Button>
                    <Button appearance="outline" intent="danger" onPress={resetFilters}>
                        Reset
                    </Button>
                    <Button onPress={saveChanges}>Apply</Button>
                </PortalDialog.Footer>
            </PortalDialog>
        </>
    );
};
