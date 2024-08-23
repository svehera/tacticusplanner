import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslation from './en/translation.json';
import ukTranslation from './uk/translation.json';

i18next.use(initReactI18next).init({
    lng: 'uk',
    fallbackLng: 'en',
    debug: import.meta.env.DEV,
    resources: {
        en: {
            translation: enTranslation,
        },
        uk: {
            translation: ukTranslation,
        },
    },
    // if you see an error like: "Argument of type 'DefaultTFuncReturn' is not assignable to parameter of type xyz"
    // set returnNull to false (and also in the i18next.d.ts options)
    // returnNull: false,
});
