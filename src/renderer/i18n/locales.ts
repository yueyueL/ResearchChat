import { Language } from '../../shared/types'

export const languageNameMap = {
    en: 'English',
    'zh-Hans': '简体中文',
}

export const languages = Array.from(Object.keys(languageNameMap)) as Language[]
