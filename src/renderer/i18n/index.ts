import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from './locales/en/translation.json'
import zhHans from './locales/zh-Hans/translation.json'


import changelogZhHans from './changelogs/changelog_zh_Hans'
import changelogEn from './changelogs/changelog_en'

i18n.use(initReactI18next).init({
    resources: {
        'zh-Hans': {
            translation: zhHans,
        },
        en: {
            translation: en,
        },

    },
    fallbackLng: 'en',

    interpolation: {
        escapeValue: false,
    },

    detection: {
        caches: [],
    },
})

export default i18n

export function changelog() {
    switch (i18n.language) {
        case 'zh-Hans':
            return changelogZhHans
        case 'en':
            return changelogEn
        default:
            return changelogEn
    }
}
