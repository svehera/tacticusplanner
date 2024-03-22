import React, { ReactElement } from 'react';
import { ICharacter2 } from 'src/models/interfaces';
import { CharacterTile } from 'src/v2/features/characters/components/character-tile';
import { CharactersService } from 'src/v2/features/characters/characters.service';

import './team.scss';

type Props = {
    characters: ICharacter2[];
    teamName: string;
    size?: 5 | 7;
    teamIcon?: ReactElement;
    teamColor?: string;
};

export const Team: React.FC<Props> = ({ characters, size = 5, teamColor, teamIcon, teamName }) => {
    const unsetCharacter = CharactersService.unsetCharacter as ICharacter2;

    return (
        <div className="team">
            <h4 className="team-title" style={{ backgroundColor: teamColor }}>
                <div className="team-icon">
                    {teamIcon}
                    <span>{teamName.toUpperCase()}</span>
                </div>
            </h4>
            <div className="team-characters-box">
                {Array.from({ length: size }, (_, i) => {
                    const char = characters[i];

                    if (char) {
                        return <CharacterTile key={char.name} character={char} />;
                    }

                    return <CharacterTile key={unsetCharacter.name + i} character={unsetCharacter} disableClick />;
                })}
            </div>
        </div>
    );
};
