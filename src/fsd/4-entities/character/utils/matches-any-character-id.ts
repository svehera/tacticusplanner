import { ICharacter2 } from '../model';

/**
 * Takes a character id and character object, and returns true if the id matches the object.
 *
 * The app has multiple "id" concepts for looking up characters, and different parts of the app
 * have used different concepts in the past.
 *
 * This function helps consolidate those concepts.
 */
export function matchesAnyCharacterId(id: string, character: ICharacter2): boolean {
    const lowered = id.toLowerCase();

    return (
        id === character.snowprintId ||
        lowered === character.id.toLowerCase() ||
        lowered === character.shortName.toLowerCase() ||
        lowered === character.fullName.toLowerCase()
    );
}
