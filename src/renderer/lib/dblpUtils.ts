import axios from 'axios';
import * as cheerio from 'cheerio';
import { Paper } from '../../shared/types';

// Rate limiting configuration
const RATE_LIMIT_DELAY = 1000; // 1 second delay between requests
let lastRequestTime = 0;

// Create an axios instance with a custom user-agent
const axiosInstance = axios.create({
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36',
    }
});

async function rateLimit() {
    const now = Date.now();
    const timeElapsed = now - lastRequestTime;
    if (timeElapsed < RATE_LIMIT_DELAY) {
        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY - timeElapsed));
    }
    lastRequestTime = Date.now();
}

async function makeRateLimitedRequest(url: string) {
    await rateLimit();
    return axiosInstance.get(url);
}

export async function validateDblpLink(link: string): Promise<{ isValid: boolean; error?: string }> {
    const dblpRegex = /^https?:\/\/(dblp\.org|dblp\.uni-trier\.de)\/db\/(conf|journals)\/[a-zA-Z0-9]+\/[a-zA-Z0-9]+(\d{4})\.html$/;
    if (!dblpRegex.test(link)) {
        return { isValid: false, error: 'Invalid DBLP link format' };
    }

    try {
        const response = await makeRateLimitedRequest(link);
        return { isValid: response.status === 200 };
    } catch (error) {
        if (axios.isAxiosError(error)) {
            if (error.response) {
                return { isValid: false, error: `Server responded with status: ${error.response.status}` };
            } else if (error.request) {
                return { isValid: false, error: 'No response received from server' };
            } else {
                return { isValid: false, error: 'Error setting up the request' };
            }
        }
        return { isValid: false, error: 'An unexpected error occurred' };
    }
}

export async function extractPapersFromDblpPage(link: string, venueName: string, year: number): Promise<{ papers: Paper[]; error?: string }> {
    try {
        const response = await makeRateLimitedRequest(link);
        const html = response.data;
        const $ = cheerio.load(html);

        const papers: Paper[] = [];
        const isConference = link.includes('/conf/');
        const entrySelector = isConference ? 'li.entry.inproceedings' : 'li.entry.article';

        $(entrySelector).each((_, element) => {
            const $element = $(element);
            const title = $element.find('span.title').text().trim();
            const authors = $element.find('span[itemprop="author"] span[itemprop="name"]')
                .map((_, author) => $(author).text().trim()).get();
            const paperLink = $element.find('li.ee a').attr('href') || '';
            
            const doi = paperLink.startsWith('https://doi.org/') ? paperLink.slice(16) : '';

            papers.push({
                title,
                authors,
                url: paperLink,
                venue: venueName,
                year: year,
                source: 'DBLP',
                doi,
            });
        });

        return { papers };
    } catch (error) {
        if (axios.isAxiosError(error)) {
            if (error.response) {
                return { papers: [], error: `Server responded with status: ${error.response.status}` };
            } else if (error.request) {
                return { papers: [], error: 'No response received from server' };
            } else {
                return { papers: [], error: 'Error setting up the request' };
            }
        }
        return { papers: [], error: 'An unexpected error occurred while extracting papers' };
    }
}