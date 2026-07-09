/* eslint-disable boundaries/element-types */
import { Alliance } from '@/fsd/5-shared/model';

import { CharactersService } from '@/fsd/4-entities/character';
import { EquipmentService } from '@/fsd/4-entities/equipment';

import { IMythicQuestReward } from './model';

const ALLIANCE_SUFFIX_RE = '(Imperial|Chaos|Xenos)';

/** Parses a mythic quest reward string like "mythicShards_blackAbaddon:4" or a bare equipment ID
 *  like "I_Crit_M006" into a structured, render-agnostic descriptor. */
export function parseMythicQuestReward(reward: string): IMythicQuestReward {
    const colonIndex = reward.indexOf(':');
    const type = colonIndex === -1 ? reward : reward.slice(0, colonIndex);
    const quantityString = colonIndex === -1 ? undefined : reward.slice(colonIndex + 1);
    const quantity = quantityString === undefined ? undefined : Number.parseInt(quantityString, 10);

    const shardMatch = /^mythicShards_(.+)$/.exec(type);
    if (shardMatch) {
        const characterId = shardMatch[1];
        const characterName = CharactersService.charactersBySnowprintId[characterId]?.name ?? characterId;
        return { icon: { kind: 'shard', characterId }, label: `${characterName} Mythic Shards`, quantity };
    }

    const orbMatch = new RegExp(`^heroAscensionOrbMythic_${ALLIANCE_SUFFIX_RE}$`).exec(type);
    if (orbMatch) {
        const alliance = orbMatch[1] as Alliance;
        return { icon: { kind: 'ascensionOrb', alliance }, label: `Mythic ${alliance} Ascension Orb`, quantity };
    }

    const tokenMatch = new RegExp(`^abilityTokenMythic_${ALLIANCE_SUFFIX_RE}$`).exec(type);
    if (tokenMatch) {
        const alliance = tokenMatch[1] as Alliance;
        return { icon: { kind: 'abilityToken', alliance }, label: `Mythic ${alliance} Badge`, quantity };
    }

    if (type === 'xpMythic') {
        return { icon: { kind: 'xp' }, label: 'Grimoire (Mythic XP Book)', quantity };
    }

    if (type === 'gold') {
        return { icon: { kind: 'gold' }, label: 'Gold', quantity };
    }

    if (type.startsWith('I_') || type.startsWith('R_')) {
        const equipment = EquipmentService.equipmentData.find(item => item.id === type);
        return { icon: { kind: 'equipment', equipmentId: type }, label: equipment?.name ?? type, quantity };
    }

    return { icon: { kind: 'unknown', raw: type }, label: type, quantity };
}
