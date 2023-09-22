import React from 'react';
import { useCharacters } from '../../services';
import { groupBy } from 'lodash';
import { CharacterItem } from './character-item';

export const Characters = () => {
    const { characters } = useCharacters();

    const groupedByFaction = groupBy(characters, 'faction');
    
    const itemList = [];

    for (const testKey in groupedByFaction) {
        const chars = groupedByFaction[testKey];
        itemList.push(<div key={testKey}>
            <h4>{testKey}</h4>

            {chars.map((item) => {
                return <CharacterItem key={item.name} character={item}/>;
            })}
        </div>);
    }

    return (
        <div>
            {itemList}
        </div>
    );
};
