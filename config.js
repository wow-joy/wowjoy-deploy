require("colors");
const { resolve } = require("path");

const [_, __, serviceId, defaultUsername, defaultPassword] = process.argv;
const ROOT_DIR = resolve().replace(/\\/g, "/");
const config = require(resolve(ROOT_DIR, "./deploy.config.js"));

if (!config.gitUrl || !config.gitBranch) {
  console.log(
    "Error: (serviceId, gitUrl, gitBranch)必须提供，请前往开发者平台获取serviceId, 完善deploy.config.js"
      .red
  );
  throw new Error("config error");
}
if (serviceId) config.serviceId = serviceId;
if (defaultUsername) config.defaultUsername = defaultUsername;
if (defaultPassword) config.defaultPassword = defaultPassword;

module.exports = {
  ROOT_DIR,
  config,
};
