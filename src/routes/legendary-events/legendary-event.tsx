import React, { useContext, useState } from 'react';

import { ILegendaryEvent, ILegendaryEventData3, LegendaryEventSection } from '../../models/interfaces';
import { ViewSettingsContext } from '../../contexts';
import { LegendaryEventTrack } from './legendary-event-track';
import { SelectedTeamsTable } from './selected-teams-table';
import { GlobalService } from '../../services';

import DataTablesDialog from './data-tables-dialog';
import { Info } from '@mui/icons-material';
import { Tooltip } from '@mui/material';

const LegendaryEvent = (props: {
    legendaryEvent: ILegendaryEvent;
    legendaryEventPersonal: ILegendaryEventData3;
    legendaryEventPersonalChange: (selectedTeams: ILegendaryEventData3) => void;
}) => {
    const viewPreferences = useContext(ViewSettingsContext);
    const { legendaryEventPersonal, legendaryEvent, legendaryEventPersonalChange } = props;
    
    const [selectedTeams, setSelectedTeams] = useState({
        alpha: legendaryEventPersonal.alpha,
        beta: legendaryEventPersonal.beta,
        gamma: legendaryEventPersonal.gamma,
    });
    
    const selectChars = (section: LegendaryEventSection) => ( team: string, ...chars: string[]) => {
        setSelectedTeams((value) => {
            const currentTeam = value[section][team] ?? [];
            if(currentTeam.length === 5) {
                return value;
            }

            const newChars = chars.filter(x => !currentTeam.includes(x));

            if(!newChars.length) {
                return value;
            }
            value[section] = {
                ...value[section],
                [team]: [...currentTeam, ...newChars].slice(0,5).filter(x => !!x)
            };
            const newValue = { ...value };
            legendaryEventPersonalChange( { id: legendaryEvent.id, ...newValue });
            return newValue;
            
        });
    };

    const deselectChars = (section: LegendaryEventSection) => ( team: string, ...chars: string[]) => {
        setSelectedTeams((value) => {
            const currentTeam = value[section][team];

            value[section] = {
                ...value[section],
                [team]: currentTeam.filter(x => !chars.includes(x))
            };
            const newValue = { ...value };
            legendaryEventPersonalChange( { id: legendaryEvent.id, ...newValue });
            return newValue;
        });
    };
    

    return (
        <div>
            <div style={{ display: 'flex' }}>
                <span>Recommended teams</span>
                <Tooltip title={'Click - adds single char, Shift + Click - adds top 5 chars'}><Info/></Tooltip>
            </div>
            <div style={{ display: 'flex', gap: 15, marginBottom: 5 }}>
                {viewPreferences.showAlpha ? (<LegendaryEventTrack key={legendaryEvent.alphaTrack.name + legendaryEvent.id} track={legendaryEvent.alphaTrack} selectChars={selectChars('alpha')}/>) : undefined }
                {viewPreferences.showBeta ? (<LegendaryEventTrack key={legendaryEvent.betaTrack.name + legendaryEvent.id} track={legendaryEvent.betaTrack} selectChars={selectChars('beta')}/>) : undefined }
                {viewPreferences.showGamma ? (<LegendaryEventTrack key={legendaryEvent.gammaTrack.name + legendaryEvent.id} track={legendaryEvent.gammaTrack} selectChars={selectChars('gamma')}/>) : undefined }
            </div>
            <div style={{ display: 'flex' }}>
                <span>Selected teams</span>
                <Tooltip title={'Click - removes single char, Shift + Click - remove whole team'}><Info/></Tooltip>
            </div>
            <div style={{ display: 'flex', gap: 15 }}>
                {viewPreferences.showAlpha ? (<SelectedTeamsTable key={legendaryEvent.alphaTrack.name + legendaryEvent.id} track={legendaryEvent.alphaTrack} characters={GlobalService.characters} teams={selectedTeams.alpha} deselectChars={deselectChars('alpha')}/>) : undefined }
                {viewPreferences.showBeta ? (<SelectedTeamsTable key={legendaryEvent.betaTrack.name + legendaryEvent.id} track={legendaryEvent.betaTrack} characters={GlobalService.characters} teams={selectedTeams.beta} deselectChars={deselectChars('beta')}/> ) : undefined }
                {viewPreferences.showGamma ? (<SelectedTeamsTable key={legendaryEvent.gammaTrack.name + legendaryEvent.id} track={legendaryEvent.gammaTrack} characters={GlobalService.characters} teams={selectedTeams.gamma} deselectChars={deselectChars('gamma')}/>) : undefined }
            </div>
            <DataTablesDialog legendaryEvent={legendaryEvent} ></DataTablesDialog>
        </div>
    );
};

export default LegendaryEvent;