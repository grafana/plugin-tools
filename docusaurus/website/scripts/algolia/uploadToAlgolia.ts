import { algoliasearch } from 'algoliasearch';
import { glob } from 'glob';
import dotenv from 'dotenv';
import { readFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const envFile = '.env';

dotenv.config({ path: `${__dirname}/../../${envFile}`, encoding: 'utf8' });

const appID = process.env.ALGOLIA_APP_ID;
const apiKey = process.env.ALGOLIA_WRITE_API_KEY;
const indexName = process.env.ALGOLIA_SEARCH_INDEX;

async function getRecords() {
  const files = await glob(`${__dirname}/../../storage/datasets/**/*.json`);

  const records: Array<Record<string, unknown>> = [];
  for (const file of files) {
    const data = await readFile(file, 'utf8');
    const record = JSON.parse(data);
    records.push(record);
  }

  return records;
}

async function uploadToAlgolia() {
  try {
    if (!appID || !apiKey || !indexName) {
      throw new Error(
        'Missing required environment variables: ALGOLIA_APP_ID, ALGOLIA_WRITE_API_KEY, and ALGOLIA_SEARCH_INDEX.'
      );
    }

    console.log(`Beginning upload to Algolia '${indexName}'...`);
    const client = algoliasearch(appID, apiKey);
    const records = await getRecords();
    console.log('Uploading records to Algolia...');
    await client.saveObjects({
      indexName,
      objects: records,
    });
    console.log(`Successfully uploaded ${records.length} records to Algolia!`);
  } catch (error) {
    console.error('Error uploading to Algolia:', error);
    throw error;
  }
}

await uploadToAlgolia();

console.log('Done!');
