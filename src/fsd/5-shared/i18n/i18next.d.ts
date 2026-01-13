import 'i18next';

// eslint-disable-next-line import-x/no-internal-modules
import translation from '@/fsd/5-shared/data/i18n/en.json';

declare module 'i18next' {
    interface CustomTypeOptions {
        resources: {
            translation: typeof translation;
        };
    }
}
