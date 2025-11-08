
// A simple base64 decoder
const decodeBase64 = (str: string) => {
    try {
        // The 'g' argument in replace is not needed for atob and can cause issues in some environments.
        const sanitizedStr = str.replace(/\s/g, '');
        return atob(sanitizedStr);
    } catch (e) {
        console.error("Failed to decode base64 string", e);
        return "Error decoding content";
    }
};

const GITHUB_API_BASE = 'https://api.github.com';
const MAX_FILES_TO_PROCESS = 50; // Increased from 25 to get more context
const ALLOWED_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.go', '.rb', '.php', '.cs', '.html', '.css', '.scss', '.json', '.yml', '.yaml', '.md', 'Dockerfile'];
const IGNORED_DIRECTORIES = ['node_modules', 'dist', 'build', 'coverage', '.git', '.github', 'vendor', 'target', 'assets', 'img', 'images', 'docs'];

// Priority list for sorting files to ensure code is prioritized over documentation
const FILE_PRIORITY_ORDER = [
    'package.json',
    'Dockerfile',
    '.ts', '.tsx', '.js', '.jsx',
    '.py', '.java', '.go', '.rb', '.php', '.cs',
    '.html', '.css', '.scss',
    '.yml', '.yaml',
    '.json',
    '.md'
];

interface GitHubTreeFile {
    path: string;
    type: 'blob' | 'tree';
    sha: string;
    size?: number;
}

const parseRepoUrl = (url: string): { owner: string; repo: string } | null => {
    try {
        const urlObj = new URL(url);
        if (urlObj.hostname !== 'github.com') {
            return null;
        }
        const pathParts = urlObj.pathname.slice(1).split('/');
        const owner = pathParts[0];
        const repo = pathParts[1];
        if (!owner || !repo) {
            return null;
        }
        return { owner, repo: repo.replace('.git', '') };
    } catch (e) {
        console.warn('Invalid URL provided to parseRepoUrl:', url, e);
        return null;
    }
};


export const fetchRepoContents = async (repoUrl: string, branch: string): Promise<string> => {
    const repoInfo = parseRepoUrl(repoUrl);
    if (!repoInfo) {
        throw new Error('Invalid GitHub repository URL. Please use a format like https://github.com/owner/repo.');
    }
    const { owner, repo } = repoInfo;

    // 1. Get the latest commit SHA for the branch
    const branchUrl = `${GITHUB_API_BASE}/repos/${owner}/${repo}/branches/${branch}`;
    const branchRes = await fetch(branchUrl);
    if (!branchRes.ok) {
        throw new Error(`Could not find branch '${branch}'. Status: ${branchRes.status}. Please check the repository URL and branch name.`);
    }
    const branchData = await branchRes.json();
    const treeSha = branchData.commit.commit.tree.sha;

    // 2. Fetch the recursive file tree
    const treeUrl = `${GITHUB_API_BASE}/repos/${owner}/${repo}/git/trees/${treeSha}?recursive=1`;
    const treeRes = await fetch(treeUrl);
    if (!treeRes.ok) {
        throw new Error(`Failed to fetch repository file tree. Status: ${treeRes.status}`);
    }
    const treeData = await treeRes.json();

    if (treeData.truncated) {
        console.warn("Repository tree is too large and has been truncated by the GitHub API. Analysis may be incomplete.");
    }
    
    // 3. Filter and prioritize files
    const getFilePriority = (path: string): number => {
        const fileName = path.split('/').pop() || '';
        if (FILE_PRIORITY_ORDER.includes(fileName)) {
            return FILE_PRIORITY_ORDER.indexOf(fileName);
        }
        const extension = '.' + fileName.split('.').pop();
        const index = FILE_PRIORITY_ORDER.indexOf(extension);
        // If not found, give it a low priority (put it at the end)
        return index === -1 ? FILE_PRIORITY_ORDER.length : index;
    };
    
    const filesToFetch = (treeData.tree as GitHubTreeFile[])
        .filter(file =>
            file.type === 'blob' &&
            ALLOWED_EXTENSIONS.some(ext => file.path.endsWith(ext)) &&
            !file.path.split('/').some(segment => IGNORED_DIRECTORIES.includes(segment))
        )
        .sort((a, b) => getFilePriority(a.path) - getFilePriority(b.path))
        .slice(0, MAX_FILES_TO_PROCESS);

    if (filesToFetch.length === 0) {
        throw new Error("No processable source code files found in the repository. Check the branch or repository content.");
    }
    
    // 4. Fetch content for each file
    const filePromises = filesToFetch.map(async file => {
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

    const fileContents = await Promise.all(filePromises);

    // 5. Format into a single string for the AI context
    let context = "Here is the codebase to analyze:\n\n";
    let filesIncluded = 0;
    fileContents.forEach(file => {
        if (file) {
            context += `--- FILE: ${file.path} ---\n`;
            context += `${file.content}\n\n`;
            filesIncluded++;
        }
    });

    if (filesIncluded === 0) {
        throw new Error("Failed to fetch content for any of the selected source files.");
    }

    return context;
};
