import React, { useContext, useMemo, useState } from 'react';

import { TextField } from '@mui/material';

import { groupBy, orderBy } from 'lodash';
import Box from '@mui/material/Box';
import { CharacterItem } from '../../shared-components/character-item';
import { StoreContext } from '../../reducers/store.provider';
import { Rank } from '../../models/enums';
import { isMobile } from 'react-device-detect';

export const WhoYouOwn = () => {
    const { characters } = useContext(StoreContext);
    const [filter, setFilter] = useState('');

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
                unlockedCount: charactersByFaction[x].filter(x => x.rank > Rank.Locked).length,
            }));

        return factionsOrdered.map(x => (
            <div key={x.faction} style={{ minWidth: 415 }}>
                <h4 style={{ background: x.chars[0].factionColor }}>{x.faction}</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {x.chars.map(item => {
                        return <CharacterItem key={item.name} character={item} />;
                    })}
                </div>
            </div>
        ));
    }, [filter, characters]);

    return (
        <Box sx={{ padding: isMobile ? 0 : 2 }}>
            <TextField
                sx={{ margin: '10px', width: '300px' }}
                label="Quick Filter"
                variant="outlined"
                onChange={event => setFilter(event.target.value)}
            />
            <div style={{ display: 'flex', flexWrap: 'wrap', columnGap: 50 }}>{charactersByFaction}</div>
        </Box>
    );
};
