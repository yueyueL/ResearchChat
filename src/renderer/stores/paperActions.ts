import { Paper } from '../../shared/types'
import { paperStorage } from '../storage'
import { parseMultiplePapers } from '../lib/paperParser'

export async function fetchAllPapers() {
  console.log("Fetching all papers...")
  const papers = await paperStorage.getAllPapers()
  console.log("Fetched papers:", papers)
  return papers
}

export async function addPaper(paper: Paper) {
  const { isDuplicate, existingPaper } = await paperStorage.checkDuplication(paper)
  if (isDuplicate && existingPaper) {
    // Merge the new paper info with the existing paper
    const updatedPaper = { ...existingPaper, ...paper }
    await paperStorage.updatePaper(existingPaper.id!, updatedPaper)
    return existingPaper.id
  } else {
    return await paperStorage.addPaper(paper)
  }
}

export async function updatePaper(id: number, updates: Partial<Paper>) {
  await paperStorage.updatePaper(id, updates)
}

export async function deletePaper(id: number) {
  await paperStorage.deletePaper(id)
}

export async function searchPapers(query: string) {
  return await paperStorage.searchPapers(query)
}

export async function filterPapers(filters: { year?: number, venue?: string }) {
  return await paperStorage.filterPapers(filters)
}

export async function importPapers(rawPapers: any[]): Promise<Paper[]> {
  const importedPapers: Paper[] = []
  for (const rawPaper of rawPapers) {
    try {
      const paper: Paper = {
        title: rawPaper.title || '',
        authors: rawPaper.author?.map((a: any) => `${a.given || ''} ${a.family || ''}`.trim()).filter(Boolean) || 
                 rawPaper.authors || [],
        year: rawPaper.issued?.['date-parts']?.[0]?.[0] || 
              (typeof rawPaper.year === 'string' ? parseInt(rawPaper.year, 10) : rawPaper.year) || 
              0,
        venue: rawPaper['container-title'] || rawPaper.venue || '',
        publisher: rawPaper.publisher || '',
        source: rawPaper.source || '',
        url: rawPaper.URL || rawPaper.url || '',
        abstract: rawPaper.abstract || '',
        doi: rawPaper.DOI || rawPaper.doi || '',
      }
      const addedPaperId = await paperStorage.addPaper(paper)
      if (addedPaperId) {
        importedPapers.push({ ...paper, id: addedPaperId })
      }
    } catch (error) {
      console.error('Error importing paper:', error)
    }
  }
  return importedPapers
}

export async function exportPapers() {
  return await paperStorage.exportPapers()
}

export async function createSubcollection(name: string, paperIds: number[]) {
  await paperStorage.createSubcollection(name, paperIds)
}

export async function initializePaperStorage() {
  console.log("Initializing paper storage...")
  const papers = await paperStorage.initializeWithDefaultPapers()
  console.log("Initialized papers:", papers)
  return papers
}

export async function clearAllPapers() {
  await paperStorage.clearAllPapers()
}

export async function fetchPapersPaginated(
    page: number,
    limit: number,
    searchQuery: string,
    yearFilter: { start: string, end: string },
    venueFilter: string
): Promise<{ papers: Paper[], total: number }> {
    return await paperStorage.getPapersPaginated(page, limit, searchQuery, yearFilter, venueFilter)
}