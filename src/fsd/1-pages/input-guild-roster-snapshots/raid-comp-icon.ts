/* eslint-disable import-x/no-internal-modules -- cross-entity import required */
import { CharactersService } from '@/fsd/4-entities/character/characters.service';
import { MowsService } from '@/fsd/4-entities/mow';

import { RAID_COMP_IS_MOW, RAID_COMP_SNOWPRINT_ID, type RaidComp } from './guild-roster-snapshots.models';

export interface RaidCompIconProps {
    icon: string;
    name: string;
}

export function getRaidCompIconProps(comp: RaidComp): RaidCompIconProps {
    const id = RAID_COMP_SNOWPRINT_ID[comp];
    if (RAID_COMP_IS_MOW[comp]) {
        const mow = MowsService.resolveToStatic(id);
        return { icon: mow?.roundIcon ?? '', name: mow?.name ?? comp };
    }
    const char = CharactersService.getUnit(id);
    return { icon: char?.roundIcon ?? '', name: char?.name ?? comp };
}
