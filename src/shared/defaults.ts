import { Theme, Config, Settings, ModelProvider, Session } from './types'
import { v4 as uuidv4 } from 'uuid'

export function settings(): Settings {
    return {
        aiProvider: ModelProvider.OpenAI,
        openaiKey: '',
        apiHost: 'https://api.openai.com',

        azureApikey: '',
        azureDeploymentName: '',
        azureDalleDeploymentName: 'dall-e-3',
        azureEndpoint: '',
        chatglm6bUrl: '',
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
        topP: 1,
        // openaiMaxTokens: 0,
        // openaiMaxContextTokens: 4000,
        openaiMaxContextMessageCount: 10,
        // maxContextSize: "4000",
        // maxTokens: "2048",

        showWordCount: true,
        showTokenCount: false,
        showTokenUsed: true,
        showModelName: true,
        showMessageTimestamp: false,
        userAvatarKey: '',
        theme: Theme.FollowSystem,
        language: 'en',
        fontSize: 12,
        spellCheck: true,

        defaultPrompt: getDefaultPrompt(),

        allowReportingAndTracking: true,

        enableMarkdownRendering: true,

        siliconCloudHost: 'https://api.siliconflow.cn',
        siliconCloudKey: '',
        siliconCloudModel: 'THUDM/glm-4-9b-chat',
    }
}

export function newConfigs(): Config {
    return { uuid: uuidv4() }
}

export function getDefaultPrompt() {
    return 'You are a Research Assistant. Your role is to help users with their research projects. Users will provide research questions and topics, and you will assist them in finding relevant papers, summarizing findings, and providing insights. Offer guidance on research methodologies and answer any questions related to their research.'
}

export function sessions(): Session[] {
    return [{ id: uuidv4(), name: 'Untitled', messages: [], type: 'chat' }]
}
