import React, { useContext, useEffect, useMemo, useState } from 'react';

// eslint-disable-next-line import-x/no-internal-modules
import { StoreContext } from '@/reducers/store.provider';

import { useQueryState } from '@/fsd/5-shared/lib';
import { useTitle } from '@/fsd/5-shared/ui/contexts';

import { CharactersService, ICharacter2 } from '@/fsd/4-entities/character';
import { LegendaryEventEnum, LegendaryEventService } from '@/fsd/4-entities/lre';

import { getLre } from '@/fsd/3-features/lre';

import { LreSection } from './lre.models';

export const useLre = () => {
    const { setHeaderTitle } = useTitle();
    const { characters } = useContext(StoreContext);
    const resolvedCharacters = useMemo(() => {
        return characters.map(x => {
            const ret: ICharacter2 = { ...x };
            const staticChar = CharactersService.resolveCharacter(x.snowprintId ?? x.name);
            ret.name = staticChar?.snowprintId ?? x.name;
            return ret;
        });
    }, [characters]);

    const [legendaryEventId] = useQueryState<LegendaryEventEnum>(
        'character',
        initQueryParam =>
            initQueryParam
                ? (LegendaryEventEnum[initQueryParam as keyof typeof LegendaryEventEnum] as LegendaryEventEnum)
                : LegendaryEventEnum.Mephiston,
        value => LegendaryEventEnum[value]
    );

    const [section, setSection] = useQueryState<LreSection>(
        'section',
        initQueryParam => (initQueryParam ? +initQueryParam : LreSection.teams),
        value => value.toString()
    );

    const [showSettings, setShowSettings] = useState(false);

    const openSettings = () => setShowSettings(true);
    const closeSettings = () => setShowSettings(false);

    const changeTab = (_: React.SyntheticEvent, value: LreSection) => setSection(value);

    useEffect(() => {
        const lreChar = CharactersService.getLreCharacter(legendaryEventId);
        if (lreChar) {
            const relatedLre = LegendaryEventService.getEventByCharacterSnowprintId(lreChar!.snowprintId!);
            const nextDate = relatedLre?.nextEventDate ?? 'TBA';
            setHeaderTitle(
                !relatedLre || relatedLre.finished
                    ? `${lreChar.name} (Finished)`
                    : `${lreChar.name} ${relatedLre!.eventStage}/3 (${nextDate})`
            );
        }
    }, [legendaryEventId]);

    const legendaryEvent = useMemo(() => getLre(legendaryEventId, resolvedCharacters), [legendaryEventId]);

    return { legendaryEvent, section, showSettings, openSettings, closeSettings, changeTab };
};
