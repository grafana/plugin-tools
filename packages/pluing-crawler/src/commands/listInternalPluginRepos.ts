// // Lists all internal plugin repositories

// import Table from "cli-table";
// import { getReposWithInternalAppPlugins } from "../utils.js";

// // Examples
// // ---------
// // $ node ./src/bin/listInternalPluginRepos.js
// // $ CLEAR_CACHE=true node ./src/bin/listInternalPluginRepos.js
// // $ node ./src/bin/listInternalPluginRepos.js --public
// // $ node ./src/bin/listInternalPluginRepos.js --private
// const run = async () => {
//   const repoNames = [];
//   const internalRepos = await getReposWithInternalAppPlugins();
//   const table = new Table({
//     head: ["Name", "URL", "Type"],
//   });

//   internalRepos.items
//     // Filter out forks
//     .filter(({ repository }) => !repository.fork)
//     // We don't need hackathon repos
//     .filter(({ repository }) => !repository.name.includes("hackathon"))
//     // Filter out duplicates
//     .filter(({ repository }) => {
//       if (repoNames.includes(repository.name)) {
//         return false;
//       }

//       repoNames.push(repository.name);

//       return true;
//     })
//     // Sort them by repository.name
//     .sort((a, b) => a.repository.name.localeCompare(b.repository.name))
//     .map(({ repository }) => {
//       table.push([
//         repository.name,
//         repository.html_url,
//         repository.private ? "PRIVATE" : "PUBLIC",
//       ]);
//     });

//   console.log(`Total internal plugins: ${table.length}`);
//   console.log(table.toString());
// };

// run();
