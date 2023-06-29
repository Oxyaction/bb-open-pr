import { NPMManager } from './npm-manager';

describe('NpmManager', () => {
  const npmManager = new NPMManager();
  npmManager.setRawJSON('{"dependencies": {"react": "^1.0.0"}}');

  describe('getDependencyVersion', () => {
    it('should return dependency version', () => {
      expect(npmManager.getDependencyVersion('react')).toEqual({
        name: 'react',
        version: '1.0.0',
        rawVersion: '^1.0.0',
        type: 'dependencies',
      });
    });

    it('should throw error if dependency not found', () => {
      expect(() => npmManager.getDependencyVersion('lodash')).toThrow(
        'Dependency lodash not found'
      );
    });
  });

  describe('updateDependencyVersion', () => {
    it('should update dependency version', () => {
      const version = npmManager.getDependencyVersion('react');
      const newVersion = npmManager.updateDependencyVersion(version, '2.0.0');
      expect(newVersion).toEqual(JSON.stringify({ dependencies: { react: '2.0.0' } }, null, 2));
    });

    it('should throw error if dependency not found', () => {
      const version = {
        name: 'lodash',
        version: '1.0.0',
        rawVersion: '^1.0.0',
        type: 'dependencies',
      };
      expect(() => npmManager.updateDependencyVersion(version, '2.0.0')).toThrow(
        'Dependency dependencies.lodash not found'
      );
    });
  });
});
