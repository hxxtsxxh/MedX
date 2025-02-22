
import axios from 'axios';

const API_KEY = 'XqqfbY4r5ofStBBaqHIzfhPqwDmqYkTOGzsXoAaM';
const BASE_URL = 'https://api.fda.gov/drug/label.json';

export interface MedicationSchedule {
  days: string[];  // ['monday', 'wednesday', 'friday'] etc.
  times: string[]; // ['09:00', '15:00'] etc.
  frequency: string; // 'daily', 'weekly', 'monthly'
  dosage: string;  // '10mg', '2 tablets' etc.
}

export interface Medication {
  id: string;
  generic_name: string;
  brand_name: string;
  indications: string;
  warnings: string;
  active_ingredients: string;
  drug_interactions?: string;
  saved_at?: string;
  schedule?: MedicationSchedule;
}

export async function searchMedications(query: string): Promise<Medication[]> {
  if (!query.trim()) {
    return [];
  }

  try {
    const sanitizedQuery = encodeURIComponent(query.trim());
    const response = await axios.get(BASE_URL, {
      params: {
        api_key: API_KEY,
        search: `(openfda.brand_name:${sanitizedQuery}* OR openfda.generic_name:${sanitizedQuery}*)`,
        limit: 10,
      },
    });

    if (!response.data?.results?.length) {
      const lenientResponse = await axios.get(BASE_URL, {
        params: {
          api_key: API_KEY,
          search: `(openfda.brand_name:"${sanitizedQuery.split('').join('.*')}.*" OR openfda.generic_name:"${sanitizedQuery.split('').join('.*')}.*")`,
          limit: 10,
        },
      });
      
      if (!lenientResponse.data?.results?.length) {
        return [];
      }
      
      response.data = lenientResponse.data;
    }

    return response.data.results.map((label: any) => ({
      id: label.id || `med_${Math.random().toString(36).substring(2)}`,
      generic_name: label.openfda?.generic_name?.[0] || 'N/A',
      brand_name: label.openfda?.brand_name?.[0] || 'N/A',
      indications: label.indications_and_usage?.[0] || 'N/A',
      warnings: label.warnings?.[0] || 'N/A',
      active_ingredients: label.active_ingredient?.[0] || 'N/A',
      drug_interactions: label.drug_interactions?.[0] || 'No known drug interactions.',
    }));
  } catch (error: any) {
    if (error.response?.status === 404) {
      return [];
    }
    console.error('Error fetching medications:', error);
    return [];
  }
}

export async function getDrugInteractions(medications: Medication[]): Promise<string[]> {
  if (!medications.length) {
    return [];
  }

  try {
    const names = medications
      .map(med => med.generic_name !== 'N/A' ? med.generic_name : med.brand_name)
      .filter(name => name !== 'N/A');

    if (!names.length) {
      return medications.map(() => 'No known drug interactions.');
    }

    const searchQuery = names
      .map(name => `openfda.generic_name:"${encodeURIComponent(name)}"`)
      .join(' OR ');
    
    const response = await axios.get(BASE_URL, {
      params: {
        api_key: API_KEY,
        search: searchQuery,
        limit: medications.length,
      },
    });

    if (!response.data?.results?.length) {
      return medications.map(() => 'No known drug interactions.');
    }

    return response.data.results.map((result: any) => 
      result.drug_interactions?.[0] || 'No known drug interactions.'
    );
  } catch (error) {
    console.error('Error fetching drug interactions:', error);
    return medications.map(() => 'Unable to fetch drug interactions.');
  }
}

export default {
  searchMedications,
  getDrugInteractions,
};
