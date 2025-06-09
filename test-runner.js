#!/usr/bin/env node

/**
 * Comprehensive Test Runner for Monero Payment System
 * Runs all types of tests with proper sequencing and reporting
 */

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

const runCommand = (command, args, cwd) => {
  return new Promise((resolve, reject) => {
    console.log(`\n🔄 Running: ${command} ${args.join(' ')} in ${cwd}`);
    
    const process = spawn(command, args, {
      cwd,
      stdio: 'inherit',
      shell: true
    });

    process.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ Success: ${command} ${args.join(' ')}`);
        resolve(code);
      } else {
        console.log(`❌ Failed: ${command} ${args.join(' ')} (exit code: ${code})`);
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    process.on('error', reject);
  });
};

const generateTestReport = async (results) => {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: results.length,
      passed: results.filter(r => r.status === 'passed').length,
      failed: results.filter(r => r.status === 'failed').length,
      skipped: results.filter(r => r.status === 'skipped').length
    },
    details: results
  };

  await fs.writeFile('test-results.json', JSON.stringify(report, null, 2));
  console.log('\n📊 Test report generated: test-results.json');
  
  return report;
};

async function runAllTests() {
  console.log('🚀 Starting Comprehensive Monero Payment Test Suite\n');
  
  const results = [];
  const startTime = Date.now();

  // Test configurations
  const testSuites = [
    {
      name: 'Backend Unit Tests',
      category: 'unit',
      command: 'npm',
      args: ['test', '--', '--testPathPattern=services'],
      cwd: './backend',
      timeout: 60000
    },
    {
      name: 'Backend Integration Tests',
      category: 'integration',
      command: 'npm',
      args: ['test', '--', '--testPathPattern=integration'],
      cwd: './backend',
      timeout: 120000
    },
    {
      name: 'Frontend Component Tests',
      category: 'unit',
      command: 'npm',
      args: ['test', '--', '--run', 'src/components/checkout/__tests__/MoneroPayment.minimal.test.jsx'],
      cwd: './frontend',
      timeout: 60000
    },
    {
      name: 'E2E Tests',
      category: 'e2e',
      command: 'npx',
      args: ['playwright', 'test', '--project=chromium'],
      cwd: './frontend',
      timeout: 300000
    },
    {
      name: 'Load Tests',
      category: 'load',
      command: 'npm',
      args: ['test', '--', '--testPathPattern=load'],
      cwd: './backend',
      timeout: 180000
    },
    {
      name: 'Security Tests',
      category: 'security',
      command: 'npm',
      args: ['test', '--', '--testPathPattern=security'],
      cwd: './backend',
      timeout: 120000
    },
    {
      name: 'Performance Tests',
      category: 'performance',
      command: 'npm',
      args: ['test', '--', '--testPathPattern=performance'],
      cwd: './backend',
      timeout: 180000
    }
  ];

  // Run tests sequentially to avoid conflicts
  for (const suite of testSuites) {
    const suiteStartTime = Date.now();
    
    try {
      console.log(`\n🧪 Running ${suite.name} (${suite.category})`);
      console.log('─'.repeat(50));
      
      await runCommand(suite.command, suite.args, suite.cwd);
      
      const duration = Date.now() - suiteStartTime;
      results.push({
        name: suite.name,
        category: suite.category,
        status: 'passed',
        duration,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      const duration = Date.now() - suiteStartTime;
      results.push({
        name: suite.name,
        category: suite.category,
        status: 'failed',
        duration,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      console.log(`⚠️  ${suite.name} failed, continuing with remaining tests...`);
    }
  }

  // Generate comprehensive report
  const totalDuration = Date.now() - startTime;
  const report = await generateTestReport(results);
  
  console.log('\n' + '='.repeat(60));
  console.log('📋 COMPREHENSIVE TEST RESULTS SUMMARY');
  console.log('='.repeat(60));
  console.log(`⏱️  Total Duration: ${Math.round(totalDuration / 1000)}s`);
  console.log(`✅ Passed: ${report.summary.passed}/${report.summary.total}`);
  console.log(`❌ Failed: ${report.summary.failed}/${report.summary.total}`);
  console.log(`⏭️  Skipped: ${report.summary.skipped}/${report.summary.total}`);
  
  // Category breakdown
  console.log('\n📊 Results by Category:');
  const categories = [...new Set(results.map(r => r.category))];
  categories.forEach(category => {
    const categoryResults = results.filter(r => r.category === category);
    const passed = categoryResults.filter(r => r.status === 'passed').length;
    const total = categoryResults.length;
    console.log(`   ${category}: ${passed}/${total} passed`);
  });

  // Detailed results
  console.log('\n📝 Detailed Results:');
  results.forEach(result => {
    const status = result.status === 'passed' ? '✅' : '❌';
    const duration = Math.round(result.duration / 1000);
    console.log(`   ${status} ${result.name} (${duration}s)`);
    if (result.error) {
      console.log(`      Error: ${result.error}`);
    }
  });

  // Exit with appropriate code
  const hasFailures = report.summary.failed > 0;
  
  if (hasFailures) {
    console.log('\n❌ Some tests failed. Check the results above for details.');
    process.exit(1);
  } else {
    console.log('\n🎉 All tests passed successfully!');
    process.exit(0);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(error => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  });
}

export { runAllTests };