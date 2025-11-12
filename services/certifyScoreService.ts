import { ArchivedGame } from '../types';

export interface CertifyScoreRequest {
  score: number;
  subject?: string;
  nonce?: string;
  deck?: ArchivedGame;
}

export interface CertifyScoreResponse {
  signed: {
    payload: {
      id: string;
      score: number;
      subject?: string;
      nonce: string;
      issuedAt: string;
    };
    canonicalB64: string;
    signatureB64: string;
    algorithm: string;
    signatureFormat: string;
    certificateFingerprintSHA256?: string;
    certificatePem?: string;
  };
  generatedAt: string;
}

const DEFAULT_CERTIFY_SCORE_ENDPOINT = 'https://epsi.journeesdecouverte.fr:22222/v1/certify-score';
const CERTIFY_SCORE_ENDPOINT = (() => {
  const configured = import.meta.env.VITE_CERTIFY_SCORE_ENDPOINT?.trim();
  return configured && configured.length > 0 ? configured : DEFAULT_CERTIFY_SCORE_ENDPOINT;
})();

const getAuthToken = () => {
  const token = import.meta.env.VITE_BEARER_TOKEN?.trim();
  return token && token.length > 0 ? token : 'EPSI';
};

const generateNonce = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
};

export async function certifyScore(request: CertifyScoreRequest): Promise<CertifyScoreResponse> {
  const payload = {
    ...request,
    nonce: request.nonce ?? generateNonce(),
  };

  const response = await fetch(CERTIFY_SCORE_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({}));
    throw new Error(errorPayload?.error?.message || `Failed to certify score (HTTP ${response.status})`);
  }

  return response.json();
}
