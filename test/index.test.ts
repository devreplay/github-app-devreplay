// Requiring our app implementation
import { readFileSync } from "fs";
// import { INITIAL } from "vscode-textmate";
// import { devideByToken } from "../src/parser";
import { convertSource } from "../src/rulecheck";
import { getTriggarableCode } from "../src/rulecheck";
// import { IToken } from "../src/token";
// const lines = ["print(a)"];
const inputSourceToken = [
  "self",
  ".",
  "assertFalse",
  "(",
  "a",
  " ",
  "not",
  " ",
  "in",
  " ",
  "b",
  ")"];

const expectedSourceToken = [
  "self",
  ".",
  "assertNotIn",
  "(",
  "a",
  " ",
  " ",
  ",",
  " ",
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
  const patterns = readFileSync("pattern_example.json").toString();
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

// test("convert source code to token", async () => {
//   const tokens: IToken[] = [];
//   let ruleStack = INITIAL;

//   for (const line of lines) {
//     const tokensinfo = await devideByToken(line, "source.python", ruleStack);
//     // tslint:disable-next-line:no-console
//     console.log(tokensinfo);
//     tokens.push(...tokensinfo.tokens);
//     ruleStack = tokensinfo.ruleStack;
//   }
//   expect(1 + 2 + 3).toBe(6);
// });
