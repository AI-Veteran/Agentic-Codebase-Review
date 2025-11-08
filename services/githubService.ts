import {
    GITHUB_API_BASE,
    MAX_FILES_TO_PROCESS,
    ALLOWED_EXTENSIONS,
    IGNORED_DIRECTORIES,
    FILE_PRIORITY_ORDER
} from '../constants';

// A simple base64 decoder
const decodeBase64 = (str: string) => {
    try {
        return atob(str);
    } catch (e) {
        console.error("Failed to decode base64 string", e);
        return "Error decoding content";
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
    const branchRes = await fetch(branchUrl);
    if (!branchRes.ok) {
        throw new Error(`Could not find branch '${branch}'. Status: ${branchRes.status}. Please check the repository URL and branch name.`);
    }
    const branchData = await branchRes.json();
    return branchData.commit.commit.tree.sha;
};

const fetchRecursiveTree = async (owner: string, repo: string, treeSha: string): Promise<GitHubTreeFile[]> => {
    const treeUrl = `${GITHUB_API_BASE}/repos/${owner}/${repo}/git/trees/${treeSha}?recursive=1`;
    const treeRes = await fetch(treeUrl);
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

const fetchFileContents = async (owner: string, repo: string, branch: string, files: GitHubTreeFile[]): Promise<{ path: string; content: string }[]> => {
    const filePromises = files.map(async file => {
        const fileUrl = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${file.path}?ref=${branch}`;
        try {
            const fileRes = await fetch(fileUrl);
            if (!fileRes.ok) {
                console.warn(`Could not fetch content for ${file.path}`);
                return null;
            }
            const fileData = await fileRes.json();
            if (fileData.encoding !== 'base64') {
                console.warn(`Skipping file with unexpected encoding '${fileData.encoding}': ${file.path}`);
                return null;
            }
            const content = decodeBase64(fileData.content);
            return { path: file.path, content };
        } catch (error) {
            console.error(`Error fetching file ${file.path}:`, error);
            return null;
        }
    });

    const settledFiles = await Promise.all(filePromises);
    return settledFiles.filter((file): file is { path: string, content: string } => file !== null);
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
    
    const fileContents = await fetchFileContents(owner, repo, branch, filesToFetch);
    return formatCodebaseContext(fileContents);
};
