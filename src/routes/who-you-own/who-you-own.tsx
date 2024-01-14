import React, { useContext, useEffect, useMemo, useState } from 'react';

import { Badge, FormControl, MenuItem, Popover, Select, TextField, Tooltip } from '@mui/material';

import { groupBy, orderBy, sum } from 'lodash';
import Box from '@mui/material/Box';
import { CharacterItem } from '../../shared-components/character-item';
import { DispatchContext, StoreContext } from '../../reducers/store.provider';
import { Rank, WyoFilter, WyoOrder } from '../../models/enums';
import { isMobile } from 'react-device-detect';
import { UtilsService } from '../../services/utils.service';
import { MiscIcon } from '../../shared-components/misc-icon';
import { FactionImage } from '../../shared-components/faction-image';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import ShareIcon from '@mui/icons-material/Share';

import './who-you-own.scss';
import IconButton from '@mui/material/IconButton';
import { useSearchParams } from 'react-router-dom';
import { getSharedCharacters } from '../../api/api-functions';
import { GlobalState } from '../../models/global-state';
import { ShareDialog } from './share-dialog';
import { useAuth } from '../../contexts/auth';
import { Loader } from '../../shared-components/loaders';
import wyoInfo from '../../assets/images/wyo_info.png';
import { IViewPreferences } from '../../models/interfaces';
import InputLabel from '@mui/material/InputLabel';
import {
    getEnumValues,
    needToAscendCharacter,
    needToLevelCharacter,
    wyoFilterToString,
    wyoOrderToString,
} from '../../shared-logic/functions';

