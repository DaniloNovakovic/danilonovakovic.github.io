import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const ignoredDirs = new Set([
  '.git',
  'dist',
  'node_modules',
  'storybook-static'
]);
const ignoredRelativeDirs = new Set([
  '.agents/skills'
]);
const markdownLinkPattern = /(?<!!)\[[^\]]*]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
const inlinePathPattern = /(?<![\w./-])(?:src|docs|\.agents)\/[A-Za-z0-9_./*-]+/g;
const markdownFiles = [];
const failures = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignoredDirs.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const relativePath = path.relative(repoRoot, fullPath).split(path.sep).join('/');
      if (ignoredRelativeDirs.has(relativePath)) continue;
      walk(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      markdownFiles.push(fullPath);
    }
  }
}

function stripFragment(target) {
  const hashIndex = target.indexOf('#');
  return hashIndex === -1 ? target : target.slice(0, hashIndex);
}

function shouldSkipTarget(target) {
  return (
    target === '' ||
    target.startsWith('#') ||
    /^[a-z][a-z0-9+.-]*:/i.test(target)
  );
}

function normalizeRelativeTarget(filePath, target) {
  const withoutFragment = stripFragment(decodeURI(target));
  if (shouldSkipTarget(withoutFragment)) return null;
  if (withoutFragment.startsWith('/')) {
    return path.join(repoRoot, withoutFragment);
  }
  return path.resolve(path.dirname(filePath), withoutFragment);
}

function pathExists(targetPath) {
  return fs.existsSync(targetPath);
}

function locationFor(content, index) {
  const before = content.slice(0, index);
  const line = before.split('\n').length;
  return line;
}

function report(filePath, line, message) {
  failures.push(`${path.relative(repoRoot, filePath)}:${line} ${message}`);
}

function validateMarkdownLinks(filePath, content) {
  for (const match of content.matchAll(markdownLinkPattern)) {
    const rawTarget = match[1].replace(/[.,;:!?]+$/, '');
    if (shouldSkipTarget(rawTarget)) continue;
    const targetPath = normalizeRelativeTarget(filePath, rawTarget);
    if (!targetPath || pathExists(targetPath)) continue;
    report(
      filePath,
      locationFor(content, match.index ?? 0),
      `broken markdown link target "${rawTarget}"`
    );
  }
}

function validateInlinePaths(filePath, content) {
  for (const match of content.matchAll(inlinePathPattern)) {
    const rawTarget = match[0].replace(/[.,;:!?]+$/, '');
    if (rawTarget.includes('*')) continue;
    const targetPath = path.resolve(repoRoot, rawTarget);
    if (pathExists(targetPath)) continue;
    report(
      filePath,
      locationFor(content, match.index ?? 0),
      `missing inline path "${rawTarget}"`
    );
  }
}

walk(repoRoot);

for (const filePath of markdownFiles) {
  const content = fs.readFileSync(filePath, 'utf8');
  validateMarkdownLinks(filePath, content);
  validateInlinePaths(filePath, content);
}

if (failures.length > 0) {
  console.error('Documentation reference check failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Documentation reference check passed for ${markdownFiles.length} markdown files.`);
