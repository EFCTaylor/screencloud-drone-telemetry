'use strict';

describe('project bootstrap', () => {
  it('runs on the pinned Node.js major version', () => {
    expect(process.versions.node).toMatch(/^20\./);
  });
});
