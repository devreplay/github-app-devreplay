import fs from "fs";
import { Application, Context } from "probot";
import { INITIAL } from "vscode-textmate";
import { devideByToken } from "./parser";
import { convertSource, getTriggarableCode } from "./rulecheck";
import { sources } from "./source";
import { IToken } from "./token";

export = (app: Application) => {

    async function changeSuggest(context: Context) {
        const issue = context.issue();
        const pattern = await readPatternFile(context);

        const allFiles = await context.github.pulls.listFiles(issue);
        for (const file of allFiles.data) {

            const fileSource = getSource(file.filename);
            const addedlines = file.patch.match(/(\n\+)+\s*[^\d\+](.*)/g);
            if (fileSource && addedlines) {
                const tokens: IToken[] = [];
                let ruleStack = INITIAL;
                for (let line of addedlines) {
                    line = line.slice(2);
                    const tokeninfo = await devideByToken(line, fileSource, ruleStack);
                    tokens.push(...tokeninfo.tokens);
                    ruleStack = tokeninfo.ruleStack;
                }
                const tokenvalues: string[] = [];
                for (const token of tokens) {
                    tokenvalues.push(token.value);
                }
                const code = getTriggarableCode(tokenvalues, pattern);
                if (!code) { continue; }
                const tokensConvertedDiff = convertSource(tokenvalues, code);
                if (tokensConvertedDiff === null) { continue; }
                const diff = `
\`\`\`diff
- ${tokensConvertedDiff.originalTokens.join("")}
+ ${tokensConvertedDiff.convertedTokens.join("")}
\`\`\``;
                const output = `Your \`${file.filename}\` should be\n${diff}`;
                const params = context.issue({body: output});
                context.github.issues.createComment(params);
            }
        }
    }

    app.on("pull_request.opened", changeSuggest);
};

async function readPatternFile(context: Context) {
    let pattern: string;
    try {
        const options = await context.github.repos.getContents(await context.repo({path: "pattern.json"}));
        pattern = Buffer.alloc(options.data.content, "base64").toString();
    } catch (err) {
        return fs.readFileSync("./pattern.json").toString();
    }
    if (pattern === "") {
        pattern = fs.readFileSync("./pattern.json").toString();
    }
    return pattern;
}

/**
 * Identify kind of source file
 */
function getSource(fileName: string) {
    for (const source of sources) {
        if (source.extensions.some((x) => fileName.endsWith(x))) {
            return source.source;
        }
    }
    return;
}
