import { ICharacter2 } from '@/fsd/4-entities/character';
import { LegendaryEventEnum } from '@/fsd/4-entities/lre';

import {
    AunShiLegendaryEvent,
    TrajannLegendaryEvent,
    DanteLegendaryEvent,
    KharnLegendaryEvent,
    MephistonLegendaryEvent,
    PatermineLegendaryEvent,
    RagnarLegendaryEvent,
    ShadowSunLegendaryEvent,
    VitruviusLegendaryEvent,
} from './model';

export const getLre = (id: LegendaryEventEnum, characters: ICharacter2[]) => {
    switch (id) {
        case LegendaryEventEnum.AunShi:
            return new AunShiLegendaryEvent(characters);
        case LegendaryEventEnum.Trajann:
            return new TrajannLegendaryEvent(characters);
        case LegendaryEventEnum.Dante:
            return new DanteLegendaryEvent(characters);
        case LegendaryEventEnum.Kharn:
            return new KharnLegendaryEvent(characters);
        case LegendaryEventEnum.Mephiston:
            return new MephistonLegendaryEvent(characters);
        case LegendaryEventEnum.Patermine:
            return new PatermineLegendaryEvent(characters);
        case LegendaryEventEnum.Ragnar:
            return new RagnarLegendaryEvent(characters);
        case LegendaryEventEnum.Shadowsun:
            return new ShadowSunLegendaryEvent(characters);
        case LegendaryEventEnum.Vitruvius:
            return new VitruviusLegendaryEvent(characters);
        default:
            return new ShadowSunLegendaryEvent(characters);
    }
};
