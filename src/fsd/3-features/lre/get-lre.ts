import { ICharacter2 } from '@/fsd/4-entities/character';
import { LegendaryEventEnum } from '@/fsd/4-entities/lre';

import {
    AunShiLegendaryEvent,
    GenericLegendaryEvent,
    KharnLegendaryEvent,
    MephistonLegendaryEvent,
    PatermineLegendaryEvent,
    RagnarLegendaryEvent,
    ShadowSunLegendaryEvent,
    VitruviusLegendaryEvent,
} from './model';

const GENERIC_EVENT_IDS: ReadonlySet<LegendaryEventEnum> = new Set([
    LegendaryEventEnum.Dante,
    LegendaryEventEnum.Trajann,
    LegendaryEventEnum.Lucius,
    LegendaryEventEnum.Farsight,
    LegendaryEventEnum.Uthar,
    LegendaryEventEnum.Lysander,
]);

export const getLre = (id: LegendaryEventEnum, characters: ICharacter2[]) => {
    if (GENERIC_EVENT_IDS.has(id)) {
        return new GenericLegendaryEvent(characters, id);
    }
    switch (id) {
        case LegendaryEventEnum.AunShi: {
            return new AunShiLegendaryEvent(characters);
        }
        case LegendaryEventEnum.Kharn: {
            return new KharnLegendaryEvent(characters);
        }
        case LegendaryEventEnum.Mephiston: {
            return new MephistonLegendaryEvent(characters);
        }
        case LegendaryEventEnum.Patermine: {
            return new PatermineLegendaryEvent(characters);
        }
        case LegendaryEventEnum.Ragnar: {
            return new RagnarLegendaryEvent(characters);
        }
        case LegendaryEventEnum.Shadowsun: {
            return new ShadowSunLegendaryEvent(characters);
        }
        case LegendaryEventEnum.Vitruvius: {
            return new VitruviusLegendaryEvent(characters);
        }
        default: {
            return new ShadowSunLegendaryEvent(characters);
        }
    }
};
