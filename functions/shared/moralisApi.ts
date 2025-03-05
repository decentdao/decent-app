import { toHex } from 'viem';

export interface MoralisResponse<T> {
  status?: string;
  cursor: string | null;
  page: number;
  page_size: number;
  result: T[];
}

interface MoralisRequestConfig {
  endpoint: string;
  chain: string;
  apiKey: string;
  params?: Record<string, string>;
  isPaginated?: boolean;
}

export async function fetchMoralis<T>({
  endpoint,
  chain,
  apiKey,
  params = {},
  isPaginated = true,
}: MoralisRequestConfig): Promise<T[]> {
  let allResults: T[] = [];
  let cursor: string | null = null;
  let pageCount = 0;
  const limit = 100;
  const MAX_PAGES = 10; // Safeguard against infinite loops

  do {
    pageCount++;
    const chainHex = toHex(parseInt(chain));
    const url = new URL(`https://deep-index.moralis.io/api/v2.2${endpoint}`);

    // Add chain parameter
    url.searchParams.append('chain', chainHex);

    // Add cursor and limit only for paginated endpoints
    if (isPaginated) {
      if (cursor) {
        url.searchParams.append('cursor', cursor);
      }
      url.searchParams.append('limit', limit.toString());
    }

    // Add any additional parameters
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    let response;
    try {
      response = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'x-api-key': apiKey,
        },
        method: 'GET',
      });

      if (!response.ok) {
        console.error('Moralis API HTTP error:', {
          endpoint,
          status: response.status,
          statusText: response.statusText,
          chain: chainHex,
          params,
        });
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Moralis API fetch error:', {
        endpoint,
        chain: chainHex,
        error: error instanceof Error ? error.message : 'Unknown error',
        params,
      });
      throw error;
    }

    const data = await response.json();

    // Handle paginated vs non-paginated responses
    if (isPaginated) {
      const paginatedData = data as MoralisResponse<T>;
      if (!paginatedData || !paginatedData.result) {
        console.error('Unexpected Moralis API response structure:', {
          endpoint,
          responseData: data,
          isPaginatedButMissingRequiredFields: true,
        });
        break;
      }
      allResults = allResults.concat(paginatedData.result);
      cursor = paginatedData.cursor;

      // Log if we're hitting pagination limits
      if (pageCount >= MAX_PAGES && cursor !== null) {
        console.warn('Moralis API pagination limit reached:', {
          endpoint,
          pageCount,
          totalResultsCount: allResults.length,
          hasMoreData: true,
        });
        break;
      }
    } else {
      // For non-paginated endpoints, data is the direct array
      if (!Array.isArray(data)) {
        console.error('Unexpected Moralis API response structure:', {
          endpoint,
          responseData: data,
          expectedArray: true,
        });
        return [];
      }
      return data;
    }
  } while (cursor !== null && isPaginated);

  return allResults;
}
