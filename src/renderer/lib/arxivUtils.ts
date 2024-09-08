import axios from 'axios';
import { Paper } from '../../shared/types';

const ARXIV_API_URL = 'http://export.arxiv.org/api/query';

interface ArxivSearchParams {
  searchQuery: string;
  startDate?: string;
  endDate?: string;
  maxResults: number;
  start: number;
  category?: string;
}

export async function searchArxiv(params: ArxivSearchParams): Promise<{ papers: Paper[], totalResults: number }> {
  const { searchQuery, startDate, endDate, maxResults, start, category } = params;
  
  let query = 'search_query=';

  if (category) {
    query += `cat:${category}`;
    if (searchQuery.trim()) {
      query += `+AND+`;
    }
  }

  if (searchQuery.trim()) {
    query += `(ti:${encodeURIComponent(searchQuery.trim())}+OR+abs:${encodeURIComponent(searchQuery.trim())})`;
  } else if (!category) {
    query += 'all:*';
  }

  if (startDate && endDate) {
    const formattedStartDate = startDate.replace(/-/g, '') + '000000';
    const formattedEndDate = endDate.replace(/-/g, '') + '235959';
    query += `+AND+submittedDate:[${formattedStartDate}+TO+${formattedEndDate}]`;
  }

  query += `&start=${start}&max_results=${maxResults}&sortBy=submittedDate&sortOrder=descending`;
  
  console.log('ArXiv API request URL:', `${ARXIV_API_URL}?${query}`);

  try {
    const response = await axios.get(`${ARXIV_API_URL}?${query}`, {
      responseType: 'text'
    });
    
    console.log('ArXiv API response status:', response.status);
    console.log('Full ArXiv API response:', response.data);

    if (response.status !== 200) {
      throw new Error(`ArXiv API returned status ${response.status}`);
    }

    return parseArxivResponse(response.data);
  } catch (error) { 
    console.error('Error searching arXiv:', error);
    if (axios.isAxiosError(error)) {
      console.error('Axios error details:', error.response?.data);
    }
    throw new Error('Failed to search arXiv');
  }
}

function parseArxivResponse(xmlData: string): { papers: Paper[], totalResults: number } {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlData, "text/xml");
  
  const entries = xmlDoc.getElementsByTagName('entry');
  console.log('Number of entries found:', entries.length);

  const papers: Paper[] = Array.from(entries).map(entry => {
    const paper: Paper = {
      title: entry.getElementsByTagName('title')[0]?.textContent?.trim() || '',
      authors: Array.from(entry.getElementsByTagName('author')).map(author => author.getElementsByTagName('name')[0]?.textContent?.trim() || ''),
      abstract: entry.getElementsByTagName('summary')[0]?.textContent?.trim() || '',
      url: entry.getElementsByTagName('id')[0]?.textContent?.trim() || '',
      year: new Date(entry.getElementsByTagName('published')[0]?.textContent || '').getFullYear(),
      venue: 'arXiv',
      source: 'arXiv',
      doi: entry.getElementsByTagName('arxiv:doi')[0]?.textContent?.trim() || '',
      tags: [],
    };
    console.log('Parsed paper:', paper);
    return paper;
  });

  const totalResults = parseInt(xmlDoc.getElementsByTagName('opensearch:totalResults')[0]?.textContent || '0', 10);
  console.log('Total results:', totalResults);

  return { papers, totalResults };
}