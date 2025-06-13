import Sequencer from '@jest/test-sequencer';

class CustomSequencer extends Sequencer {
  sort(tests) {
    // Sort tests to run faster, more reliable tests first
    return tests.sort((testA, testB) => {
      // Priority order:
      // 1. Unit tests (models, helpers)
      // 2. Service tests
      // 3. Controller tests
      // 4. Route tests
      // 5. Integration tests
      // 6. E2E tests
      // 7. Performance/Load tests

      const getPriority = (testPath) => {
        if (testPath.includes('/models/') || testPath.includes('/test/helpers/')) return 1;
        if (testPath.includes('/services/')) return 2;
        if (testPath.includes('/controllers/')) return 3;
        if (testPath.includes('/routes/')) return 4;
        if (testPath.includes('/integration/')) return 5;
        if (testPath.includes('/e2e/')) return 6;
        if (testPath.includes('/performance/') || testPath.includes('/load/')) return 7;
        return 8; // Default for other tests
      };

      const priorityA = getPriority(testA.path);
      const priorityB = getPriority(testB.path);

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      // If same priority, sort by filename alphabetically
      return testA.path.localeCompare(testB.path);
    });
  }
}

export default CustomSequencer;