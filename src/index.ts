import { fixWithPattern, ILintOut, IPattern } from "devreplay";
// import * as diff from "diff";
import { diffLines } from "diff";
import { readFileSync } from "fs";
import { Application, Context } from "probot";

export = (app: Application) => {

    async function changeSuggest(context: Context) {
        const issue = context.issue();
        const rules = await readPatternFile(context);
        const pattern = JSON.parse(rules) as IPattern[];
        const pulls = await context.github.pulls.get(issue);
        const allFiles = await context.github.pulls.listFiles(issue);
        for (const file of allFiles.data) {
            const fileContent = await context.github.repos.getContents(
                await context.repo({path: file.filename, ref: pulls.data.head.ref}));
            const fileContentStr = Buffer.from(fileContent.data.content, "base64").toString();

            const results = await fixWithPattern(file.filename, fileContentStr, pattern);

            for (const result of results) {
                const diff = diffLines(fileContentStr, result[0]);

                const out: string[] = [];
                diff.forEach((part) => {
                    const symbol =  part.added ? "+" : part.removed ? "-" : " ";
                    const value = part.value.slice(-1) !== "\n" ? part.value : part.value.slice(0, -1);
                    out.push(`${symbol} ` + value.split(/\r?\n/).join(`\n${symbol} `));
                  });
                const params = context.issue({body: formatILintOut(result[1], pulls.data.head.sha, out)});
                context.github.issues.createComment(params);
            }
        }
    }
    app.on("pull_request.opened", changeSuggest);
};

async function readPatternFile(context: Context) {
    let pattern: string;
    try {
        const options = await context.github.repos.getContents(await context.repo({path: "devreplay.json"}));
        pattern = Buffer.from(options.data.content, "base64").toString();
    } catch (err) {
        return readFileSync("./devreplay.json").toString();
    }
    if (pattern === "") {
        pattern = readFileSync("./devreplay.json").toString();
    }
    return pattern;
}

function formatILintOut(matched: ILintOut, sha: string, out: string[]) {
    // tslint:disable-next-line: max-line-length
    return `[${matched.position.fileName}](../blob/${sha}/${matched.position.fileName}#L${matched.position.start}) : should be
 \n\`\`\`diff\n${out.join("\n")}\n\`\`\``;
}
