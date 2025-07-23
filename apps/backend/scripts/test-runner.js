#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Test configurations
const TEST_CONFIGS = {
  fast: {
    config: 'jest.config.fast.js',
    description: 'Fast unit tests (< 5s)',
    timeout: 30000
  },
  unit: {
    config: 'jest.config.unit.js',
    description: 'All unit tests',
    timeout: 60000
  },
  integration: {
    config: 'jest.config.js',
    pattern: 'integration',
    description: 'Integration tests',
    timeout: 180000
  },
  e2e: {
    config: 'jest.config.js',
    pattern: 'e2e',
    description: 'End-to-end tests',
    timeout: 300000
  },
  ci: {
    config: 'jest.config.ci.js',
    description: 'All tests for CI/CD',
    timeout: 600000
  }
};

// Parse command line arguments
const args = process.argv.slice(2);
const testType = args[0] || 'fast';
const watch = args.includes('--watch');
const coverage = args.includes('--coverage');
const verbose = args.includes('--verbose');

// Validate test type
if (!TEST_CONFIGS[testType]) {
  console.error(`❌ Invalid test type: ${testType}`);
  console.error(`Available types: ${Object.keys(TEST_CONFIGS).join(', ')}`);
  process.exit(1);
}

const config = TEST_CONFIGS[testType];

// Build Jest command
const jestArgs = [
  '--experimental-vm-modules',
  'node_modules/.bin/jest'
];

if (config.config) {
  jestArgs.push('--config', config.config);
}

if (config.pattern) {
  jestArgs.push('--testPathPattern', config.pattern);
}

if (watch) {
  jestArgs.push('--watch');
}

if (coverage) {
  jestArgs.push('--coverage');
}

if (verbose) {
  jestArgs.push('--verbose');
}

// Additional Jest arguments from command line
const additionalArgs = args.filter(arg => 
  !['--watch', '--coverage', '--verbose'].includes(arg) && 
  arg !== testType
);
jestArgs.push(...additionalArgs);

console.log(`🧪 Running ${config.description}`);
console.log(`📁 Working directory: ${rootDir}`);
console.log(`⚙️  Command: node ${jestArgs.join(' ')}`);
console.log('─'.repeat(50));

// Run Jest
const jest = spawn('node', jestArgs, {
  cwd: rootDir,
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'test',
    FORCE_COLOR: '1' // Enable colors in output
  }
});

// Handle process events
jest.on('error', (error) => {
  console.error(`❌ Failed to start Jest: ${error.message}`);
  process.exit(1);
});

jest.on('close', (code) => {
  if (code === 0) {
    console.log('─'.repeat(50));
    console.log('✅ Tests completed successfully!');
  } else {
    console.log('─'.repeat(50));
    console.log(`❌ Tests failed with exit code: ${code}`);
  }
  process.exit(code);
});

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping tests...');
  jest.kill('SIGINT');
});