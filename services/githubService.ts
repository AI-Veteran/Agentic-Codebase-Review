
import {
    GITHUB_API_BASE,
    MAX_FILES_TO_PROCESS,
    ALLOWED_EXTENSIONS,
    IGNORED_DIRECTORIES,
    FILE_PRIORITY_ORDER
} from '../constants';

const getAuthHeaders = () => {
    const token = typeof process !== 'undefined' ? process.env.GITHUB_TOKEN : undefined;
    return {
        'Accept': 'application/vnd.github.v3+json',
        ...(token ? { 'Authorization': `token ${token}` } : {})
    };
};

const decodeBase64 = (str: string, filePath?: string) => {
    try {
        return atob(str);
    } catch (e) {
        console.error(`Failed to decode base64 string for file: ${filePath || 'unknown'}`, e);
        return `Error decoding content for ${filePath || 'unknown file'}`;
    }
};

interface GitHubTreeFile {
    path: string;
    type: 'blob' | 'tree';
    sha: string;
    size?: number;
}

const parseRepoUrl = (url: string): { owner: string; repo: string } => {
    try {
        const urlObj = new URL(url);
        if (urlObj.hostname !== 'github.com') {
            throw new Error('Not a GitHub URL');
        }
        const pathParts = urlObj.pathname.slice(1).split('/');
        const owner = pathParts[0];
        const repo = pathParts[1];
        if (!owner || !repo) {
            throw new Error('Invalid repository path');
        }
        return { owner, repo: repo.replace('.git', '') };
    } catch (e) {
        console.warn('Invalid URL provided:', url, e);
        throw new Error('Invalid GitHub repository URL. Please use a format like https://github.com/owner/repo.');
    }
};

const fetchBranchSha = async (owner: string, repo: string, branch: string): Promise<string> => {
    const branchUrl = `${GITHUB_API_BASE}/repos/${owner}/${repo}/branches/${branch}`;
    const branchRes = await fetch(branchUrl, { headers: getAuthHeaders() });
    if (!branchRes.ok) {
        throw new Error(`Could not find branch '${branch}'. Status: ${branchRes.status}. Please check the repository URL and branch name.`);
    }
    const branchData = await branchRes.json();
    return branchData.commit.commit.tree.sha;
};

const fetchRecursiveTree = async (owner: string, repo: string, treeSha: string): Promise<GitHubTreeFile[]> => {
    const treeUrl = `${GITHUB_API_BASE}/repos/${owner}/${repo}/git/trees/${treeSha}?recursive=1`;
    const treeRes = await fetch(treeUrl, { headers: getAuthHeaders() });
    if (!treeRes.ok) {
        throw new Error(`Failed to fetch repository file tree. Status: ${treeRes.status}`);
    }
    const treeData = await treeRes.json();
    if (treeData.truncated) {
        console.warn("Repository tree is too large and has been truncated by the GitHub API. Analysis may be incomplete.");
    }
    return treeData.tree as GitHubTreeFile[];
};

const filterAndSortFiles = (tree: GitHubTreeFile[]): GitHubTreeFile[] => {
    const getFilePriority = (path: string): number => {
        const fileName = path.split('/').pop() || '';
        const exactMatchIndex = FILE_PRIORITY_ORDER.indexOf(fileName);
        if (exactMatchIndex !== -1) return exactMatchIndex;

        const extension = '.' + fileName.split('.').pop();
        const extensionIndex = FILE_PRIORITY_ORDER.indexOf(extension);
        return extensionIndex === -1 ? FILE_PRIORITY_ORDER.length : extensionIndex;
    };

    return tree
        .filter(file =>
            file.type === 'blob' &&
            ALLOWED_EXTENSIONS.some(ext => file.path.endsWith(ext)) &&
            !file.path.split('/').some(segment => IGNORED_DIRECTORIES.includes(segment))
        )
        .sort((a, b) => getFilePriority(a.path) - getFilePriority(b.path))
        .slice(0, MAX_FILES_TO_PROCESS);
};

const fetchFileContentsBatched = async (owner: string, repo: string, branch: string, files: GitHubTreeFile[]): Promise<{ path: string; content: string }[]> => {
    const BATCH_SIZE = 5;
    const results: { path: string; content: string }[] = [];

    for (let i = 0; i < files.length; i += BATCH_SIZE) {
        const batch = files.slice(i, i + BATCH_SIZE);
        const batchPromises = batch.map(async file => {
            const fileUrl = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${file.path}?ref=${branch}`;
            try {
                const fileRes = await fetch(fileUrl, { headers: getAuthHeaders() });
                if (!fileRes.ok) {
                    console.warn(`Could not fetch content for ${file.path}`);
                    return null;
                }
                const fileData = await fileRes.json();
                if (fileData.encoding !== 'base64') {
                    console.warn(`Skipping file with unexpected encoding '${fileData.encoding}': ${file.path}`);
                    return null;
                }
                const content = decodeBase64(fileData.content, file.path);
                return { path: file.path, content };
            } catch (error) {
                console.error(`Error fetching file ${file.path}:`, error);
                return null;
            }
        });

        const batchResults = await Promise.all(batchPromises);
        batchResults.forEach(res => {
            if (res) results.push(res);
        });
    }
    
    return results;
};

const formatCodebaseContext = (fileContents: { path: string; content: string }[]): string => {
    if (fileContents.length === 0) {
        throw new Error("Failed to fetch content for any of the selected source files.");
    }

    let context = "Here is the codebase to analyze:\n\n";
    fileContents.forEach(file => {
        context += `--- FILE: ${file.path} ---\n`;
        context += `${file.content}\n\n`;
    });
    return context;
};

export const fetchRepoContents = async (repoUrl: string, branch: string): Promise<string> => {
    const { owner, repo } = parseRepoUrl(repoUrl);
    const treeSha = await fetchBranchSha(owner, repo, branch);
    const tree = await fetchRecursiveTree(owner, repo, treeSha);
    
    const filesToFetch = filterAndSortFiles(tree);
    if (filesToFetch.length === 0) {
        throw new Error("No processable source code files found in the repository. Check the branch or repository content.");
    }
    
    const fileContents = await fetchFileContentsBatched(owner, repo, branch, filesToFetch);
    return formatCodebaseContext(fileContents);
};
