import { Paper } from '../../shared/types'

export type ExportAttribute = 'title' | 'authors' | 'year' | 'venue' | 'url' | 'abstract' | 'doi'

export function formatPaperForExport(paper: Paper, attributes: ExportAttribute[]): string {
    return attributes.map(attr => {
        switch (attr) {
            case 'authors':
                return `Authors: ${paper.authors.join(', ')}`
            case 'year':
                return `Year: ${paper.year}`
            default:
                return `${attr.charAt(0).toUpperCase() + attr.slice(1)}: ${paper[attr] || 'N/A'}`
        }
    }).join('\n')
}

export function exportPapersAsString(papers: Paper[], attributes: ExportAttribute[]): string {
    return papers.map(paper => formatPaperForExport(paper, attributes)).join('\n\n')
}

export function exportPapersAsJson(papers: Paper[], attributes: ExportAttribute[]): string {
    return JSON.stringify(
        papers.map(paper => 
            attributes.reduce((obj, attr) => ({ ...obj, [attr]: paper[attr] }), {})
        ),
        null,
        2
    )
}

export async function copyToClipboard(text: string): Promise<void> {
    try {
        await navigator.clipboard.writeText(text)
    } catch (err) {
        console.error('Failed to copy text: ', err)
        throw new Error('Failed to copy to clipboard')
    }
}

export function downloadAsFile(content: string, fileName: string, fileType: string): void {
    const blob = new Blob([content], { type: fileType })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = fileName
    link.click()
    URL.revokeObjectURL(link.href)
}