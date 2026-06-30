/**
 * A Tacticus API key (personal or guild) and the Tacticus user ID are all UUIDs
 * in the canonical 8-4-4-4-12 hex form. The version/variant nibbles are not
 * enforced so the check keeps working if Tacticus ever changes UUID version.
 */
const TACTICUS_UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidTacticusUuid(value: string): boolean {
    return TACTICUS_UUID_REGEX.test(value);
}
