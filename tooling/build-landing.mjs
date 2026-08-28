#!/usr/bin/env node
// Сборка одного лендинга: валидация -> astro build -> отчёт о dist/.
//
//   npm run build:landing -- --slug area-kata-family [--prod]
import { execFileSync } from 'node:child_process';
import { existsSync, statSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, activeSlug } from '../packages/config/load.mjs';

const args = process.argv.slice(2);
const opt = (n) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const prod = args.includes('--prod');
const slug = opt('slug') || activeSlug();

const env = { ...process.env, LANDING_SLUG: slug };
if (prod) env.LANDING_ENV = 'production';

const run = (cmd, cmdArgs) =>
  execFileSync(cmd, cmdArgs, { cwd: ROOT, env, stdio: 'inherit' });

console.log(`\n▸ ${slug}${prod ? ' (прод)' : ' (превью)'}\n`);

run(process.execPath, ['tooling/validate-landing.mjs', '--slug', slug, ...(prod ? ['--prod'] : [])]);
run('npx', ['astro', 'build']);

const dist = join(ROOT, 'dist');
if (!existsSync(join(dist, 'index.html'))) {
  console.error('✗ dist/index.html не собрался');
  process.exit(1);
}

const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]
  );

const files = walk(dist);
const bytes = files.reduce((sum, f) => sum + statSync(f).size, 0);

console.log(`\n✓ dist/: ${files.length} файлов, ${(bytes / 1024).toFixed(0)} КБ`);
console.log('  Открывается как статика, без бэкенда.\n');