export const WhoYouOwn = () => {
    const { characters: ownerCharacters } = useContext(StoreContext);
    const { token: isLoggedIn, shareToken: userShareToken } = useAuth();
    const [filter, setFilter] = useState('');
    const [characters, setCharacters] = useState(ownerCharacters);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [openShare, setOpenShare] = React.useState(false);
    const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null);
    const dispatch = useContext(DispatchContext);
    const { viewPreferences } = useContext(StoreContext);

    const updatePreferences = (setting: keyof IViewPreferences, value: number) => {
        dispatch.viewPreferences({ type: 'Update', setting, value });
    };

    const handleClick = (event: React.UIEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const open = Boolean(anchorEl);

    const [searchParams] = useSearchParams();

    const sharedUser = searchParams.get('username');
    const shareToken = searchParams.get('shareToken');

    const isShareMode = !!sharedUser && !!shareToken;

    useEffect(() => {
        if (isShareMode) {
            setIsLoading(true);
            getSharedCharacters(sharedUser, shareToken)
                .then(response => {
                    setCharacters(GlobalState.initCharacters(response.data.characters));
                })
                .catch(() => {
                    setError(`Oops! It seems like ${sharedUser} doesn't exist or has roster sharing disabled.`);
                })
                .finally(() => setIsLoading(false));
        }
    }, []);

    const filteredCharacters = useMemo(() => {
        const filteredCharactersByName = filter
            ? characters.filter(x => x.name.toLowerCase().includes(filter.toLowerCase()))
            : characters;

        switch (viewPreferences.wyoFilter) {
            case WyoFilter.NeedToAscend:
                return filteredCharactersByName.filter(needToAscendCharacter);
            case WyoFilter.NeedToLevel:
                return filteredCharactersByName.filter(needToLevelCharacter);
            case WyoFilter.CanUpgrade:
                return filteredCharactersByName.filter(
                    char => char.rank !== Rank.Locked && !needToLevelCharacter(char) && !needToAscendCharacter(char)
                );
            case WyoFilter.None:
            default:
                return filteredCharactersByName;
        }
    }, [characters, filter, viewPreferences.wyoFilter]);

    const defaultFactionsOrder = useMemo(() => {
        const charactersByFaction = groupBy(characters, 'faction');
        const factions = Object.keys(charactersByFaction);
        return orderBy(
            factions.map(x => ({
                faction: x,
                unlockedCount: charactersByFaction[x].filter(x => x.rank > Rank.Locked).length,
            })),
            ['unlockedCount'],
            ['desc']
        ).map(x => x.faction);
    }, [characters]);

    const factions = useMemo(() => {
        const factionCharacters = groupBy(filteredCharacters, 'faction');
        const result = defaultFactionsOrder
            .filter(faction => factionCharacters[faction])
            .map(x => ({
                faction: x,
                chars: factionCharacters[x],
                factionColor: factionCharacters[x][0].factionColor,
                factionIcon: factionCharacters[x][0].factionIcon,
                factionPower: sum(factionCharacters[x].map(UtilsService.getCharacterPower)),
                factionMaxPower: factionCharacters[x].length * UtilsService.maxCharacterPower,
                unlockedCount: factionCharacters[x].filter(x => x.rank > Rank.Locked).length,
            }));
        switch (viewPreferences.wyoOrder) {
            case WyoOrder.FactionPower:
                return orderBy(result, ['factionPower'], ['desc']);
            case WyoOrder.Faction:
            default:
                return result;
        }
    }, [defaultFactionsOrder, filteredCharacters, viewPreferences.wyoOrder]);

    const orderedCharacters = useMemo(() => {
        const unlockedCharacters = filteredCharacters.filter(char => char.rank > Rank.Locked);
        switch (viewPreferences.wyoOrder) {
            case WyoOrder.CharacterPower:
                return orderBy(
                    unlockedCharacters.map(x => ({ ...x, characterPower: UtilsService.getCharacterPower(x) })),
                    ['characterPower'],
                    ['desc']
                );
            case WyoOrder.AbilitiesLevel:
                return orderBy(
                    unlockedCharacters.map(x => ({
                        ...x,
                        abilitiesLevel: x.activeAbilityLevel + x.passiveAbilityLevel,
                    })),
                    ['abilitiesLevel'],
                    ['desc']
                );
            case WyoOrder.Rank:
                return orderBy(unlockedCharacters, ['rank'], ['desc']);
            default:
                return [];
        }
    }, [filteredCharacters, viewPreferences.wyoOrder]);
    const totalPower = sum(factions.map(x => x.factionPower));

    const generateFactionBackgroundStyles = (mainColor: string) => {
        return {
            backgroundColor: mainColor,
            // backgroundImage: `linear-gradient(
            // ${mainColor}a2,
            //         ${mainColor},
            // ${mainColor}a2,
            //         ${mainColor},
            // ${mainColor}a2,
            //         ${mainColor},
            // ${mainColor}a2,
            //         ${mainColor},
            // ${mainColor}a2,
            //         ${mainColor},
            // ${mainColor}a2,
            //         ${mainColor},
            // ${mainColor}a2,
            //         ${mainColor},
            // ${mainColor}a2,
            //         ${mainColor},
            // ${mainColor}a2
            // )`,
            // maskImage: `radial-gradient(at top, ${mainColor} 45%, transparent)`,
        };
    };

    const filterEntries: number[] = getEnumValues(WyoFilter);
    const orderEntries: number[] = getEnumValues(WyoOrder);

    const getSelectControl = (
        label: string,
        value: number,
        name: keyof IViewPreferences,
        entries: Array<number>,
        getName: (value: number) => string
    ) => (
        <FormControl style={{ width: '250px' }}>
            <InputLabel>{label}</InputLabel>
            <Select label={name} value={value} onChange={event => updatePreferences(name, +event.target.value)}>
                {entries.map(value => (
                    <MenuItem key={value} value={value}>
                        {getName(value)}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );

    return (
        <Box
            sx={{
                padding: isMobile ? 0 : 2,
                // backgroundImage: `url(${background})`,
                // color: 'white',
            }}>
            {isShareMode && !isLoading ? (
                <div
                    style={{
                        fontSize: 'x-large',
                        textAlign: 'center',
                        fontWeight: '600',
                    }}>
                    {error ? error : `${sharedUser}'s roster`}
                </div>
            ) : undefined}
            {(!isShareMode || !error) && !isLoading ? (
                <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
                        <div
                            style={{
                                display: 'flex',
                                fontSize: 20,
                                alignItems: 'center',
                                fontWeight: 'bold',
                                minWidth: 'fit-content',
                            }}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <IconButton onClick={handleClick}>
                                    <InfoIcon color={'primary'} fontSize={'large'} />
                                </IconButton>
                                <MiscIcon icon={'power'} height={40} width={30} />{' '}
                                {totalPower.toLocaleString().replace(/,/g, ' ')}
                            </div>
                        </div>
                        <TextField
                            sx={{ margin: '10px', width: '300px' }}
                            label="Quick Filter"
                            variant="outlined"
                            onChange={event => setFilter(event.target.value)}
                        />
                        {!isShareMode && isLoggedIn ? (
                            <Tooltip title={'Share your roster'} placement={'top'}>
                                <Badge badgeContent={'✅︎'} color={'success'} invisible={!userShareToken}>
                                    <IconButton onClick={() => setOpenShare(true)}>
                                        <ShareIcon fontSize={'large'} />
                                    </IconButton>
                                </Badge>
                            </Tooltip>
                        ) : undefined}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
                        {getSelectControl(
                            'Order',
                            viewPreferences.wyoOrder,
                            'wyoOrder',
                            orderEntries,
                            wyoOrderToString
                        )}
                        {getSelectControl(
                            'Filter',
                            viewPreferences.wyoFilter,
                            'wyoFilter',
                            filterEntries,
                            wyoFilterToString
                        )}
                    </div>

                    {orderedCharacters.length ? (
                        <>
                            <h4>Unlocked ({orderedCharacters.length})</h4>
                            <div className="characters-box mixed">
                                {orderedCharacters.map(char => (
                                    <CharacterItem key={char.name} character={char} readonly={isShareMode} />
                                ))}
                            </div>
                            <h4>Locked ({filteredCharacters.filter(x => x.rank === Rank.Locked).length})</h4>
                            <div className="characters-box mixed">
                                {filteredCharacters
                                    .filter(x => x.rank === Rank.Locked)
                                    .map(char => (
                                        <CharacterItem key={char.name} character={char} readonly={isShareMode} />
                                    ))}
                            </div>
                        </>
                    ) : (
                        <div className="box">
                            {factions.map(x => (
                                <div key={x.faction} className="faction" style={{ minWidth: 375, maxWidth: 375 }}>
                                    <h4
                                        className="faction-title"
                                        style={generateFactionBackgroundStyles(x.factionColor)}>
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                            }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                                <FactionImage faction={x.factionIcon} size={25} />
                                                <span>{x.faction.toUpperCase()}</span>
                                            </div>
                                            <div style={{ display: 'flex', paddingInlineEnd: 5 }}>
                                                <MiscIcon icon={'power'} height={20} width={15} />{' '}
                                                {x.factionPower.toLocaleString().replace(/,/g, ' ')}
                                            </div>
                                        </div>
                                    </h4>
                                    <div
                                        className={'characters-box'}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: x.chars.length === 5 ? 'space-evenly' : 'flex-start',
                                            paddingLeft: x.chars.length === 5 ? 0 : 5,
                                        }}>
                                        {x.chars.map(item => {
                                            return (
                                                <CharacterItem
                                                    key={item.name}
                                                    character={item}
                                                    readonly={isShareMode}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            ) : undefined}

            <ShareDialog isOpen={openShare} onClose={() => setOpenShare(false)} />
            <Loader loading={isLoading} />
            <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}>
                <div style={{ padding: 10, maxWidth: 500 }}>
                    <p style={{ fontWeight: 500 }}>
                        <WarningIcon color={'warning'} fontSize={'medium'} /> Disclaimer:{' '}
                        {/* eslint-disable-next-line react/no-unescaped-entities */}
                        <MiscIcon icon={'power'} height={20} width={15} /> doesn't represent in-game power
                        <br />
                        <span style={{ fontSize: 10 }}>
                            Power = dirtyDozenCoeff * (statsWeight * statsScore + abilityWeight *
                            (activeAbilityLevelCoeff + passiveAbilityLevelCoeff)))
                        </span>
                    </p>
                    <img src={wyoInfo} width={500} />
                </div>
            </Popover>
        </Box>
    );
};
