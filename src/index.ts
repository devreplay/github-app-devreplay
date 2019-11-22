import { fixWithPattern, ILintOut, IPattern, lintWithPattern } from "devreplay";
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
            const fileContent = (await context.github.repos.getContents(
                context.repo({ path: file.filename, ref: pulls.data.head.ref }))).data as { content?: string };

            const content = fileContent.content !== undefined ? fileContent.content : "";
            const fileContentStr = Buffer.from(content, "base64").toString();

            const results = lintWithPattern(file.filename, content, pattern);

            for (const result of results) {
                const fixed = fixWithPattern(fileContentStr, result.pattern);
                const diff = diffLines(fileContentStr, fixed);

                const out: string[] = [];
                diff.forEach((part) => {
                    const symbol =  part.added === true ? "+" : part.removed === true ? "-" : " ";
                    const value = part.value.slice(-1) !== "\n" ? part.value : part.value.slice(0, -1);
                    const splitedValue = value.split(/\r?\n/).join(`\n${symbol}`);
                    out.push(`${symbol}${splitedValue}`);
                  });
                const params = context.issue({body: formatILintOut(result, pulls.data.head.sha, out)});
                context.github.issues.createComment(params);
            }
        }
    }
    app.on("pull_request.opened", changeSuggest);
};

async function readPatternFile(context: Context) {
    let pattern: string;
    try {
        const options = (await context.github.repos.getContents(context.repo({path: "devreplay.json"})))
                        .data as { content?: string };
        const content = options.content !== undefined ? options.content : "";
        pattern = Buffer.from(content, "base64").toString();
    } catch (e) {
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
