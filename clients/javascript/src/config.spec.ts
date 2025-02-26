import { createConfig } from "./config";
import { describe, expect, test } from 'vitest'

describe("The config test suite", () => {
  test("should set the config variables accordingly", () => {
    const newConfig = {
      credentials: "key-id:key-secret",
    };
    const currentConfig = createConfig(newConfig);
    expect(currentConfig.credentials).toEqual(newConfig.credentials);
  });
});
