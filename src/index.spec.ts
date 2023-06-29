import { foo } from './bitbucket-cli';

describe('testFoo', () => {
  it('should return 3', () => {
    expect(foo(1, 2)).toBe(3);
  });
});
