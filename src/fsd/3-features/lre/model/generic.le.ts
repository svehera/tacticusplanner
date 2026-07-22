import { ICharacter2 } from '@/fsd/4-entities/character';
import {
    allLegendaryEvents,
    ILegendaryEventStatic,
    LegendaryEventEnum,
    LreTrackId,
    newFormatLegendaryEventData,
} from '@/fsd/4-entities/lre';

import { ILegendaryEventTrack, ILegendaryEventTrackRequirement } from '../lre.model';

import { LegendaryEventBase } from './base.le';
import { LETrack } from './base.le.track';
import { applyObjective, objectiveDisplayName } from './objective-dispatch';

function getStaticData(id: LegendaryEventEnum): ILegendaryEventStatic {
    const found = allLegendaryEvents.find(event => event.id === id);
    if (!found) throw new Error(`No static LRE data for id ${id}`);
    return found;
}

/**
 * A single event class for every event backed by the machine-generated data
 * (`newFormatLegendaryEventData`, joined with `allLegendaryEvents`'s static entries).
 * Replaces the hand-rolled per-event subclasses for those events — see
 * `objective-dispatch.ts` for how `bonusObjectives` become unit-eligibility filters.
 */
export class GenericLegendaryEvent extends LegendaryEventBase {
    constructor(unitsData: ICharacter2[], id: LegendaryEventEnum) {
        super(unitsData, getStaticData(id));
    }

    protected getAlphaTrack(unitsData: ICharacter2[]): ILegendaryEventTrack {
        return this.buildTrack('alpha', unitsData);
    }

    protected getBetaTrack(unitsData: ICharacter2[]): ILegendaryEventTrack {
        return this.buildTrack('beta', unitsData);
    }

    protected getGammaTrack(unitsData: ICharacter2[]): ILegendaryEventTrack {
        return this.buildTrack('gamma', unitsData);
    }

    private buildTrack(section: LreTrackId, unitsData: ICharacter2[]): ILegendaryEventTrack {
        const staticTrack = getStaticData(this.id)[section];
        const trackData = newFormatLegendaryEventData[this.id][section];

        const allowedUnits = unitsData.filter(unit => !trackData.disallowedFactions.includes(unit.faction));

        const unitsRestrictions: ILegendaryEventTrackRequirement[] = trackData.bonusObjectives.map(
            (objective, index) => ({
                name: objectiveDisplayName(objective.type, objective.target),
                points: objective.points,
                objectiveType: objective.type,
                objectiveTarget: objective.target,
                units: applyObjective(allowedUnits, objective.type, objective.target),
                index,
            })
        );

        return new LETrack(this.id, section, allowedUnits, unitsRestrictions, staticTrack);
    }
}
