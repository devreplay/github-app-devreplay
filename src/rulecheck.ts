import fs from "fs";

export function convertSource(tokens: string[], code: string[]) {
    const originalTokens = [];
    const convertedTokens = [];

    let startPosition = 0;
    for (const codeToken of code) {
        let isFound = false;
        const initialSymbol = codeToken.slice(0, 1);
        const planeCodeToken = codeToken.slice(2);
        if (initialSymbol === "-") {
            for (let index = startPosition; index < tokens.length; index++) {
                const token = tokens[index];
                if (token === planeCodeToken) {
                    startPosition = index + 1;
                    originalTokens.push(token);
                    isFound = true;
                    break;
                } else {
                    startPosition = index + 1;
                    if (convertedTokens.length > 0) {
                        originalTokens.push(token);
                        convertedTokens.push(token);
                    }
                }
            }
            if (!isFound) {
                return null;
            }
        } else if (initialSymbol === "+") {
            convertedTokens.push(planeCodeToken);
        } else if (initialSymbol === " ") {
            for (let index = startPosition; index < tokens.length; index++) {
                const token = tokens[index];
                if (token === planeCodeToken) {
                    convertedTokens.push(token);
                    originalTokens.push(token);
                    startPosition = index + 1;
                    isFound = true;
                    break;
                } else if (convertedTokens.length > 0) {
                    convertedTokens.push(token);
                    originalTokens.push(token);
                }
            }
            if (!isFound) {
                return null;
            }
        }
    }
    originalTokens.push(...tokens.slice(startPosition));
    convertedTokens.push(...tokens.slice(startPosition));
    return {originalTokens, convertedTokens};
}

export function getTriggarableCode(tokens: string[], patterns: string) {
    const patternJson = JSON.parse(patterns);

    for (const pattern of patternJson) {
        if (isTriggarable(pattern.trigger, tokens)) {
            return pattern.code;
        }
    }
}

function isTriggarable(trigger: string[], tokens: string[]) {
    let startPosition = 0;
    for (const trigToken of trigger) {
      let isFound = false;
      for (let index = startPosition; index < tokens.length; index++) {
        const token = tokens[index];
        if (trigToken === token) {
          isFound = true;
          startPosition = index + 1;
        }
      }
      if (!isFound) {
        return false;
      }
    }
    return true;
}
