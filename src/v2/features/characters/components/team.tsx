import React, { ReactElement } from 'react';
import { ICharacter2 } from 'src/models/interfaces';
import { CharacterTile } from 'src/v2/features/characters/components/character-tile';
import { unsetCharacter } from 'src/v2/features/characters/characters.contants';

import './team.scss';
import { Conditional } from 'src/v2/components/conditional';
import { MiscIcon } from 'src/v2/components/images/misc-image';

type Props = {
    characters: ICharacter2[];
    teamName: string;
    size?: 5 | 7;
    teamIcon?: ReactElement;
    teamBenchmark?: ReactElement;
    teamColor?: string;
};

export const Team: React.FC<Props> = ({ characters, size = 5, teamColor, teamIcon, teamBenchmark, teamName }) => {
    const fallbackCharacter = unsetCharacter as ICharacter2;

    return (
        <div className="team-characters-box">
            {Array.from({ length: size }, (_, i) => {
                const char = characters[i];

                if (char) {
                    return <CharacterTile key={char.name} character={char} />;
                }

                return <CharacterTile key={fallbackCharacter.name + i} character={fallbackCharacter} disableClick />;
            })}
        </div>
    );
};

// <div className="team">
{
    /*<h4 className="team-title" style={{ backgroundColor: teamColor }}>*/
}
{
    /*    <div className="team-icon">*/
}
{
    /*        {teamIcon}*/
}
{
    /*        <span>{teamName.toUpperCase()}</span>*/
}
{
    /*    </div>*/
}
{
    /*    <Conditional condition={!!teamBenchmark}>*/
}
{
    /*        <div className="team-benchmark">{teamBenchmark}</div>*/
}
{
    /*    </Conditional>*/
}
{
    /*</h4>*/
}

{
    /*</div>*/
}
