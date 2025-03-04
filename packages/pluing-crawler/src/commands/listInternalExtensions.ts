// // Lists all internal plugin repositories

// import Table from "cli-table";
// import { getAddedComponents } from "../utils.js";

// // Examples
// // ---------
// // $ node ./src/bin/listInternalExtensions.js
// // $ CLEAR_CACHE=true node ./src/bin/listInternalExtensions.js
// // $ node ./src/bin/listInternalExtensions.js --public
// // $ node ./src/bin/listInternalExtensions.js --private

// const run = async () => {
//   const addedComponents = await getAddedComponents();
//   const table = new Table({
//     head: ["Name", "File URL", "Type"],
//   });

//   addedComponents.items
//     // Filter out forks
//     .filter(({ repository }) => !repository.fork)
//     // We don't need hackathon repos
//     .filter(({ repository }) => !repository.name.includes("hackathon"))
//     // Filter out "grafana" (we assume that it's the framework)
//     .filter(({ repository }) => repository.name !== "grafana")
//     // Sort them by repository.name
//     .sort((a, b) => a.repository.name.localeCompare(b.repository.name))
//     .map((item) => {
//       table.push([
//         item.repository.name,
//         item.html_url,
//         item.repository.private ? "PRIVATE" : "PUBLIC",
//       ]);
//     });

//   console.log(`Total extensions: ${table.length}`);
//   console.log(table.toString());
// };

// run();
