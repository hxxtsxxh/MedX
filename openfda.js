const axios = require('axios');
const readline = require('readline');

// Your OpenFDA API key
const API_KEY = 'XqqfbY4r5ofStBBaqHIzfhPqwDmqYkTOGzsXoAaM';

// Base URL for the OpenFDA Drug Label API
const BASE_URL = 'https://api.fda.gov/drug/label.json';

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Promise-based question function
const askQuestion = (question) => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
};

// Function to display medication options
const displayMedicationOptions = (ingredients) => {
  console.log('\nFound multiple versions. Please select one:');
  ingredients.forEach((drug, index) => {
    console.log(`\n[${index + 1}] `);
    console.log(`Brand Name: ${drug.brand_name}`);
    console.log(`Generic Name: ${drug.generic_name}`);
    console.log(`Active Ingredients: ${drug.active_ingredients}`);
  });
  return askQuestion('\nEnter the number of the medication you want to learn more about (or 0 to exit): ');
};

// Function to clean medication text
const cleanMedicationText = (text, section) => {
  if (text === 'N/A') return text;
  
  // Remove section headers and unnecessary words from the text
  let cleanText = text;
  switch(section) {
    case 'warnings':
      cleanText = text.replace(/^Warnings\s*/i, '');
      break;
    case 'active_ingredients':
      cleanText = text.replace(/^Active ingredient[s]?\s*(?:\([^)]+\))?\s*/i, '');
      break;
    case 'inactive_ingredients':
      cleanText = text.replace(/^Inactive ingredients\s*/i, '');
      cleanText = cleanText.replace(/Questions\?\s*[\d-]+$/i, '');
      break;
    case 'indications':
      cleanText = text.replace(/^Uses\s*/i, '');
      break;
    case 'purpose':
      cleanText = text.replace(/^Purpose\s*/i, '');
      break;
  }
  
  return cleanText;
};

// Function to display detailed information about a specific medication
const displayMedicationInfo = (drug) => {
  console.log('\n=== Medication Information ===');
  console.log('\nGeneric Name:', drug.generic_name);
  console.log('Brand Name:', drug.brand_name);

  console.log('\nPurpose:');
  console.log(cleanMedicationText(drug.purpose, 'purpose'));
  
  console.log('\nWhat Is It Used For:');
  console.log(cleanMedicationText(drug.indications, 'indications'));  

  console.log('\nImportant Warnings:');
  console.log(cleanMedicationText(drug.warnings, 'warnings'));
  
  console.log('\nActive Ingredients:');
  console.log(cleanMedicationText(drug.active_ingredients, 'active_ingredients'));
  
  console.log('\nInactive Ingredients:');
  console.log(cleanMedicationText(drug.inactive_ingredients, 'inactive_ingredients'));
};

// Function to fetch all drug ingredients
const fetchAllDrugIngredients = async (searchQuery) => {
  let allIngredients = [];
  let skip = 0;
  const limit = 100;
  let totalResults = Infinity;

  try {
    console.log('Searching...');
    
    while (skip < totalResults) {
      const response = await axios.get(BASE_URL, {
        params: {
          api_key: API_KEY,
          search: searchQuery,
          limit: limit,
          skip: skip,
        },
      });

      const ingredients = response.data.results
        .map((label) => ({
          generic_name: label.openfda?.generic_name?.join(', ') || 'N/A',
          brand_name: label.openfda?.brand_name?.join(', ') || 'N/A',
          indications: label.indications_and_usage?.join(', ') || 'N/A',
          warnings: label.warnings?.join(', ') || 'N/A',
          active_ingredients: label.active_ingredient?.join(', ') || 'N/A',
          inactive_ingredients: label.inactive_ingredient?.join(', ') || 'N/A',
          purpose: label.purpose?.join(', ') || null
        }))
        .filter(drug => !(drug.brand_name === 'N/A' && drug.generic_name === 'N/A'));

      allIngredients = allIngredients.concat(ingredients);
      totalResults = response.data.meta.results.total;
      skip += limit;
    }

    console.log(`Found ${allIngredients.length} results.\n`);
    return allIngredients;
  } catch (error) {
    console.error('Error fetching drug ingredients:', error.message);
    throw error;
  }
};

// Function to fetch drug information by NDC
const fetchDrugByNDC = async (ndc) => {
  try {
    console.log('Searching...');
    
    const response = await axios.get(BASE_URL, {
      params: {
        api_key: API_KEY,
        search: `openfda.product_ndc:"${ndc}"`,
      },
    });

    if (response.data.results && response.data.results.length > 0) {
      const label = response.data.results[0];
      return {
        generic_name: label.openfda?.generic_name?.join(', ') || 'N/A',
        brand_name: label.openfda?.brand_name?.join(', ') || 'N/A',
        indications: label.indications_and_usage?.join(', ') || 'N/A',
        warnings: label.warnings?.join(', ') || 'N/A',
        active_ingredients: label.active_ingredient?.join(', ') || 'N/A',
        inactive_ingredients: label.inactive_ingredient?.join(', ') || 'N/A',
        purpose: label.purpose?.join(', ') || 'N/A',
        product_ndc: label.openfda?.product_ndc?.join(', ') || 'N/A',
        manufacturer_name: label.openfda?.manufacturer_name?.join(', ') || 'N/A'
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching drug information:', error.message);
    throw error;
  }
};

// Main function to run the script
const main = async () => {
  try {
    const ndc = await askQuestion('Please enter the NDC (National Drug Code): ');
    if (!ndc) {
      console.log('No NDC entered. Please try again.');
      return;
    }

    const drug = await fetchDrugByNDC(ndc);

    if (drug) {
      console.log('\n=== Medication Information ===');
      console.log('\nNDC:', drug.product_ndc);
      console.log('Manufacturer:', drug.manufacturer_name);
      console.log('Generic Name:', drug.generic_name);
      console.log('Brand Name:', drug.brand_name);

      console.log('\nPurpose:');
      console.log(cleanMedicationText(drug.purpose, 'purpose'));
      
      console.log('\nWhat Is It Used For:');
      console.log(cleanMedicationText(drug.indications, 'indications'));  

      console.log('\nImportant Warnings:');
      console.log(cleanMedicationText(drug.warnings, 'warnings'));
      
      console.log('\nActive Ingredients:');
      console.log(cleanMedicationText(drug.active_ingredients, 'active_ingredients'));
      
      console.log('\nInactive Ingredients:');
      console.log(cleanMedicationText(drug.inactive_ingredients, 'inactive_ingredients'));
    } else {
      console.log('No information found for this NDC. Please check the number and try again.');
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    rl.close();
  }
};

// Run the main function
main();