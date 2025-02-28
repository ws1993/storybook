import { describe, expect, it, vi } from 'vitest';

import { versions } from 'storybook/internal/common';

import { blocker, shouldBlockUpgrade } from './block-major-version';

describe('shouldBlockUpgrade', () => {
  // Test invalid versions
  it('returns false for invalid versions', () => {
    expect(shouldBlockUpgrade('', '8.0.0')).toBe(false);
    expect(shouldBlockUpgrade('7.0.0', '')).toBe(false);
    expect(shouldBlockUpgrade('invalid', '8.0.0')).toBe(false);
    expect(shouldBlockUpgrade('7.0.0', 'invalid')).toBe(false);
  });

  // Test prerelease versions
  it('returns false when upgrading from a prerelease', () => {
    expect(shouldBlockUpgrade('6.0.0-canary.1', '8.0.0')).toBe(false);
    expect(shouldBlockUpgrade('6.0.0-alpha.0', '8.0.0')).toBe(false);
    expect(shouldBlockUpgrade('6.0.0-beta.1', '8.0.0')).toBe(false);
    expect(shouldBlockUpgrade('6.0.0-rc.1', '8.0.0')).toBe(false);
    expect(shouldBlockUpgrade('0.0.0-bla-0', '8.0.0')).toBe(false);
  });

  it('returns false when upgrading to a prerelease', () => {
    expect(shouldBlockUpgrade('6.0.0', '8.0.0-alpha.1')).toBe(false);
    expect(shouldBlockUpgrade('6.0.0', '8.0.0-canary.0')).toBe(false);
    expect(shouldBlockUpgrade('6.0.0', '8.0.0-beta.1')).toBe(false);
    expect(shouldBlockUpgrade('6.0.0', '8.0.0-rc.0')).toBe(false);
    expect(shouldBlockUpgrade('6.0.0', '0.0.0-bla-0')).toBe(false);
  });

  // Test version gaps
  it('returns false when versions are one major apart', () => {
    expect(shouldBlockUpgrade('6.0.0', '7.0.0')).toBe(false);
    expect(shouldBlockUpgrade('7.0.0', '8.0.0')).toBe(false);
    expect(shouldBlockUpgrade('6.5.0', '7.0.0')).toBe(false);
  });

  it('returns true when versions are more than one major apart', () => {
    expect(shouldBlockUpgrade('6.0.0', '8.0.0')).toBe(true);
    expect(shouldBlockUpgrade('5.0.0', '7.0.0')).toBe(true);
    expect(shouldBlockUpgrade('6.5.0', '8.0.0')).toBe(true);
  });

  // Test with current CLI version
  it('correctly handles upgrades to current CLI version', () => {
    const cliVersion = versions.storybook;
    const cliMajor = parseInt(cliVersion.split('.')[0], 10);

    // Should block if more than one major behind
    expect(shouldBlockUpgrade(`${cliMajor - 2}.0.0`, cliVersion)).toBe(true);
    expect(shouldBlockUpgrade(`${cliMajor - 3}.5.0`, cliVersion)).toBe(true);

    // Should not block if one major behind or on same major
    expect(shouldBlockUpgrade(`${cliMajor - 1}.0.0`, cliVersion)).toBe(false);
    expect(shouldBlockUpgrade(`${cliMajor}.0.0`, cliVersion)).toBe(false);

    // Should not block if upgrading from a prerelease
    expect(shouldBlockUpgrade(`${cliMajor - 2}.0.0-canary.1`, cliVersion)).toBe(false);
    expect(shouldBlockUpgrade(`${cliMajor - 2}.0.0-alpha.0`, cliVersion)).toBe(false);
    expect(shouldBlockUpgrade(`${cliMajor - 2}.0.0-beta.1`, cliVersion)).toBe(false);
    expect(shouldBlockUpgrade(`${cliMajor - 2}.0.0-rc.0`, cliVersion)).toBe(false);
  });

  // Test version zero
  it('returns false for version zero', () => {
    expect(shouldBlockUpgrade('0.1.0', '8.0.0')).toBe(false);
    expect(shouldBlockUpgrade('6.0.0', '0.1.0')).toBe(false);
    expect(shouldBlockUpgrade('0.0.1', '0.0.2')).toBe(false);
  });
});

describe('blocker', () => {
  const mockPackageManager = {
    retrievePackageJson: vi.fn(),
  };

  it('returns false if no version found', async () => {
    mockPackageManager.retrievePackageJson.mockResolvedValue({});
    const result = await blocker.check({ packageManager: mockPackageManager } as any);
    expect(result).toBe(false);
  });

  it('returns false if version check fails', async () => {
    mockPackageManager.retrievePackageJson.mockRejectedValue(new Error('test'));
    const result = await blocker.check({ packageManager: mockPackageManager } as any);
    expect(result).toBe(false);
  });

  it('returns version data if upgrade should be blocked', async () => {
    mockPackageManager.retrievePackageJson.mockResolvedValue({
      dependencies: {
        '@storybook/react': '6.0.0',
      },
    });
    versions.storybook = '8.0.0';
    const result = await blocker.check({ packageManager: mockPackageManager } as any);
    expect(result).toEqual({ currentVersion: '6.0.0' });
  });

  describe('log', () => {
    it('includes upgrade command for valid versions', () => {
      const message = blocker.log({ packageManager: mockPackageManager } as any, {
        currentVersion: '6.0.0',
      });
      expect(message).toContain('You can upgrade to version 7 by running:');
      expect(message).toContain('npx storybook@7 upgrade');
    });

    it('omits upgrade command for invalid versions', () => {
      const message = blocker.log({ packageManager: mockPackageManager } as any, {
        currentVersion: 'invalid',
      });
      expect(message).not.toContain('You can upgrade to version');
      expect(message).toContain('Major Version Gap Detected');
      expect(message).toContain('For more information about upgrading');
    });
  });
});
