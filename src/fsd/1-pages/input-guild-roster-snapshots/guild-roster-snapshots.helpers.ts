import { TacticusUnit } from '@/fsd/5-shared/lib';
import { Rank, UnitType } from '@/fsd/5-shared/model';
import { ISnapshotCharacter, ISnapshotMachineOfWar } from '@/fsd/5-shared/ui/unit-portrait';

import { CharactersService } from '@/fsd/4-entities/character';
import { EquipmentService, IEquipment } from '@/fsd/4-entities/equipment';
import { MowsService } from '@/fsd/4-entities/mow';
import { CharactersPowerService } from '@/fsd/4-entities/unit';

import { TacticusIntegrationService } from '@/fsd/3-features/tacticus-integration';

import {
    API_KEY_PATTERN,
    GuildApiError,
    MemberState,
    OverrideRow,
    ParsedRoster,
    ParsedUnit,
} from './guild-roster-snapshots.models';

export function parseUnits(units: TacticusUnit[]): ParsedRoster {
    const parsed: ParsedUnit[] = [];

    for (const unit of units) {
        const staticMow = MowsService.resolveToStatic(unit.id);
        if (staticMow) {
            const [rarity, stars] = TacticusIntegrationService.convertProgressionIndex(unit.progressionIndex);
            const mow: ISnapshotMachineOfWar = {
                id: unit.id,
                rarity,
                stars,
                primaryAbilityLevel: unit.abilities[0].level,
                secondaryAbilityLevel: unit.abilities[1].level,
                shards: unit.shards,
                mythicShards: unit.mythicShards ?? 0,
                locked: false,
            };
            const mowProxy = {
                unitType: UnitType.mow,
                unlocked: true,
                rarity,
                stars,
                primaryAbilityLevel: mow.primaryAbilityLevel,
                secondaryAbilityLevel: mow.secondaryAbilityLevel,
            };
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const power = CharactersPowerService.getCharacterAbilityPower(mowProxy as any);
            parsed.push({ mow, power });
            continue;
        }

        const staticChar = CharactersService.resolveCharacter(unit.id);
        if (staticChar) {
            const [rarity, stars] = TacticusIntegrationService.convertProgressionIndex(unit.progressionIndex);
            const rank = (unit.rank + 1) as Rank;
            const equipment: { equip: IEquipment; level: number }[] = [];
            for (const equip of unit.items) {
                const converted = EquipmentService.convertTacticusEquipmentData(equip);
                if (converted) equipment.push({ equip: converted, level: equip.level });
            }

            const char: ISnapshotCharacter = {
                id: unit.id,
                rank,
                rarity,
                stars,
                shards: unit.shards,
                mythicShards: unit.mythicShards ?? 0,
                activeAbilityLevel: unit.abilities[0].level,
                passiveAbilityLevel: unit.abilities[1].level,
                xpLevel: unit.xpLevel,
                equip0: equipment[0]?.equip,
                equip1: equipment[1]?.equip,
                equip2: equipment[2]?.equip,
                equip0Level: equipment[0]?.level,
                equip1Level: equipment[1]?.level,
                equip2Level: equipment[2]?.level,
            };
            const charProxy = {
                unitType: UnitType.character,
                rank,
                rarity,
                stars,
                activeAbilityLevel: char.activeAbilityLevel,
                passiveAbilityLevel: char.passiveAbilityLevel,
                upgrades: unit.upgrades,
            };
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const power = CharactersPowerService.getCharacterPower(charProxy as any);
            parsed.push({ char, power });
        }
    }

    parsed.sort((a, b) => b.power - a.power);
    return { units: parsed };
}

export function parseErrorState(id: string, error: unknown): MemberState {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const httpStatus = (error as any)?.response?.status as number | undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body = (error as any)?.response?.data as GuildApiError | undefined;

    if (httpStatus === 404) return { status: 'not-shared' };
    if (httpStatus === 403) return { status: 'name-only', playerName: body?.data?.playerName ?? id };

    const message =
        typeof error === 'string'
            ? error
            : JSON.stringify(body ?? (error as Record<string, unknown>)?.message ?? error, undefined, 2);
    return { status: 'error', message };
}

export function parseCsvText(text: string): { imported: OverrideRow[]; discarded: string[] } {
    const lines = text
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean);
    const imported: OverrideRow[] = [];
    const discarded: string[] = [];

    for (const [index, line] of lines.entries()) {
        const lineNumber = index + 1;
        const fields: string[] = [];
        let current = '';
        let inQuote = false;
        for (const ch of line) {
            if (ch === '"') {
                inQuote = !inQuote;
            } else if (ch === ',' && !inQuote) {
                fields.push(current);
                current = '';
            } else {
                current += ch;
            }
        }
        fields.push(current);

        if (fields.length < 2 || fields.length > 3) {
            discarded.push(`Row ${lineNumber}: expected 2–3 columns, got ${fields.length}`);
            continue;
        }

        const [userId, name, apiKey = ''] = fields.map(field => field.trim());

        if (!userId) {
            discarded.push(`Row ${lineNumber}: userId is empty`);
            continue;
        }
        if (name.length > 40) {
            discarded.push(`Row ${lineNumber}: name exceeds 40 characters`);
            continue;
        }
        if (apiKey && !API_KEY_PATTERN.test(apiKey)) {
            discarded.push(`Row ${lineNumber}: apiKey contains invalid characters`);
            continue;
        }

        imported.push({ userId, name, apiKey });
    }

    return { imported, discarded };
}

export function buildCsv(rows: OverrideRow[]): string {
    const header = 'userId,name,apiKey';
    const csvRows = rows.map(row =>
        [JSON.stringify(row.userId), JSON.stringify(row.name), JSON.stringify(row.apiKey)].join(',')
    );
    return [header, ...csvRows].join('\n');
}
