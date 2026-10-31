import { useState } from 'react';

import { dismissV2BetaBanner, isV2BetaBannerVisible, v2BetaAnnouncementLink, v2BetaLink } from './v2-beta-banner';

export const V2BetaBanner = () => {
    const [isVisible, setIsVisible] = useState(() => isV2BetaBannerVisible());

    if (!isVisible) return <></>;

    const hide = () => {
        dismissV2BetaBanner();
        setIsVisible(false);
    };

    return (
        <section
            aria-labelledby="v2-beta-banner-title"
            data-testid="v2-beta-banner"
            className="mx-auto mb-4 flex max-w-[720px] flex-col items-center justify-between gap-3 rounded-xl border border-(--primary)/35 bg-(--card) px-4 py-3 text-center shadow-sm sm:flex-row sm:text-left">
            <div>
                <p id="v2-beta-banner-title" className="inline-flex items-center gap-2 font-semibold">
                    <span className="size-2 rounded-full bg-(--primary)" />
                    Tacticus Planner V2 is in public beta
                </p>
                <p className="text-sm text-(--soft-fg)">
                    Try the rebuilt planner and claim a promo code on its home page. The code is valid until 7 November.{' '}
                    <a
                        href={v2BetaAnnouncementLink}
                        target="_blank"
                        rel="noreferrer"
                        data-testid="v2-beta-banner-announcement"
                        className="underline">
                        Read the announcement
                    </a>
                </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
                <a
                    href={v2BetaLink}
                    target="_blank"
                    rel="noreferrer"
                    onClick={hide}
                    data-testid="v2-beta-banner-try"
                    className="inline-flex items-center justify-center rounded-lg bg-(--primary) px-3 py-2 text-sm font-semibold text-(--primary-fg) transition-transform hover:scale-[1.03] active:scale-[0.98]">
                    Give it a try
                </a>
                <button
                    type="button"
                    onClick={hide}
                    data-testid="v2-beta-banner-later"
                    className="inline-flex cursor-pointer items-center justify-center rounded-lg px-3 py-2 text-sm font-semibold text-(--soft-fg) transition-colors hover:bg-(--primary)/10 hover:text-(--fg)">
                    Later
                </button>
            </div>
        </section>
    );
};
