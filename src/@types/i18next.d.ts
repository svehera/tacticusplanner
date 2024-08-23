import 'i18next';
import translation from '../i18n//en/translation.json';

declare module 'i18next' {
    interface CustomTypeOptions {
        resources: {
            translation: typeof translation;
        };
    }
}
