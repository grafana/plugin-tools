import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import { v4 as uuid } from 'uuid';

class GcomApiClient {
  constructor(baseApiUrl) {
    this.baseApiUrl = baseApiUrl;
  }

  async post(endpoint, payload) {
    const response = await fetch(`${this.baseApiUrl}${endpoint}`, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
        'x-request-id': uuid(),
      },
    });

    if (!response.ok) {
      const res = await response.text();
  
      console.error(`Error while sending POST request: ${endpoint}`, res);
      throw new Error(`Error while sending POST request: ${endpoint}`);
    }
  
    return response.json();
  }
}

export function useApiClient() {
  const { siteConfig } = useDocusaurusContext();
  
  const apiUrl = siteConfig.customFields.gcomUrl;
  return new GcomApiClient(apiUrl);
}