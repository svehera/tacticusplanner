import React, { useContext, useMemo, useState } from 'react';

import { TextField } from '@mui/material';

import { groupBy, orderBy, sum } from 'lodash';
import Box from '@mui/material/Box';
import { CharacterItem } from '../../shared-components/character-item';
import { StoreContext } from '../../reducers/store.provider';
import { Rank, Rarity, RarityStars } from '../../models/enums';
import { isMobile } from 'react-device-detect';

import background from '../../assets/images/background.png';
import { ICharacter2 } from '../../models/interfaces';

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

    const getCharacterPower = (char: ICharacter2): number => {
        if (char.rank === Rank.Locked) {
            return 0;
        }

        const rarityAndStars = char.stars + char.rarity;

        return (
            rarityAndStars * rarityAndStars +
            char.activeAbilityLevel * char.activeAbilityLevel +
            char.passiveAbilityLevel * char.passiveAbilityLevel +
            char.rank * char.rank * char.rank
        );
    };

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
                factionPower: sum(charactersByFaction[x].map(getCharacterPower)),
                factionMaxPower: sum(
                    charactersByFaction[x]
                        .map(char => ({
                            ...char,
                            stars: RarityStars.BlueStar,
                            activeAbilityLevel: 50,
                            passiveAbilityLevel: 50,
                            rank: Rank.Diamond2,
                            rarity: Rarity.Legendary,
                        }))
                        .map(getCharacterPower)
                ),
                unlockedCount: charactersByFaction[x].filter(x => x.rank > Rank.Locked).length,
            }));

        return factionsOrdered.map(x => (
            <div key={x.faction} style={{ minWidth: 375 }}>
                <h4 style={{ background: x.chars[0].factionColor, marginBottom: 0, marginTop: 5 }}>
                    {x.faction.toUpperCase()}
                    {/*- {Math.floor((x.factionPower / x.factionMaxPower) * 100)}%{' '}*/}
                    {/*{x.factionPower}/{x.factionMaxPower}*/}
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
            }}>
            <TextField
                sx={{ margin: '10px', width: '300px' }}
                label="Quick Filter"
                variant="outlined"
                onChange={event => setFilter(event.target.value)}
            />
            <div style={{ display: 'flex', flexWrap: 'wrap', columnGap: 25 }}>{charactersByFaction}</div>
        </Box>
    );
};
