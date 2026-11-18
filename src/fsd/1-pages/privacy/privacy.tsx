import { isMobile } from 'react-device-detect';

import { discordInvitationLink } from '@/fsd/5-shared/ui';

import { privacyIntro, privacyLastUpdated, privacySections } from './privacy.models';

export const Privacy = () => {
    return (
        <div className={`flex flex-col ${isMobile ? '' : 'mx-auto max-w-[800px]'}`}>
            <h1>Privacy &amp; cookies</h1>
            <p className="text-sm text-(--muted-fg)">Last updated {privacyLastUpdated}</p>
            <p>{privacyIntro}</p>
            {privacySections.map(({ title, body }) => (
                <section key={title}>
                    <h2>{title}</h2>
                    <p>{body}</p>
                </section>
            ))}
            <section>
                <h2>Contact</h2>
                <p>
                    Questions about this page or your data are welcome on our{' '}
                    <a href={discordInvitationLink} target="_blank" rel="noreferrer">
                        Discord server
                    </a>{' '}
                    or on{' '}
                    <a href="https://github.com/svehera/tacticusplanner" target="_blank" rel="noreferrer">
                        GitHub
                    </a>
                    .
                </p>
            </section>
        </div>
    );
};
