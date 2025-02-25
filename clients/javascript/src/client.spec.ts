import { buildUrl } from "./request";

describe("The function test suite", () => {
  it("should build the URL with a function username/app-alias", () => {
    const alias = "sunra/text-to-image";
    const url = buildUrl(alias);
    expect(url).toMatch(`sunra.run/${alias}`);
  });
});
