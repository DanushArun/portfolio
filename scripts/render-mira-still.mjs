import { spawnSync } from 'node:child_process';

const args = [
  'remotion',
  'still',
  'src/remotion/index.tsx',
  'MiraRenderBoard',
  'remotion-out/mira-render-board.png',
  '--frame=105',
  '--gl=angle',
];

const result = spawnSync('npx', args, { stdio: 'inherit' });

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
