/**
 * Standalone PPTX Generator Fallback
 * (gemini)
 *
 * Usage: node scripts/mcp/pptx-standalone.js <input.md> <output.pptx>
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../');
const GENERATOR_DIR_CANDIDATES = [
  path.join(ROOT, '.mcp-servers/pptx-generator-mcp'),
  path.join(ROOT, '.worktrees/agent-traces/.mcp-servers/pptx-generator-mcp')
];

function resolveGeneratorDir() {
  return GENERATOR_DIR_CANDIDATES.find((candidate) => fs.existsSync(path.join(candidate, 'generator.js')));
}

async function main() {
  const [inputPath, outputPath] = process.argv.slice(2);

  if (!inputPath || !outputPath) {
    console.log('Usage: node scripts/mcp/pptx-standalone.js <input.md> <output.pptx>');
    process.exit(1);
  }

  const absInput = path.resolve(process.cwd(), inputPath);
  const absOutput = path.resolve(process.cwd(), outputPath);

  console.log(`Generating PPTX from ${absInput} to ${absOutput}...`);

  try {
    // Dynamically import the generator logic from the worktree
    const generatorDir = resolveGeneratorDir();
    if (!generatorDir) {
      throw new Error('Generator not found. Ensure .mcp-servers/pptx-generator-mcp is installed.');
    }
    const generatorPath = path.join(generatorDir, 'generator.js');
    if (!fs.existsSync(generatorPath)) {
      throw new Error(`Generator not found at ${generatorPath}. Ensure worktree .mcp-servers are installed.`);
    }

    const { generatePresentation } = await import(`file://${generatorPath}`);
    const markdown = fs.readFileSync(absInput, 'utf8');

    await generatePresentation(markdown, absOutput, generatorDir);

    console.log('Successfully generated PPTX.');
  } catch (error) {
    console.error('Failed to generate PPTX:', error);
    process.exit(1);
  }
}

main();
