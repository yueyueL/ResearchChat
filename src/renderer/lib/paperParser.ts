import { Paper } from '../../shared/types'
import paperConstants from '../../shared/paperConstants.json'

interface RawPaperData {
    [key: string]: any
}

function findMatchingKey(data: RawPaperData, possibleKeys: string[]): string | null {
    for (const key of possibleKeys) {
        if (key in data) {
            return key
        }
    }
    return null
}

export function parsePaper(rawData: RawPaperData): Partial<Paper> {
    const paper: Partial<Paper> = {}

    for (const [paperKey, possibleKeys] of Object.entries(paperConstants.paperKeyMappings)) {
        const matchingKey = findMatchingKey(rawData, possibleKeys)
        if (matchingKey) {
            paper[paperKey as keyof Paper] = rawData[matchingKey]
        }
    }

    // Ensure authors is always an array
    if (typeof paper.authors === 'string') {
        paper.authors = (paper.authors as string).split(',').map(author => author.trim())
    } else if (!Array.isArray(paper.authors)) {
        paper.authors = []
    }

    // Ensure year is a number
    if (paper.year) {
        paper.year = parseInt(paper.year as unknown as string, 10)
    }

    // // Expand conference abbreviations if applicable
    // if (paper.venue && paperConstants.conferenceAbbreviations[paper.venue as keyof typeof paperConstants.conferenceAbbreviations]) {
    //     paper.venue = paperConstants.conferenceAbbreviations[paper.venue as keyof typeof paperConstants.conferenceAbbreviations]
    // }

    return paper
}

export function parseMultiplePapers(rawDataArray: RawPaperData[]): Partial<Paper>[] {
    return rawDataArray.map(parsePaper)
}