import { ensureEndpointIdFormat, parseEndpointId } from "./utils";

describe("The utils test suite", () => {
  it("shoud match a current appOwner/appId format", () => {
    const id = "sunra/fast-sdxl";
    expect(ensureEndpointIdFormat(id)).toBe(id);
  });

  it("shoud match a current appOwner/appId/path format", () => {
    const id = "sunra/fast-sdxl/image-to-image";
    expect(ensureEndpointIdFormat(id)).toBe(id);
  });

  it("should throw on an invalid app id format", () => {
    const id = "just-an-id";
    expect(() => ensureEndpointIdFormat(id)).toThrowError();
  });

  it("should parse a current app id", () => {
    const id = "sunra/fast-sdxl";
    const parsed = parseEndpointId(id);
    expect(parsed).toEqual({
      owner: "sunra",
      alias: "fast-sdxl",
    });
  });

  it("should parse a current app id with path", () => {
    const id = "sunra/fast-sdxl/image-to-image";
    const parsed = parseEndpointId(id);
    expect(parsed).toEqual({
      owner: "sunra",
      alias: "fast-sdxl",
      path: "image-to-image",
    });
  });

  it("should parse a current app id with namespace", () => {
    const id = "workflows/sunra/fast-sdxl";
    const parsed = parseEndpointId(id);
    expect(parsed).toEqual({
      owner: "sunra",
      alias: "fast-sdxl",
      namespace: "workflows",
    });
  });
});
