import 'i18next';
import translation from './en.json';

declare module 'i18next' {
    interface CustomTypeOptions {
        resources: {
            translation: typeof translation;
        };
    }
}
