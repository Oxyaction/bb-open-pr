import { NPMManager } from "./npm-manager";

describe("NpmManager", () => {
  const npmManager = new NPMManager();
  npmManager.setRawJSON('{"dependencies": {"react": "^1.0.0"}}');

  it("should return dependency version", () => {
    expect(npmManager.getDependencyVersion("react")).toEqual({
      name: "react",
      version: "1.0.0",
      rawVersion: "^1.0.0",
      type: "dependencies",
    });
  });

  it("should throw error if dependency not found", () => {
    expect(() => npmManager.getDependencyVersion("lodash")).toThrow(
      "Dependency lodash not found"
    );
  });
});
