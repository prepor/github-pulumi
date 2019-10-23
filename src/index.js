"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const exec_1 = require("@actions/exec");
const process = __importStar(require("process"));
const fs = __importStar(require("fs"));
const restm = __importStar(require("typed-rest-client/RestClient"));
const github = require('@actions/github');
const stack = core.getInput('stack', { required: true });
const args = core.getInput('args', { required: true });
const root = core.getInput('root');
if (root) {
    process.chdir(root);
}
const workflow = github.context.workflow;
if (workflow) {
    core.exportVariable("PULUMI_CI_SYSTEM", "GitHub");
    core.exportVariable("PULUMI_CI_BUILD_ID", "");
    core.exportVariable("PULUMI_CI_BUILD_TYPE", "");
    core.exportVariable("PULUMI_CI_BUILD_URL", "");
    core.exportVariable("PULUMI_CI_PULL_REQUEST_SHA", github.context.sha);
}
const mode = core.getInput('mode');
let branch;
switch (mode) {
    case 'pr':
        if (!['opened', 'edited', 'synchronize'].includes(github.context.payload.action)) {
            core.info(`PR event ${github.context.payload.action} contains no changes and does not warrant a Pulumi Preview`);
            core.info("Skipping Pulumi action altogether...");
            process.exit(0);
        }
        branch = github.context.payload.pull_request.base.ref;
        break;
    default:
        branch = github.context.ref;
}
branch = branch.replace('refs/heads/', '');
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        yield exec_1.exec('pulumi', ['stack', 'select', stack]);
        if (fs.existsSync('package.json')) {
            if (fs.existsSync('yarn.lock') || core.getInput('yarn')) {
                yield exec_1.exec('yarn install');
            }
            else {
                yield exec_1.exec('npm install');
            }
        }
        var output = "";
        let options = {
            listeners: {
                stdout: (data) => {
                    let s = data.toString();
                    output += s;
                    core.info(s);
                },
                stderr: (data) => {
                    core.error(data.toString());
                }
            },
            ignoreReturnCode: true
        };
        let cmd = 'pulumi ' + args;
        core.info(`#### :tropical_drink: ${cmd}`);
        const exitCode = yield exec_1.exec(cmd, undefined, options);
        // # If the GitHub action stems from a Pull Request event, we may optionally
        // # leave a comment if the COMMENT_ON_PR is set.
        if (github.context.payload.pull_request && core.getInput('comment-on-pr')) {
            let commentsUrl = github.context.payload.pull_request.comments_url;
            let token = core.getInput('github-token');
            if (!token) {
                core.setFailed("Can't leave a comment, unknown github-token");
            }
            else {
                let body = `#### :tropical_drink: \`${cmd}\`\n\`\`\`\n${output}\n\`\`\``;
                core.info(`Commenting on PR ${commentsUrl}`);
                let gh = new restm.RestClient('github-api');
                yield gh.create(commentsUrl, { body }, {
                    additionalHeaders: {
                        Authorization: `token ${token}`
                    }
                });
            }
        }
        process.exit(exitCode);
    });
}
run().catch(core.setFailed);
