import { Language } from '../../shared/types'

export function parseLocale(locale: string): Language {
    if (
        locale === 'zh' ||
        locale.startsWith('zh_CN') ||
        locale.startsWith('zh-CN') ||
        locale.startsWith('zh_Hans') ||
        locale.startsWith('zh-Hans')
    ) {
        return 'zh-Hans'
    }
    return 'en'
}
