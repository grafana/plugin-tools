export type ExtensionsCommandOptions = {
  addedLinks: boolean;
  addedComponents: boolean;
  extensionPoints: boolean;
  exposedComponents: boolean;
  noCache: boolean;
  json: string;
  pluginId: string;
};

export type ExtensionsMeta = {
  addedLinks: any[];
  addedComponents: any[];
  extensionPoints: any[];
  exposedComponents: any[];
};

export const extensionsCommand = async ({
  addedLinks,
  addedComponents,
  extensionPoints,
  exposedComponents,
  noCache,
  json,
  // pluginId,
}: ExtensionsCommandOptions) => {
  const all = !addedLinks && !addedComponents && !extensionPoints && !exposedComponents;
  const results: ExtensionsMeta = {
    addedLinks: [],
    addedComponents: [],
    extensionPoints: [],
    exposedComponents: [],
  };

  console.log('(1) Crawling extensions');

  if (noCache) {
    console.log('(2) No cache');
    process.env.CLEAR_CACHE = 'true';
  }

  if (all || addedLinks) {
    console.log('(3.1) Added links');
    results.addedLinks = [];
  }

  if (all || addedComponents) {
    console.log('(3.2) Added components');
    // const addedComponents = await getAddedComponents();
    // results.addedComponents = sortReposByName(skipForksAndHackathons(addedComponents));
    results.addedComponents = [];
  }

  if (all || extensionPoints) {
    console.log('(3.3) Extension points');
    results.extensionPoints = [];
  }

  if (all || exposedComponents) {
    console.log('(3.4) Exposed components');
    results.exposedComponents = [];
  }

  if (json) {
    console.log('(4) As JSON');
    console.log(JSON.stringify(results, null, 2));
    return;
  }

  // Non JSON
};
