// Requiring our app implementation
import fs from "fs";
import { convertSource } from "../src/rulecheck";
import { getTriggarableCode } from "../src/rulecheck";

const inputSourceToken = [
  "self",
  ".",
  "assertFalse",
  "(",
  "a",
  "not",
  "in",
  "b",
  ")"];
const expectedSourceToken = [
  "self",
  ".",
  "assertNotIn",
  "(",
  "a",
  ",",
  "b",
  ")"];

const pattern = [
  "  self",
  "  .",
  "- assertFalse",
  "+ assertNotIn",
  "- not",
  "- in",
  "+ ,"];

test("get pattern from source code", () => {
  const patterns = fs.readFileSync("pattern_example.json").toString();
  const code = getTriggarableCode(inputSourceToken, patterns);

  if (code !== null) {
    // expect(tokensConvertedDiff.convertedTokens).toEqual()
    expect(code).toEqual(pattern);
  }
});

test("convert source code based on pattern", () => {
  const tokensConvertedDiff = convertSource(inputSourceToken, pattern);

  if (tokensConvertedDiff !== null) {
    // expect(tokensConvertedDiff.convertedTokens).toEqual()
    expect(tokensConvertedDiff.convertedTokens).toEqual(expectedSourceToken);
  }
});
