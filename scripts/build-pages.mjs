import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
const root = process.cwd(), staging = path.resolve(root, '.pages-build');
if (path.dirname(staging) !== root || path.basename(staging) !== '.pages-build') throw new Error('Invalid staging path');
const backend = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!backend || !/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(backend)) throw new Error('Set NEXT_PUBLIC_SUPABASE_URL to the project URL before building.');
fs.rmSync(staging, { recursive: true, force: true });
fs.mkdirSync(staging, { recursive: true });
for (const name of ['package.json', 'next.config.ts', 'tsconfig.json', 'next-env.d.ts']) fs.copyFileSync(path.join(root, name), path.join(staging, name));
fs.cpSync(path.join(root, 'src'), path.join(staging, 'src'), {
  recursive: true, filter: source => source !== path.join(root, 'src', 'app', 'api'),
});
fs.symlinkSync(path.join(root, 'node_modules'), path.join(staging, 'node_modules'), process.platform === 'win32' ? 'junction' : 'dir');
const result = spawnSync(process.execPath, [path.join(root, 'node_modules/next/dist/bin/next'), 'build'], {
  cwd: staging, stdio: 'inherit', env: { ...process.env, PAGES_EXPORT: '1' },
});
if (result.status !== 0) process.exit(result.status || 1);
fs.writeFileSync(path.join(staging, 'out', '.nojekyll'), '');
console.log('GitHub Pages files are in .pages-build/out');
