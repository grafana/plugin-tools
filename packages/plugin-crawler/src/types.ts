export type SearchResultItem = {
  fileName: string;
  filePath: string;
  fileUrl: string;
  fileUrlRaw: string;
  repoName: string;
  repoNameFull: string;
  repoUrl: string;
  repoPrivate: boolean;
  isFork: boolean;
  createPluginVersion?: string;
  pluginJson?: any;
  packageJson?: any;
  packageJsonUrl: string;
  packageJsonPath: string;
};

export type PluginType = 'app' | 'datasource' | 'panel' | 'unknown';

// Github API: Rate limit
// ------------------------------------
export interface RateLimitResponse {
  resources: RateLimitResources;
  rate: RateLimitInfo;
}

interface RateLimitResources {
  core: RateLimitInfo;
  search: RateLimitInfo;
  graphql: RateLimitInfo;
  integration_manifest: RateLimitInfo;
  source_import: RateLimitInfo;
  code_scanning_upload: RateLimitInfo;
  actions_runner_registration: RateLimitInfo;
  scim: RateLimitInfo;
  dependency_snapshots: RateLimitInfo;
  code_search: RateLimitInfo;
}

interface RateLimitInfo {
  limit: number;
  used: number;
  remaining: number;
  reset: number;
}

// Github API: Code search
// ------------------------------------
export interface CodeSearchResponse {
  total_count: number;
  incomplete_results: boolean;
  items: CodeSearchItem[];
}

export interface CodeSearchItem {
  name: string;
  path: string;
  sha: string;
  url: string;
  git_url: string;
  html_url: string;
  repository: CodeSearchRepository;
  score: number;
}

export interface CodeSearchRepository {
  id: number;
  node_id: string;
  name: string;
  full_name: string;
  owner: CodeSearchRepositoryOwner;
  private: boolean;
  html_url: string;
  description: string;
  fork: boolean;
  url: string;
  forks_url: string;
  keys_url: string;
  collaborators_url: string;
  teams_url: string;
  hooks_url: string;
  issue_events_url: string;
  events_url: string;
  assignees_url: string;
  branches_url: string;
  tags_url: string;
  blobs_url: string;
  git_tags_url: string;
  git_refs_url: string;
  trees_url: string;
  statuses_url: string;
  languages_url: string;
  stargazers_url: string;
  contributors_url: string;
  subscribers_url: string;
  subscription_url: string;
  commits_url: string;
  git_commits_url: string;
  comments_url: string;
  issue_comment_url: string;
  contents_url: string;
  compare_url: string;
  merges_url: string;
  archive_url: string;
  downloads_url: string;
  issues_url: string;
  pulls_url: string;
  milestones_url: string;
  notifications_url: string;
  labels_url: string;
  deployments_url: string;
  releases_url: string;
}

export interface CodeSearchRepositoryOwner {
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  gravatar_id: string;
  url: string;
  html_url: string;
  followers_url: string;
  following_url: string;
  gists_url: string;
  starred_url: string;
  subscriptions_url: string;
  organizations_url: string;
  repos_url: string;
  events_url: string;
  received_events_url: string;
  type: string;
  site_admin: boolean;
}
