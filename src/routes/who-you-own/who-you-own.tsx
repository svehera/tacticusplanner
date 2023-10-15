import React, { useContext, useMemo, useState } from 'react';

import { TextField } from '@mui/material';

import { ICharacter2 } from '../../models/interfaces';

import { groupBy } from 'lodash';
import Box from '@mui/material/Box';
import { CharacterItem } from '../../shared-components/character-item';
import { StoreContext } from '../../reducers/store.provider';

export const WhoYouOwn = () => {
    const { characters } = useContext(StoreContext);
    const [filter, setFilter] = useState('');

    const charactersByAlliance = useMemo(() => {
        const filteredCharacters = filter
            ? characters.filter(x => x.name.toLowerCase().includes(filter.toLowerCase()))
            : characters;

        const charactersByAlliance = groupBy(filteredCharacters, 'alliance');

        return Object.entries(charactersByAlliance).map(([alliance, characters]) => (
            <Alliance key={alliance} alliance={alliance} characters={characters} />
        ));
    }, [filter, characters]);

    return (
        <Box sx={{ padding: 2 }}>
            <TextField
                sx={{ margin: '10px', width: '300px' }}
                label="Quick Filter"
                variant="outlined"
                onChange={event => setFilter(event.target.value)}
            />
            {charactersByAlliance}
        </Box>
    );
};

const Alliance = ({ alliance, characters }: { alliance: string; characters: ICharacter2[] }) => {
    const charactersByFaction = groupBy(characters, 'faction');
    const itemList = [];

    for (const faction in charactersByFaction) {
        const chars = charactersByFaction[faction];
        itemList.push(
            <div key={faction}>
                <h4 style={{ background: chars[0].factionColor }}>{faction}</h4>

                {chars.map(item => {
                    return <CharacterItem key={item.name} character={item} />;
                })}
            </div>
        );
    }
    return (
        <div>
            <h3>{alliance}</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', columnGap: 50 }}>{itemList}</div>
        </div>
    );
};
