import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber'; // Optional icon for flavor
import {
    Autocomplete,
    TextField,
    Checkbox,
    FormControlLabel,
    FormGroup,
    Card,
    CardContent,
    InputAdornment,
    Divider,
} from '@mui/material';
import { useMemo, useState } from 'react';

// eslint-disable-next-line import-x/no-internal-modules
import onslaughtData from '@/data/onslaught/data.generated.json';

import { HomeScreenEventPlannerService } from './home-screen-event-planner.service';
import { GREEK_ZONES, numToRoman, ONSLAUGHT_TRACK_NAME, romanToNum } from './id-data';
import { OnslaughtSectorKey, OnslaughtTrackId, OnslaughtZoneKey } from './models';

export const HomeScreenEventPlanner = () => {
    const [preEventTokens, setPreEventTokens] = useState<number>(0);
    const [duringEventTokens, setDuringEventTokens] = useState<number>(0);
    const tracks = Object.keys(onslaughtData) as Array<OnslaughtTrackId>;
    const [selections, setSelections] = useState<
        Record<OnslaughtTrackId, { selected: boolean; sector: OnslaughtSectorKey; zone: OnslaughtZoneKey }>
    >({
        [OnslaughtTrackId.Imperial]: { selected: true, sector: 0, zone: 0 },
        [OnslaughtTrackId.Xenos]: { selected: true, sector: 0, zone: 0 },
        [OnslaughtTrackId.Chaos]: { selected: true, sector: 0, zone: 0 },
    });

    const handleToggleTrack = (track: OnslaughtTrackId) => {
        setSelections(prev => {
            const next = { ...prev };
            next[track] = {
                ...prev[track],
                selected: !prev[track].selected,
            };
            return next;
        });
    };

    const updateValue = (track: OnslaughtTrackId, field: 'sector' | 'zone', value: number) => {
        setSelections(prev => ({
            ...prev,
            [track]: { ...prev[track], [field]: value },
        }));
    };

    const selectedTracks = Object.entries(selections)
        .filter(([_, { selected }]) => selected)
        .map(([track]) => track as OnslaughtTrackId);

    const tokens = useMemo(() => {
        const ret = HomeScreenEventPlannerService.calculateHsePlan(
            onslaughtData,
            {
                track: OnslaughtTrackId.Imperial,
                sector: selections[OnslaughtTrackId.Imperial]?.sector ?? 0,
                zone: selections[OnslaughtTrackId.Imperial]?.zone ?? 0,
            },
            {
                track: OnslaughtTrackId.Xenos,
                sector: selections[OnslaughtTrackId.Xenos]?.sector ?? 0,
                zone: selections[OnslaughtTrackId.Xenos]?.zone ?? 0,
            },
            {
                track: OnslaughtTrackId.Chaos,
                sector: selections[OnslaughtTrackId.Chaos]?.sector ?? 0,
                zone: selections[OnslaughtTrackId.Chaos]?.zone ?? 0,
            },
            {
                [OnslaughtTrackId.Imperial]: selectedTracks.includes(OnslaughtTrackId.Imperial),
                [OnslaughtTrackId.Xenos]: selectedTracks.includes(OnslaughtTrackId.Xenos),
                [OnslaughtTrackId.Chaos]: selectedTracks.includes(OnslaughtTrackId.Chaos),
            },
            preEventTokens,
            duringEventTokens
        );
        return ret;
    }, [selections, preEventTokens, duringEventTokens]);
    return (
        <div className="flex flex-col gap-6 bg-gray-50 p-2 dark:bg-gray-900">
            <div className="mb-4 rounded bg-red-100 p-2 text-sm text-red-600">
                Onslaught progress is not currently provided by the Tacticus API, thus this information must be entered
                manually.
            </div>
            <section className="rounded-xl border border-stone-200 bg-stone-200 p-4 dark:border-stone-700 dark:bg-stone-800">
                <h3 className="mb-3 text-xs font-bold tracking-wider text-stone-800 uppercase opacity-80 dark:text-stone-200">
                    Active Tracks
                </h3>
                <FormGroup row className="gap-2">
                    {tracks.map(track => (
                        <FormControlLabel
                            key={track}
                            control={
                                <Checkbox
                                    size="small"
                                    checked={selections[track].selected}
                                    onChange={() => handleToggleTrack(track)}
                                />
                            }
                            label={
                                <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
                                    {ONSLAUGHT_TRACK_NAME[track]}
                                </span>
                            }
                        />
                    ))}
                </FormGroup>
            </section>
            <Card
                variant="outlined"
                className="overflow-hidden border-stone-200 bg-white shadow-sm dark:border-stone-700 dark:bg-stone-900">
                <div className="border-b border-stone-200 bg-stone-50 px-4 py-3 dark:border-stone-700 dark:bg-stone-800/50">
                    <h2 className="text-sm font-bold tracking-widest text-stone-600 uppercase dark:text-stone-300">
                        Next Onslaught Configuration
                    </h2>
                </div>

                <CardContent className="flex flex-col gap-6">
                    {/* Track Rows */}
                    <div className="flex flex-col gap-4">
                        {[OnslaughtTrackId.Imperial, OnslaughtTrackId.Xenos, OnslaughtTrackId.Chaos].map(rawTrack => {
                            const track: OnslaughtTrackId = rawTrack as OnslaughtTrackId;
                            const trackData = onslaughtData[track];
                            const availableSectors = Object.keys(trackData.sectors).map(key => parseInt(key, 10));
                            const currentSector = selections[track].sector;
                            const availableZones = Object.keys(trackData.sectors[currentSector].killzones).map(key =>
                                parseInt(key, 10)
                            );

                            return (
                                <div key={track} className="grid grid-cols-1 items-center gap-3 md:grid-cols-12">
                                    <div className="text-sm font-bold text-stone-700 md:col-span-2 dark:text-stone-200">
                                        {ONSLAUGHT_TRACK_NAME[track]}
                                    </div>
                                    <div className="md:col-span-5">
                                        <Autocomplete<number>
                                            options={availableSectors}
                                            value={currentSector}
                                            getOptionLabel={option => `Sector ${numToRoman(option + 1)}`}
                                            onChange={(_, val) => val !== null && updateValue(track, 'sector', val)}
                                            filterOptions={(options, { inputValue }) => {
                                                const search = inputValue.toLowerCase().replace('sector ', '').trim();
                                                const searchAsNumFromRoman = romanToNum(search.toUpperCase()) - 1;
                                                const searchAsDirectNum = parseInt(search, 10) - 1;

                                                return options.filter(opt => {
                                                    const romanStr = numToRoman(opt + 1).toLowerCase();
                                                    return (
                                                        romanStr.includes(search) ||
                                                        opt === searchAsNumFromRoman ||
                                                        opt === searchAsDirectNum
                                                    );
                                                });
                                            }}
                                            renderInput={params => (
                                                <TextField {...params} label="Sector" size="small" />
                                            )}
                                        />
                                    </div>
                                    <div className="md:col-span-5">
                                        <Autocomplete<number>
                                            options={availableZones}
                                            value={selections[track].zone}
                                            getOptionLabel={option => `KillZone ${GREEK_ZONES[option] || option}`}
                                            onChange={(_, val) => val !== null && updateValue(track, 'zone', val)}
                                            filterOptions={(options, { inputValue }) => {
                                                const search = inputValue.toLowerCase().replace('killzone ', '').trim();
                                                const greekIndex = GREEK_ZONES.findIndex(
                                                    g => g.toLowerCase() === search
                                                );
                                                const directIndex = parseInt(search, 10) - 1;

                                                return options.filter(opt => {
                                                    const name = GREEK_ZONES[opt]?.toLowerCase() || '';
                                                    return (
                                                        name.includes(search) ||
                                                        opt === greekIndex ||
                                                        opt === directIndex
                                                    );
                                                });
                                            }}
                                            renderInput={params => <TextField {...params} label="Zone" size="small" />}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <Divider className="my-2" />

                    <div>
                        <h3 className="mb-4 text-xs font-bold tracking-wider text-stone-800 uppercase opacity-80 dark:text-stone-200">
                            Token Planning
                        </h3>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <TextField
                                label="Tokens BEFORE event"
                                type="number"
                                size="small"
                                value={preEventTokens}
                                onChange={e => setPreEventTokens(Math.max(0, parseInt(e.target.value) || 0))}
                                slotProps={{
                                    input: {
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <ConfirmationNumberIcon fontSize="small" className="opacity-50" />
                                            </InputAdornment>
                                        ),
                                    },
                                }}
                            />
                            <TextField
                                label="Tokens DURING event"
                                type="number"
                                size="small"
                                value={duringEventTokens}
                                onChange={e => setDuringEventTokens(Math.max(0, parseInt(e.target.value) || 0))}
                                slotProps={{
                                    input: {
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <ConfirmationNumberIcon fontSize="small" className="opacity-50" />
                                            </InputAdornment>
                                        ),
                                    },
                                }}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>
            <Card
                variant="outlined"
                className="overflow-hidden border-stone-200 bg-white shadow-sm dark:border-stone-700 dark:bg-stone-900">
                <div className="border-b border-stone-200 bg-stone-50 px-4 py-3 dark:border-stone-700 dark:bg-stone-800/50">
                    <h2 className="text-sm font-bold tracking-widest text-stone-600 uppercase dark:text-stone-300">
                        Pre-Event Onslaughts
                    </h2>
                </div>

                <CardContent className="flex flex-col gap-6">
                    <div className="flex flex-col gap-4">
                        <h3 className="mb-2 text-xs font-bold tracking-wider text-stone-800 uppercase opacity-80 dark:text-stone-200">
                            Pre-Event Tokens
                        </h3>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div className="flex flex-col items-center">
                                <span className="text-sm font-medium">Imperial</span>
                                <span className="text-lg font-bold">
                                    {tokens.preEventTokens[OnslaughtTrackId.Imperial] ?? 0}
                                </span>
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="text-sm font-medium">Xenos</span>
                                <span className="text-lg font-bold">
                                    {tokens.preEventTokens[OnslaughtTrackId.Xenos] ?? 0}
                                </span>
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="text-sm font-medium">Chaos</span>
                                <span className="text-lg font-bold">
                                    {tokens.preEventTokens[OnslaughtTrackId.Chaos] ?? 0}
                                </span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
            <Card
                variant="outlined"
                className="overflow-hidden border-stone-200 bg-white shadow-sm dark:border-stone-700 dark:bg-stone-900">
                <div className="border-b border-stone-200 bg-stone-50 px-4 py-3 dark:border-stone-700 dark:bg-stone-800/50">
                    <h2 className="text-sm font-bold tracking-widest text-stone-600 uppercase dark:text-stone-300">
                        <div className="flex items-center gap-1">During-Event Onslaughts</div>
                    </h2>
                </div>

                <CardContent className="flex flex-col gap-6">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div className="flex flex-col items-center">
                            <span className="text-sm font-medium">Imperial Tokens</span>
                            <span className="text-lg font-bold text-blue-600">
                                {tokens.eventTokens[OnslaughtTrackId.Imperial] ?? 0}
                            </span>
                            <span className="text-sm font-medium">Enemies</span>
                            <span className="text-lg font-bold text-red-600">
                                {HomeScreenEventPlannerService.computeTotalEnemies(
                                    onslaughtData,
                                    OnslaughtTrackId.Imperial,
                                    selections[OnslaughtTrackId.Imperial].sector,
                                    selections[OnslaughtTrackId.Imperial].zone,
                                    tokens
                                )}
                            </span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-sm font-medium">Xenos Tokens</span>
                            <span className="text-lg font-bold text-blue-600">
                                {tokens.eventTokens[OnslaughtTrackId.Xenos] ?? 0}
                            </span>
                            <span className="text-sm font-medium">Enemies</span>
                            <span className="text-lg font-bold text-red-600">
                                {HomeScreenEventPlannerService.computeTotalEnemies(
                                    onslaughtData,
                                    OnslaughtTrackId.Xenos,
                                    selections[OnslaughtTrackId.Xenos].sector,
                                    selections[OnslaughtTrackId.Xenos].zone,
                                    tokens
                                )}
                            </span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-sm font-medium">Chaos Tokens</span>
                            <span className="text-lg font-bold text-blue-600">
                                {tokens.eventTokens[OnslaughtTrackId.Chaos] ?? 0}
                            </span>
                            <span className="text-sm font-medium">Enemies</span>
                            <span className="text-lg font-bold text-red-600">
                                {HomeScreenEventPlannerService.computeTotalEnemies(
                                    onslaughtData,
                                    OnslaughtTrackId.Chaos,
                                    selections[OnslaughtTrackId.Chaos].sector,
                                    selections[OnslaughtTrackId.Chaos].zone,
                                    tokens
                                )}
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
