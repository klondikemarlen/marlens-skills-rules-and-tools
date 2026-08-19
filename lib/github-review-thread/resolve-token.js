import { spawnSync } from 'node:child_process';

export function resolveToken(environment) {
  if (typeof environment.GITHUB_TOKEN === 'string' && environment.GITHUB_TOKEN.trim()) return environment.GITHUB_TOKEN;
  if (typeof environment.GH_TOKEN === 'string' && environment.GH_TOKEN.trim()) return environment.GH_TOKEN;

  const ghToken = spawnSync('gh', ['auth', 'token'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (ghToken.status !== 0) return undefined;
  const token = ghToken.stdout?.trim();
  return token || undefined;
}
