import React, { useContext, useMemo, useState } from 'react';

import { TextField, Tooltip } from '@mui/material';

import { groupBy, orderBy, sum } from 'lodash';
import Box from '@mui/material/Box';
import { CharacterItem } from '../../shared-components/character-item';
import { StoreContext } from '../../reducers/store.provider';
import { Rank } from '../../models/enums';
import { isMobile } from 'react-device-detect';

import background from '../../assets/images/background.png';
import { UtilsService } from '../../services/utils.service';
import { MiscIcon } from '../../shared-components/misc-icon';
import { FactionImage } from '../../shared-components/faction-image';
import WarningIcon from '@mui/icons-material/Warning';

import './who-you-own.scss';

export const WhoYouOwn = () => {
    const { characters } = useContext(StoreContext);
    const [filter, setFilter] = useState('');
    const [totalPower, setTotalPower] = useState(0);

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

    const charactersByFaction = useMemo(() => {
        const filteredCharacters = filter
            ? characters.filter(x => x.name.toLowerCase().includes(filter.toLowerCase()))
            : characters;

        const charactersByFaction = groupBy(filteredCharacters, 'faction');
        const factionsOrdered = factionsOrder
            .filter(x => charactersByFaction[x])
            .map(x => ({
                faction: x,
                chars: charactersByFaction[x],
                factionColor: charactersByFaction[x][0].factionColor,
                factionIcon: charactersByFaction[x][0].factionIcon,
                factionPower: sum(charactersByFaction[x].map(UtilsService.getCharacterPower)),
                factionMaxPower: charactersByFaction[x].length * UtilsService.maxCharacterPower,
                unlockedCount: charactersByFaction[x].filter(x => x.rank > Rank.Locked).length,
            }));

        setTotalPower(sum(factionsOrdered.map(x => x.factionPower)));

        return factionsOrdered.map(x => (
            <div key={x.faction} style={{ minWidth: 375, maxWidth: 375 }}>
                <h4
                    style={{
                        background: x.factionColor,
                        marginBottom: 0,
                        marginTop: 5,
                        borderTop: '2px solid gold',
                        fontWeight: 500,
                    }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <FactionImage faction={x.factionIcon} size={25} />
                            <span>{x.faction.toUpperCase()}</span>
                        </div>
                        <div style={{ display: 'flex' }}>
                            <MiscIcon icon={'power'} height={20} width={15} />{' '}
                            {x.factionPower.toLocaleString().replace(/,/g, ' ')}
                        </div>
                    </div>
                </h4>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: x.chars.length === 5 ? 'space-evenly' : 'flex-start',
                        paddingLeft: x.chars.length === 5 ? 0 : 5,
                    }}>
                    {x.chars.map(item => {
                        return <CharacterItem key={item.name} character={item} />;
                    })}
                </div>
            </div>
        ));
    }, [filter, characters]);

    return (
        <Box
            sx={{
                padding: isMobile ? 0 : 2,
                // backgroundImage: `url(${background})`,
                // color: 'white',
            }}>
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
            </div>

            <div className="box">{charactersByFaction}</div>
        </Box>
    );
};
