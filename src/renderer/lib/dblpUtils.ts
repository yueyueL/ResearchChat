import axios from 'axios';

export async function validateDblpLink(link: string): Promise<{ isValid: boolean; error?: string }> {
    // First, check if the URL structure is correct
    const dblpRegex = /^https?:\/\/(dblp\.org|dblp\.uni-trier\.de)\/db\/(conf|journals)\/[a-zA-Z0-9]+\/[a-zA-Z0-9]+(\d{4})\.html$/;
    if (!dblpRegex.test(link)) {
        return { isValid: false, error: 'Invalid DBLP link format' };
    }

    // If the structure is correct, check if the page actually exists
    try {
        const response = await axios.get(link);
        return { isValid: response.status === 200 };
    } catch (error) {
        if (axios.isAxiosError(error)) {
            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                return { isValid: false, error: `Server responded with status: ${error.response.status}` };
            } else if (error.request) {
                // The request was made but no response was received
                return { isValid: false, error: 'No response received from server' };
            } else {
                // Something happened in setting up the request that triggered an Error
                return { isValid: false, error: 'Error setting up the request' };
            }
        }
        return { isValid: false, error: 'An unexpected error occurred' };
    }
}

export async function extractPapersFromDblpPage(link: string): Promise<{ papers: any[]; error?: string }> {
    try {
        const response = await axios.get(link);
        const html = response.data;

        // TODO: Implement HTML parsing and paper information extraction
        // This will require a HTML parsing library like cheerio

        return { papers: [] }; // Return extracted papers
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