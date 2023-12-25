import React, { useContext, useEffect, useMemo, useState } from 'react';

import { Badge, TextField, Tooltip } from '@mui/material';

import { groupBy, orderBy, sum } from 'lodash';
import Box from '@mui/material/Box';
import { CharacterItem } from '../../shared-components/character-item';
import { StoreContext } from '../../reducers/store.provider';
import { Rank } from '../../models/enums';
import { isMobile } from 'react-device-detect';
import { UtilsService } from '../../services/utils.service';
import { MiscIcon } from '../../shared-components/misc-icon';
import { FactionImage } from '../../shared-components/faction-image';
import WarningIcon from '@mui/icons-material/Warning';
import ShareIcon from '@mui/icons-material/Share';

import './who-you-own.scss';
import IconButton from '@mui/material/IconButton';
import { useSearchParams } from 'react-router-dom';
import { getSharedCharacters } from '../../api/api-functions';
import { GlobalState } from '../../models/global-state';
import { ShareDialog } from './share-dialog';
import { useAuth } from '../../contexts/auth';
import { Loader } from '../../shared-components/loaders';

export const WhoYouOwn = () => {
    const { characters: ownerCharacters } = useContext(StoreContext);
    const { token: isLoggedIn, shareToken: userShareToken } = useAuth();
    const [filter, setFilter] = useState('');
    const [characters, setCharacters] = useState(ownerCharacters);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const [openShare, setOpenShare] = React.useState(false);

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

    const factionsOrder = useMemo(() => {
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
    }, []);

    const factions = useMemo(() => {
        const filteredCharacters = filter
            ? characters.filter(x => x.name.toLowerCase().includes(filter.toLowerCase()))
            : characters;

        const factionCharacters = groupBy(filteredCharacters, 'faction');
        return factionsOrder
            .filter(x => factionCharacters[x])
            .map(x => ({
                faction: x,
                chars: factionCharacters[x],
                factionColor: factionCharacters[x][0].factionColor,
                factionIcon: factionCharacters[x][0].factionIcon,
                factionPower: sum(factionCharacters[x].map(UtilsService.getCharacterPower)),
                factionMaxPower: factionCharacters[x].length * UtilsService.maxCharacterPower,
                unlockedCount: factionCharacters[x].filter(x => x.rank > Rank.Locked).length,
            }));
    }, [filter, characters, isShareMode]);

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
                                <Tooltip title={"Disclaimer: Doesn't represent in-game power"} placement={'top'}>
                                    <WarningIcon color={'warning'} fontSize={'large'} />
                                </Tooltip>
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

                    <div className="box">
                        {factions.map(x => (
                            <div key={x.faction} className="faction" style={{ minWidth: 375, maxWidth: 375 }}>
                                <h4 className="faction-title" style={generateFactionBackgroundStyles(x.factionColor)}>
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
                                            <CharacterItem key={item.name} character={item} readonly={isShareMode} />
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            ) : undefined}

            <ShareDialog isOpen={openShare} onClose={() => setOpenShare(false)} />
            <Loader loading={isLoading} />
        </Box>
    );
};
