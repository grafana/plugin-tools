import chalk from 'chalk';
import { getRateLimitInfo } from '../api.js';
import { getRateLimitResetsText } from '../utils.js';

export const infoCommand = async () => {
  await printRateLimitInfo();
};

async function printRateLimitInfo() {
  const rateLimit = await getRateLimitInfo();

  console.log(chalk.bold.underline('GitHub API rate limits'));

  if (!rateLimit) {
    console.log(chalk.italic('No rate limit info available.'));
    return;
  }

  console.log(
    `${chalk.bold('Rate limit:')} ${rateLimit.rate.used}/${rateLimit.rate.limit} - ${chalk.italic(`Resetting ${getRateLimitResetsText(rateLimit.rate.reset)}`)}`
  );

  console.log(
    `${chalk.bold('Core API limit:')} ${rateLimit.resources.core.used}/${rateLimit.resources.core.limit} - ${chalk.italic(`Resetting ${getRateLimitResetsText(rateLimit.resources.core.reset)}`)}`
  );

  console.log(
    `${chalk.bold('Code-search API limit:')} ${rateLimit.resources.search.used}/${rateLimit.resources.search.limit} - ${chalk.italic(`Resetting ${getRateLimitResetsText(rateLimit.resources.search.reset)}`)}`
  );
}
