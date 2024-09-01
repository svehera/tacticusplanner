import { useTitle } from 'src/contexts/title.context';
import { useQueryState } from 'src/v2/hooks/query-state';
import { LegendaryEventEnum } from 'src/models/enums';
import { useEffect } from 'react';
import { StaticDataService } from 'src/services';

export const useLre = () => {
    const { setHeaderTitle } = useTitle();
    const [legendaryEvent] = useQueryState<LegendaryEventEnum>(
        'character',
        initQueryParam =>
            initQueryParam
                ? (LegendaryEventEnum[initQueryParam as keyof typeof LegendaryEventEnum] as LegendaryEventEnum)
                : LegendaryEventEnum.Mephiston,
        value => LegendaryEventEnum[value]
    );

    useEffect(() => {
        const relatedLre = StaticDataService.lreCharacters.find(x => x.lre!.id === legendaryEvent);
        if (relatedLre) {
            setHeaderTitle(
                relatedLre.lre!.finished
                    ? `${relatedLre.name} (Finished)`
                    : `${relatedLre.name} ${relatedLre.lre!.eventStage}/3 (${relatedLre.lre!.nextEventDate})`
            );
        }
    }, [legendaryEvent]);

    return { legendaryEvent };
};
