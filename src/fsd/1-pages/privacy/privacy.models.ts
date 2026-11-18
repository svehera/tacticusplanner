export const privacyLastUpdated = 'October 29, 2026';

export const privacyIntro =
    'Tacticus Planner is an unofficial, open-source fan project for the game Tacticus. This page explains what the planner stores about you, why, and how to remove it.';

export const privacySections: readonly { title: string; body: string }[] = [
    {
        title: 'Signing in',
        body: 'Sign-in is handled by Microsoft Entra External ID. The planner never sees your password. It keeps the sign-in identifier Microsoft returns, the planner name you choose, and when you last used the planner. If you sign in with Google, Google shares your name and email address with Microsoft to sign you in. Your account menu shows your email and which sign-in method you used; the planner reads them from your sign-in and does not store them.',
    },
    {
        title: 'Your Tacticus API key',
        body: 'If you add a Tacticus API key, it is stored encrypted and used only to read your game and guild data from the Tacticus API. You can replace it at any time in Account settings.',
    },
    {
        title: 'Planner data',
        body: "To work across your devices, the planner stores your synced game data, goals, projects, event plans, guild data and settings on its server. A copy is kept in your browser's local storage so pages load quickly; signing out deletes that copy.",
    },
    {
        title: 'Cookies and browser storage',
        body: "The planner sets no advertising cookies. It keeps what it needs in your browser's storage: your sign-in session, your language and theme, and the local copy of your planner data. For signed-in users only, PostHog analytics keeps its pseudonymous id in a first-party cookie and local storage. Microsoft's sign-in pages set their own cookies to keep you signed in, under Microsoft's privacy statement.",
    },
    {
        title: 'Analytics and error reports',
        body: 'Browsing without an account sends no analytics. For signed-in users, usage events and uncaught errors are sent to PostHog under a pseudonymous id. There is no autocapture or session replay, and the reports never include what you type into the planner, your email address or your planner name.',
    },
    {
        title: 'Feedback board',
        body: "The feedback board is run on UserJot. When you open it from the planner's own feedback button or account menu while signed in, the planner identifies you to UserJot with a signed token for your planner account and planner name, so your posts and votes are attributed to you. Opening the public board link, such as the one in the footer, sends nothing from the planner.",
    },
    {
        title: 'Aggregated and anonymized data',
        body: 'The maintainers may use aggregated and anonymized data for community projects. The maintainers may use individual or non-anonymized data only for investigation, and for fixing issues.',
    },
    {
        title: 'No ads, no selling',
        body: 'The planner shows no ads and does not sell or share your data with anyone beyond the services named on this page.',
    },
    {
        title: 'Deleting your data',
        body: 'You can delete your account in Account settings, on the Account tab, with "Purge my account". You choose whether to delete only your planner data or also your planner sign-in account (Microsoft Entra External ID). Deleting the sign-in account is attempted, and your planner data is deleted even if that step fails. Your Google account is not affected. This takes effect immediately and cannot be undone.',
    },
];
