import { Octokit } from '@octokit/rest';
import { Config } from './utils/config';
import { logger } from './utils/logger';
import { GitHubError } from './utils/errors';

let octokit: Octokit;
let config: Config;

export function initGitHub(cfg: Config): void {
  config = cfg;
  octokit = new Octokit({ auth: cfg.githubToken });
}

export async function openSolutionPR(
  challengeId: number,
  contributor: string,
  decryptedCode: string
): Promise<void> {
  if (!octokit || !config) {
    throw new GitHubError('GitHub client not initialized');
  }

  const branch = `zk-wavescout/challenge-${challengeId}-${contributor.slice(0, 8)}`;
  const filePath = `solutions/challenge-${challengeId}.ts`;

  try {
    // Get base branch SHA
    let baseRef;
    try {
      const { data: ref } = await octokit.git.getRef({
        owner: config.githubOwner,
        repo: config.githubRepo,
        ref: `heads/${config.githubBaseBranch}`,
      });
      baseRef = ref;
    } catch (err: any) {
      if (err.status === 404) {
        throw new GitHubError(
          `Base branch '${config.githubBaseBranch}' not found in repository`,
          err
        );
      }
      throw err;
    }

    // Create solution branch
    try {
      await octokit.git.createRef({
        owner: config.githubOwner,
        repo: config.githubRepo,
        ref: `refs/heads/${branch}`,
        sha: baseRef.object.sha,
      });
    } catch (err: any) {
      if (err.status === 422) {
        // Branch already exists, try to delete and recreate
        try {
          await octokit.git.deleteRef({
            owner: config.githubOwner,
            repo: config.githubRepo,
            ref: `heads/${branch}`,
          });
          await octokit.git.createRef({
            owner: config.githubOwner,
            repo: config.githubRepo,
            ref: `refs/heads/${branch}`,
            sha: baseRef.object.sha,
          });
        } catch (deleteErr: any) {
          throw new GitHubError(`Failed to create or recreate branch '${branch}'`, deleteErr);
        }
      } else {
        throw err;
      }
    }

    // Commit decrypted solution file
    try {
      await octokit.repos.createOrUpdateFileContents({
        owner: config.githubOwner,
        repo: config.githubRepo,
        path: filePath,
        message: `feat: ZK-WaveScout solution for challenge #${challengeId}`,
        content: Buffer.from(decryptedCode).toString('base64'),
        branch,
      });
    } catch (err: any) {
      throw new GitHubError(`Failed to commit solution file '${filePath}'`, err);
    }

    // Open pull request
    let prUrl: string;
    try {
      const { data: pr } = await octokit.pulls.create({
        owner: config.githubOwner,
        repo: config.githubRepo,
        head: branch,
        base: config.githubBaseBranch,
        title: `ZK-WaveScout: Challenge #${challengeId} — verified solution`,
        body: `Automatically merged by zk-wavescout-coordinator.\n\n**Contributor:** \`${contributor}\`\n**Challenge:** #${challengeId}`,
      });
      prUrl = pr.html_url;
    } catch (err: any) {
      if (err.status === 422) {
        throw new GitHubError('Pull request already exists for this branch', err);
      }
      throw new GitHubError('Failed to create pull request', err);
    }

    logger.info(`PR opened: ${prUrl}`);
  } catch (err: any) {
    if (err instanceof GitHubError) {
      throw err;
    }
    throw new GitHubError(
      `GitHub API error: ${err.message || JSON.stringify(err)}`,
      err instanceof Error ? err : undefined
    );
  }
}
