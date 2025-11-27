import { algoliasearch } from 'algoliasearch';
import dotenv from 'dotenv';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const envFile = '.env';

dotenv.config({ path: `${__dirname}/../../${envFile}`, encoding: 'utf8' });

const appID = process.env.ALGOLIA_APP_ID;
const apiKey = process.env.ALGOLIA_WRITE_API_KEY;
const indexName = process.env.ALGOLIA_SEARCH_INDEX;

const client = algoliasearch(appID, apiKey);

const record = { objectID: 'object-1', name: 'test record' };

// Add record to an index
const { taskID } = await client.saveObject({
  indexName,
  body: record,
});

// // Wait until indexing is done
// await client.waitForTask({
//   indexName,
//   taskID,
// });

// // Search for "test"
// const { results } = await client.search({
//   requests: [
//     {
//       indexName,
//       query: 'test',
//     },
//   ],
// });

// console.log(JSON.stringify(results));
