// services/minimonApiService.ts

import { Minimon, MinimonStatus, MinimonRarity, ApiErrorResponse } from '../types';

const DEFAULT_API_BASE_URL = 'https://epsi.journeesdecouverte.fr:22222/v1'; // Changed to HTTPS
const API_BASE_URL = (() => {
  // Public Vite env vars (prefixed with VITE_) are exposed to the client bundle.
  const configuredUrl = import.meta.env.VITE_API_BASE_URL?.trim();
  if (!configuredUrl) {
    return DEFAULT_API_BASE_URL;
  }
  return configuredUrl.replace(/\/+$/, ''); // Remove trailing slashes to keep `/generate` calls clean.
})();
const AUTH_TOKEN = (() => {
  const token = import.meta.env.VITE_BEARER_TOKEN;
  return token?.trim() || 'EPSI';
})(); // Statically defined Bearer token as per docs/03-authentication.md
const REQUEST_TIMEOUT = 30000; // 30 seconds timeout for the API request

/**
 * Service for interacting with the external Minimon generation API.
 */
export class MinimonApiService {

  /**
   * Generates a new Minimon by calling the external API.
   * Handles authentication, timeouts, and error responses.
   * @returns A promise that resolves with the generated Minimon object.
   * @throws {Error} if the API call fails or returns an error.
   */
  public async generateMinimon(): Promise<Minimon> {
    const url = `${API_BASE_URL}/generate`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
        },
        // Explicitly setting mode to 'cors' although it's the default for cross-origin requests.
        // This makes it clear that we expect CORS behavior.
        mode: 'cors',
        signal: controller.signal, // Add AbortController signal for timeout
      });

      clearTimeout(timeoutId); // Clear the timeout as the request completed

      if (!res.ok) {
        const errorData: ApiErrorResponse = await res.json().catch(() => ({
          error: {
            code: 'UNKNOWN_ERROR',
            message: `HTTP error! Status: ${res.status}`,
            timestamp: new Date().toISOString()
          }
        }));
        console.error('API Error Response:', errorData); // Clarified console log
        throw new Error(errorData?.error?.message || `Failed to generate Minimon (HTTP ${res.status})`);
      }

      const data = await res.json();

      // Validate and transform API response to match internal Minimon interface
      if (!data || !data.imageBase64 || !data.metadata || !data.metadata.id || !data.metadata.name || !data.metadata.rarity || !data.generatedAt) {
        throw new Error('Invalid API response format received: missing expected fields.'); // More specific validation error
      }

      const minimon: Minimon = {
        id: data.metadata.id,
        name: data.metadata.name,
        rarity: data.metadata.rarity as MinimonRarity, // Cast to MinimonRarity enum
        imageBase64: data.imageBase64,
        generatedAt: data.generatedAt,
        status: MinimonStatus.OWNED, // New Minimon are always owned initially
      };

      return minimon;

    } catch (error) {
      clearTimeout(timeoutId); // Ensure timeout is cleared on any error
      console.error('Network or API processing error:', error); // Log the raw error object for more detail
      
      if ((error as Error).name === 'AbortError') {
        throw new Error(`The Minimon generation request timed out after ${REQUEST_TIMEOUT / 1000} seconds. The API might be busy, please try again later.`);
      }

      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error(
          'Could not connect to the Minimon API. This might be a network issue, the API server being down, or a self-signed HTTPS certificate. If the API uses a self-signed certificate, please try opening ' +
          API_BASE_URL + '/generate' + 
          ' in a new browser tab and accepting the security warning, then refresh this page. Also, verify the API server has correct CORS configuration for your client application\'s origin.'
        );
      }
      throw error; // Re-throw other errors
    }
  }
}

export const minimonApiService = new MinimonApiService();
