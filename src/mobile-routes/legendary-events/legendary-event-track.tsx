import React, { useContext, useEffect, useState } from 'react';
import { ICharacter2, ILegendaryEventTrack } from '../../models/interfaces';
import { Checkbox, FormControlLabel, FormGroup } from '@mui/material';
import { LegendaryEventEnum } from '../../models/enums';
import { CharacterTitle } from '../../shared-components/character-title';
import { StoreContext } from '../../reducers/store.provider';

export const LegendaryEventTrack = (props: { track: ILegendaryEventTrack; eventId: LegendaryEventEnum }) => {
    const [characters, setCharacters] = useState<ICharacter2[]>(props.track.allowedUnits);
    const [restrictions, setRestrictions] = useState<string[]>([]);

    useEffect(() => {
        setCharacters(props.track.allowedUnits);
        setRestrictions([]);
    }, [props.eventId]);

    const { autoTeamsPreferences, viewPreferences } = useContext(StoreContext);

    const handleChange = (selected: boolean, restrictionName: string) => {
        if (selected) {
            setRestrictions([...restrictions, restrictionName]);
        } else {
            setRestrictions(restrictions.filter(x => x !== restrictionName));
        }
    };

    useEffect(() => {
        setCharacters(props.track.suggestTeam(autoTeamsPreferences, viewPreferences.onlyUnlocked, restrictions));
    }, [restrictions, autoTeamsPreferences, viewPreferences.onlyUnlocked]);

    return (
        <div>
            <FormGroup style={{ display: 'flex', flexDirection: 'row' }}>
                {props.track.unitsRestrictions.map(x => (
                    <FormControlLabel
                        key={x.name}
                        control={
                            <Checkbox
                                onChange={event => handleChange(event.target.checked, x.name)}
                                inputProps={{ 'aria-label': 'controlled' }}
                            />
                        }
                        label={`${x.name} (${x.points})`}
                    />
                ))}
            </FormGroup>
            <ol>
                {characters.map(x => (
                    <li key={x.name} style={{ marginBottom: 10 }}>
                        <CharacterTitle character={x} imageSize={30} /> ({x.legendaryEvents[props.eventId].totalPoints}{' '}
                        pts/ {x.legendaryEvents[props.eventId].totalSlots} slots)
                    </li>
                ))}
            </ol>
        </div>
    );
};
