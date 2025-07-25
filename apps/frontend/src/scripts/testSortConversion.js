// Test script to verify sort parameter conversion
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Extract the convertSortParams function from useProducts.js
const useProductsContent = readFileSync(join(__dirname, '../hooks/useProducts.js'), 'utf8');

// Extract the function using a simple regex (for testing purposes)
const convertSortParamsMatch = useProductsContent.match(/const convertSortParams = \(params\) => \{[\s\S]*?\n {2}\};/);
if (!convertSortParamsMatch) {
  console.error('Could not extract convertSortParams function');
  process.exit(1);
}

// Create a test function
const testCode = `
${convertSortParamsMatch[0]}

// Test cases
const testCases = [
  {
    input: { sort: 'price-low', page: 1 },
    expected: { sortBy: 'price', sortOrder: 'asc', page: 1 }
  },
  {
    input: { sort: 'price-high', page: 1 },
    expected: { sortBy: 'price', sortOrder: 'desc', page: 1 }
  },
  {
    input: { sort: 'name-asc', page: 1 },
    expected: { sortBy: 'name', sortOrder: 'asc', page: 1 }
  },
  {
    input: { sort: 'name-desc', page: 1 },
    expected: { sortBy: 'name', sortOrder: 'desc', page: 1 }
  },
  {
    input: { sort: 'newest', page: 1 },
    expected: { sortBy: 'createdAt', sortOrder: 'desc', page: 1 }
  },
  {
    input: { sort: 'oldest', page: 1 },
    expected: { sortBy: 'createdAt', sortOrder: 'asc', page: 1 }
  },
  {
    input: { page: 1, condition: 'new' },
    expected: { page: 1, condition: 'new' }
  },
  {
    input: { sortBy: 'price', sortOrder: 'asc', page: 1 },
    expected: { sortBy: 'price', sortOrder: 'asc', page: 1 }
  }
];

console.log('🧪 Testing Sort Parameter Conversion...\\n');

let allPassed = true;

testCases.forEach((testCase, index) => {
  const result = convertSortParams(testCase.input);
  const passed = JSON.stringify(result) === JSON.stringify(testCase.expected);
  
  console.log(\`Test \${index + 1}: \${passed ? '✅ PASS' : '❌ FAIL'}\`);
  console.log(\`  Input:    \${JSON.stringify(testCase.input)}\`);
  console.log(\`  Expected: \${JSON.stringify(testCase.expected)}\`);
  console.log(\`  Actual:   \${JSON.stringify(result)}\`);
  console.log();
  
  if (!passed) {
    allPassed = false;
  }
});

console.log(\`\\n🎯 Overall Result: \${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}\`);
`;

eval(testCode);