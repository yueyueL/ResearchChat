import OpenAI from './openai'
import { Settings, Config, ModelProvider, SessionType, ModelSettings, Session } from '../../../shared/types'
import ChatboxAI from './chatboxai'
import SiliconFlow from './siliconflow'

export function getModel(setting: Settings, config: Config) {
    switch (setting.aiProvider) {
        case ModelProvider.OpenAI:
            return new OpenAI(setting)
        case ModelProvider.SiliconFlow:
            return new SiliconFlow(setting)
        case ModelProvider.ChatboxAI:
            return new ChatboxAI(setting, config)
        default:
            throw new Error('Cannot find model with provider: ' + setting.aiProvider)
    }
}

export const aiProviderNameHash = {
    [ModelProvider.OpenAI]: 'OpenAI API',
    [ModelProvider.ChatboxAI]: 'Chatbox AI',
    [ModelProvider.SiliconFlow]: 'SiliconCloud API',
}

export const AIModelProviderMenuOptionList = [
    {
        value: ModelProvider.OpenAI,
        label: aiProviderNameHash[ModelProvider.OpenAI],
        featured: true,
        disabled: false,
    },
    {
        value: ModelProvider.SiliconFlow,
        label: aiProviderNameHash[ModelProvider.SiliconFlow],
        disabled: false,
    },
    {
        value: ModelProvider.ChatboxAI,
        label: aiProviderNameHash[ModelProvider.ChatboxAI],
        disabled: false,
    },
]

export function getModelDisplayName(settings: Settings, sessionType: SessionType): string {
    if (!settings) {
        return 'unknown'
    }
    switch (settings.aiProvider) {
        case ModelProvider.OpenAI:
            if (settings.model === 'custom-model') {
                let name = settings.openaiCustomModel || ''
                if (name.length >= 10) {
                    name = name.slice(0, 10) + '...'
                }
                return `OpenAI Custom Model (${name})`
            }
            return settings.model || 'unknown'
        case ModelProvider.ChatboxAI:
            const model = settings.chatboxAIModel || 'chatboxai-3.5'
            return model.replace('chatboxai-', 'Chatbox AI ')
        case ModelProvider.SiliconFlow:
            return `SiliconCloud (${settings.siliconCloudModel})`
        default:
            return 'unknown'
    }
}