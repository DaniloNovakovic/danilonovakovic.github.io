import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const repoRoot = process.cwd();
const outDir = path.join(repoRoot, 'node_modules', '.tmp', 'ridge-source-generator');
const checkOnly = process.argv.includes('--check');

const ridgeSources = [{
  sourcePath: 'src/game/scenes/ridge/blockout/sources/contract-fixture.source.ts',
  generatedPath: 'src/game/scenes/ridge/blockout/sources/contract-fixture.generated.ts',
  exportName: 'CONTRACT_FIXTURE_RIDGE_COMPILED_BLOCKOUT',
  typeImportPath: '../sourceContract'
}];

function cleanGeneratedRuntime() {
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'package.json'), '{"type":"commonjs"}\n');
}

function emitRuntimeModules(rootNames) {
  const program = ts.createProgram({
    rootNames,
    options: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
      moduleResolution: ts.ModuleResolutionKind.Node10,
      rootDir: repoRoot,
      outDir,
      strict: true,
      skipLibCheck: true,
      esModuleInterop: true,
      ignoreDeprecations: '6.0'
    }
  });
  const diagnostics = ts.getPreEmitDiagnostics(program);
  if (diagnostics.length > 0) {
    const formatted = ts.formatDiagnosticsWithColorAndContext(diagnostics, {
      getCanonicalFileName: (fileName) => fileName,
      getCurrentDirectory: () => repoRoot,
      getNewLine: () => '\n'
    });
    throw new Error(formatted);
  }
  const result = program.emit();
  if (result.emitSkipped) {
    throw new Error('Ridge source generator runtime emit was skipped.');
  }
}

function compiledModulePath(relativePath) {
  return path.join(outDir, relativePath).replace(/\.ts$/, '.js');
}

function readSourceModule(sourcePath) {
  const compiledPath = compiledModulePath(sourcePath);
  const sourceModule = require(compiledPath);
  return sourceModule.default;
}

cleanGeneratedRuntime();
emitRuntimeModules([
  path.join(repoRoot, 'src/game/scenes/ridge/blockout/sourceCompiler.ts'),
  ...ridgeSources.map((source) => path.join(repoRoot, source.sourcePath))
]);

const {
  compileRidgeBlockoutSource,
  serializeRidgeCompiledBlockout
} = require(compiledModulePath('src/game/scenes/ridge/blockout/sourceCompiler.ts'));

const staleFiles = [];

for (const source of ridgeSources) {
  const blockoutSource = readSourceModule(source.sourcePath);
  const compiled = compileRidgeBlockoutSource(blockoutSource);
  const nextContent = serializeRidgeCompiledBlockout({
    exportName: source.exportName,
    compiled,
    typeImportPath: source.typeImportPath
  });
  const generatedPath = path.join(repoRoot, source.generatedPath);
  const currentContent = fs.existsSync(generatedPath)
    ? fs.readFileSync(generatedPath, 'utf8')
    : '';

  if (currentContent !== nextContent) {
    if (checkOnly) {
      staleFiles.push(source.generatedPath);
    } else {
      fs.writeFileSync(generatedPath, nextContent);
      console.log(`generated ${source.generatedPath}`);
    }
  }
}

if (staleFiles.length > 0) {
  console.error('Ridge source generated files are stale:');
  staleFiles.forEach((filePath) => console.error(`- ${filePath}`));
  process.exit(1);
}

if (checkOnly) {
  console.log(`Ridge source generated files are current (${ridgeSources.length}).`);
}
