import Dexie from 'dexie'
import { Paper, Tag } from '../../shared/types'

class PaperDatabase extends Dexie {
    papers!: Dexie.Table<Paper, number>
    tags!: Dexie.Table<Tag, number>

    constructor() {
        super('PaperDatabase')
        this.version(2).stores({
            papers: '++id, title, year, venue, uniqueId, *tags',
            tags: '++id, name'
        })
    }
}

const db = new PaperDatabase()

function generateUniqueId(paper: Paper): string {
    const words = paper.title.split(/\s+/).filter(word => word.length > 0);  // Split the title into words and remove empty strings
    let uniqueId = '';

    if (words.length >= 2) {
        // Add the first two words completely
        uniqueId += words[0].toLowerCase() + words[1].toLowerCase();
        
        // Add the first character of each remaining word
        for (let i = 2; i < words.length; i++) {
            uniqueId += words[i].charAt(0).toLowerCase();
        }
    } else if (words.length === 1) {
        // If there's only one word, use it completely
        uniqueId = words[0].toLowerCase();
    } else {
        // If there are no words (unlikely, but possible), use a placeholder
        uniqueId = 'untitled';
    }

    // Add the year
    uniqueId += paper.year;

    return uniqueId;
}

export const paperStorage = {
    async addPaper(paper: Paper) {
        const uniqueId = generateUniqueId(paper)
        console.log(`Adding paper with uniqueId: ${uniqueId}`)
        const existingPaper = await db.papers.where('uniqueId').equals(uniqueId).first()

        if (existingPaper) {
            console.log(`Paper with uniqueId ${uniqueId} already exists, updating...`)
            const updatedPaper = { ...existingPaper, ...paper, uniqueId, tags: paper.tags || [] }
            await db.papers.update(existingPaper.id!, updatedPaper)
            return existingPaper.id
        } else {
            console.log(`Adding new paper with uniqueId ${uniqueId}`)
            return db.papers.add({ ...paper, uniqueId, tags: paper.tags || [] })
        }
    },

    async getPaper(id: number) {
        return db.papers.get(id)
    },

    async getAllPapers() {
        return db.papers.toArray()
    },

    async updatePaper(id: number, updates: Partial<Paper>) {
        const paper = await this.getPaper(id)
        if (paper) {
            const updatedPaper = { ...paper, ...updates }
            updatedPaper.uniqueId = generateUniqueId(updatedPaper)
            return db.papers.update(id, updatedPaper)
        }
        return 0
    },

    async deletePaper(id: number) {
        return db.papers.delete(id)
    },

    async searchPapers(query: string) {
        return db.papers.filter(paper =>
            paper.title.toLowerCase().includes(query.toLowerCase()) ||
            (paper.abstract ?? '').toLowerCase().includes(query.toLowerCase())
        ).toArray()
    },

    async filterPapers({ year, venue }: { year?: number, venue?: string }) {
        let collection = db.papers.toCollection()
        if (year) {
            collection = collection.and(paper => paper.year === year)
        }
        if (venue) {
            collection = collection.and(paper => paper.venue.toLowerCase().includes(venue.toLowerCase()))
        }
        return collection.toArray()
    },

    async importPapers(papers: Paper[]) {
        console.log("Importing papers:", papers)
        const result = await db.papers.bulkAdd(papers.map(paper => ({ ...paper, uniqueId: generateUniqueId(paper) })))
        console.log("Import result:", result)
        return result
    },

    async exportPapers() {
        return db.papers.toArray()
    },

    async createSubcollection(name: string, paperIds: number[]) {
        // This is a placeholder. You might want to implement subcollections differently
        // depending on your specific requirements.
        console.log(`Creating subcollection ${name} with papers:`, paperIds)
    },

    async checkDuplication(paper: Paper): Promise<{ isDuplicate: boolean; existingPaper?: Paper }> {
        const uniqueId = generateUniqueId(paper)
        const existingPaper = await db.papers.where('uniqueId').equals(uniqueId).first()
        return { isDuplicate: !!existingPaper, existingPaper }
    },

    async initializeWithDefaultPapers() {
        console.log("Initializing paper storage...")
        const existingPapers = await this.getAllPapers()
        console.log("Existing papers:", existingPapers)

        // Remove the initialization with default papers
        if (existingPapers.length === 0) {
            console.log("No existing papers. Starting with an empty library.")
        } else {
            console.log("Papers already exist in the library.")
        }

        return existingPapers
    },

    async clearAllPapers() {
        return db.papers.clear()
    },

    async getAllTags() {
        return db.tags.toArray()
    },

    async createTag(tagName: string) {
        return db.tags.add({ name: tagName })
    },

    async addTagsToPapers(paperIds: number[], tags: string[]) {
        await db.transaction('rw', db.papers, db.tags, async () => {
            for (const tagName of tags) {
                let tag = await db.tags.where('name').equals(tagName).first()
                if (!tag) {
                    const tagId = await db.tags.add({ name: tagName })
                    tag = { id: tagId, name: tagName }
                }
            }

            for (const paperId of paperIds) {
                const paper = await db.papers.get(paperId)
                if (paper) {
                    const currentTags = Array.isArray(paper.tags) ? paper.tags : [];
                    const updatedTags = [...new Set([...currentTags, ...tags])]
                    await db.papers.update(paperId, { tags: updatedTags })
                }
            }
        })
    },

    async removeTagsFromPapers(paperIds: number[], tags: string[]) {
        await db.transaction('rw', db.papers, async () => {
            for (const paperId of paperIds) {
                const paper = await db.papers.get(paperId)
                if (paper) {
                    const currentTags = Array.isArray(paper.tags) ? paper.tags : [];
                    const updatedTags = currentTags.filter(tag => !tags.includes(tag))
                    await db.papers.update(paperId, { tags: updatedTags })
                }
            }
        })
    },

    async getPapersPaginated(
        page: number,
        limit: number,
        searchQuery: string,
        yearFilter: { start: string, end: string },
        venueFilter: string,
        tagFilter: string[]
    ): Promise<{ papers: Paper[], total: number }> {
        let collection = db.papers.toCollection()

        if (searchQuery) {
            collection = collection.filter(paper => 
                paper.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (paper.abstract ?? '').toLowerCase().includes(searchQuery.toLowerCase())
            )
        }

        if (yearFilter.start || yearFilter.end) {
            collection = collection.filter(paper => {
                const year = paper.year
                const start = yearFilter.start ? parseInt(yearFilter.start) : -Infinity
                const end = yearFilter.end ? parseInt(yearFilter.end) : Infinity
                return year >= start && year <= end
            })
        }

        if (venueFilter) {
            collection = collection.filter(paper => paper.venue.toLowerCase().includes(venueFilter.toLowerCase()))
        }

        if (tagFilter && tagFilter.length > 0) {
            collection = collection.filter(paper => 
                paper.tags !== undefined && tagFilter.every(tag => paper.tags!.includes(tag))
            )
        }

        const total = await collection.count()
        const papers = await collection
            .offset((page - 1) * limit)
            .limit(limit)
            .toArray()

        // Ensure tags are initialized for all papers
        const papersWithTags = papers.map(paper => ({
            ...paper,
            tags: paper.tags || []
        }))

        return { papers: papersWithTags, total }
    },

    async deleteTag(tagId: number) {
        await db.transaction('rw', db.tags, db.papers, async () => {
            const tag = await db.tags.get(tagId)
            if (!tag) return

            // Delete the tag
            await db.tags.delete(tagId)

            // Remove the tag from all papers
            const papers = await db.papers.where('tags').anyOf(tag.name).toArray()
            for (const paper of papers) {
                const updatedTags = paper.tags?.filter(t => t !== tag.name) ?? []
                await db.papers.update(paper.id!, { tags: updatedTags })
            }
        })
    },

    async removeTagFromPapers(tagId: number) {
        const tag = await db.tags.get(tagId)
        if (!tag) return

        const papers = await db.papers.where('tags').anyOf(tag.name).toArray()
        for (const paper of papers) {
            const updatedTags = paper.tags?.filter(t => t !== tag.name) ?? []
            await db.papers.update(paper.id!, { tags: updatedTags })
        }
    }
}