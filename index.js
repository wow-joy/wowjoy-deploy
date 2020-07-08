#!/usr/bin/env node
require("colors");
const { spawn } = require("child_process");
const { StringDecoder } = require("string_decoder");
const { resolve } = require("path");
const deploy = require("./deploy");
const { ROOT_DIR, config } = require("./config");

const decoder = new StringDecoder("utf8");

const GIT_URL = config.gitUrl;
const GIT_BRANCH = config.gitBranch;
const OUTPUT = config.output;
const serviceId = config.serviceId;
const defaultUsername = config.defaultUsername;
const defaultPassword = config.defaultPassword;

const buildProcess = spawn("bash", [
  resolve(__dirname, "build-push.sh"),
  ROOT_DIR,
  GIT_URL,
  GIT_BRANCH,
  OUTPUT,
]);

buildProcess.stdout.on("data", (data) => {
  let msg = decoder.write(data);
  if (msg) {
    console.log(msg);
  }
});
buildProcess.stderr.on("data", (data) => {
  let msg = decoder.write(data);
  if (msg) {
    console.log(msg.red);
    process.exit(1);
  }
});
buildProcess.on("close", () => {
  console.log("build push success.".green.bold);
  try {
    deploy({ serviceId, defaultUsername, defaultPassword });
  } catch (err) {
    console.log("出错了".red, err);
    process.exitCode = 1;
  }
});
