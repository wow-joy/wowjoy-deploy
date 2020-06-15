#!/usr/bin/env node
require("colors");
const fetch = require("./fetch");
const { prompt } = require("inquirer");
const { start, stop } = require("./loading");

// 登录
async function login({ defaultUsername, defaultPassword }) {
  console.log("=====    登录    =====".blue);
  const { username, password } = await prompt([
    {
      type: "input",
      message: "请输入用户名:",
      name: "username",
      default: defaultUsername,
    },
    {
      type: "password",
      message: "请输入密码",
      name: "password",
      default: defaultPassword,
      when(answers) {
        return Boolean(answers.username);
      },
    },
  ]);
  return fetch(
    "https://kfz.rubikstack.com/api/auth/login",
    {
      password,
      username,
    },
    { method: "post" }
  ).then((res) => {
    if (!res) {
      throw new Error("登录失败".red.bgCyan);
    }
    console.log("登录成功".green.bgBlack);
    return res;
  });
}

async function getServiceId({ gitUrl, accessToken, tokenType }) {
  console.log("获取服务列表...".yellow);
  const authorization = `${tokenType} ${accessToken}`;
  start();
  const res = await fetch(
    "https://kfz.rubikstack.com/graphql",
    {
      operationName: "GET_SERVICEID",
      variables: {
        gitUrl,
      },
      query: `
        query GET_SERVICEID($gitUrl: String!){
          microService(query: { gitUrl: $gitUrl }) {
            id
            description
            name
          }
        }
      `,
    },
    {
      method: "post",
      headers: {
        authorization,
      },
    }
  );
  stop();
  const microService = res && res.data && res.data.microService;
  if (microService) {
    console.log(
      "服务名：",
      microService.name,
      " 服务描述：",
      microService.description
    );
  }
  return microService ? microService.id : undefined;
}

// 构建
async function build({ accessToken, tokenType, userId, serviceId }) {
  console.log("=====    构建    =====".blue);
  const authorization = `${tokenType} ${accessToken}`;
  // 获取service Version list
  console.log("获取服务版本...".yellow);
  start();
  const {
    data: {
      microServiceVersions: { content },
    },
  } = await fetch(
    "https://kfz.rubikstack.com/graphql",
    {
      operationName: "GET_SERVICE_VERSIONS",
      variables: {
        serviceId,
        limit: 10,
        offset: 0,
      },
      query: `
        query GET_SERVICE_VERSIONS($serviceId: UUID!, $limit: Int, $offset: Int) {
          microServiceVersions(query: {microService: {id: $serviceId}}, orderBy: {createTime: desc}, limit: $limit, offset: $offset) {
            content {
              id
              name
              description
            }
          }
        }
      `,
    },
    {
      method: "post",
      headers: {
        authorization,
      },
    }
  );
  stop();
  // 选择版本
  const { serviceVersionId } = await prompt({
    type: "list",
    message: "请选择构建的版本:",
    name: "serviceVersionId",
    choices: content.map((v) => v.name),
    filter(val) {
      return content.find((v) => v.name === val).id;
    },
  });
  const {
    data: {
      createBuild: { id: buildId },
    },
  } = await fetch(
    "https://kfz.rubikstack.com/graphql",
    {
      operationName: "CREATE_BUILD",
      variables: {
        serviceVersionId,
        userId,
      },
      query: `
        mutation CREATE_BUILD($serviceVersionId: UUID!, $userId: UUID!) {
          createBuild(Build: {microServiceVersion: {id: $serviceVersionId}, creator: {id: $userId}}) {
            id
          }
        }
      `,
    },
    {
      method: "post",
      headers: {
        authorization,
      },
    }
  );
  console.log("开始构建...".yellow);

  // 查询构建成功
  let status = "running";
  start();
  while (status === "running") {
    await new Promise((res) => setTimeout(res, 2000));
    const res = await fetch(
      "https://kfz.rubikstack.com/graphql",
      {
        operationName: "GET_BUILD",
        variables: { buildId },
        query: `
          query GET_BUILD($buildId: UUID!) {
            build(query: {id: $buildId}) {
              id
              status
              commitMessage                
            }
          }
        `,
      },
      {
        method: "post",
        headers: {
          authorization,
        },
      }
    );
    status = res.data.build.status;
  }
  stop();
  if (status !== "success") {
    console.log("构建失败了，再试一下或者找一下问题".red);
    throw new Error("build failed.");
  }
  console.log("构建成功".green);
  return {
    buildId,
    serviceVersionId,
  };
}

// 开始部署
async function deployStart({
  accessToken,
  tokenType,
  userId,
  buildId,
  serviceVersionId,
}) {
  console.log("===== 准备部署 =====".blue);
  const authorization = `${tokenType} ${accessToken}`;

  // 获取service clusters list
  console.log("获取集群...".yellow);
  start();
  const {
    data: {
      clusters: { content: clusterContent },
    },
  } = await fetch(
    "https://kfz.rubikstack.com/graphql",
    {
      operationName: "GET_CLUSTERS",
      variables: { clusterType: "dev", limit: 100, offset: 0 },
      query: `
      query GET_CLUSTERS($limit: Int, $offset: Int, $clusterType: ClusterType) {
        clusters(query: {clusterType: $clusterType}, limit: $limit, offset: $offset) {
          content {
            id
            name
            config
            clusterType
            __typename
          }
        }
      }
    `,
    },
    {
      method: "post",
      headers: {
        authorization,
      },
    }
  );
  stop();
  // 选择集群
  const { clusterId } = await prompt({
    type: "list",
    message: "请选择集群:",
    name: "clusterId",
    choices: clusterContent.map((v) => v.name),
    filter(val) {
      return clusterContent.find((v) => v.name === val).id;
    },
  });
  // 获取service namespace list
  console.log("获取空间...".yellow);
  start();
  const {
    data: {
      namespaces: { content: nameSpaceContent },
    },
  } = await fetch(
    "https://kfz.rubikstack.com/graphql",
    {
      operationName: "GET_CLUSTER_NAMESPACES",
      variables: {
        clusterId,
        limit: 100,
        offset: 0,
      },
      query: `
        query GET_CLUSTER_NAMESPACES($clusterId: UUID!, $offset: Int, $limit: Int) {
          namespaces(query: {cluster: {id: $clusterId}}, offset: $offset, limit: $limit) {
            content {
              id
              name
            }
          }
        }
      `,
    },
    {
      method: "post",
      headers: {
        authorization,
      },
    }
  );
  stop();
  // 选择空间
  const { namespaceId } = await prompt({
    type: "list",
    message: "请选择空间:",
    name: "namespaceId",
    choices: nameSpaceContent.map((v) => v.name),
    filter(val) {
      return nameSpaceContent.find((v) => v.name === val).id;
    },
  });
  // 构建
  console.log("提交构建...".yellow);
  const {
    data: {
      createDeploy: { id: deployId },
    },
  } = await fetch(
    "https://kfz.rubikstack.com/graphql",
    {
      operationName: "CREATE_DEPLOY",
      variables: {
        serviceVersionId,
        userId,
        buildId,
        namespaceId,
      },
      query: `
        mutation CREATE_DEPLOY($buildId: UUID!, $serviceVersionId: UUID!, $namespaceId: UUID!, $userId: UUID!) {
          createDeploy(Deploy: {namespace: {id: $namespaceId}, build: {id: $buildId}, microServiceVersion: {id: $serviceVersionId}, creator: {id: $userId}}) {
            id
          }
        }
      `,
    },
    {
      method: "post",
      headers: {
        authorization,
      },
    }
  );
  if (!deployId) {
    console.log("提交构建失败".red);
    throw new Error("start deploy failed.");
  }
  console.log("提交构建成功".green);
  return {
    deployId,
  };
}

// 部署
async function deploy({
  accessToken,
  tokenType,
  userId,
  buildId,
  serviceVersionId,
  deployId,
}) {
  console.log("===== deploy =====".blue);
  const authorization = `${tokenType} ${accessToken}`;

  // 获取部署状态
  console.log("start get deploy status...".yellow);
  let status = "requestSuccess";
  let id;
  start();
  while (status === "requestSuccess") {
    await new Promise((res) => setTimeout(res, 3000));
    const {
      data: { deploy },
    } = await fetch(
      "https://kfz.rubikstack.com/graphql",
      {
        operationName: "GET_DEPLOY_TITLE",
        variables: { deployId },
        query: `
          query GET_DEPLOY_TITLE($deployId: UUID!) {
            deploy(query: {id: $deployId}) {
              id
              name
              status
              __typename
            }
          }
        `,
      },
      {
        method: "post",
        headers: {
          authorization,
        },
      }
    );
    id = deploy.id;
    status = deploy.status;
  }
  stop();
  if (status !== "success") {
    console.log("部署失败了！！！！！".red);
    throw new Error("build failed.");
  }
  console.log("部署成功了！".green);
  return {
    id,
  };
}

async function main({ serviceId, defaultUsername, defaultPassword, gitUrl }) {
  const {
    accessToken,
    expiryDuration,
    refreshToken,
    tokenType,
    userId,
  } = await login({ defaultUsername, defaultPassword });
  const sid = await getServiceId({ gitUrl, accessToken, tokenType });
  await new Promise((res) => setTimeout(res, 2000));
  if (!serviceId) {
    serviceId = sid;
  } else if (!sid) {
    const { isUseLocal } = await prompt({
      type: "confirm",
      message:
        "获取不到该serviceId, 请确认你配置的gitUrl正确, 或者直接使用配置中serviceId ？",
      name: "isUseLocal",
    });
    if (!isUseLocal) {
      return;
    }
  } else if (sid !== serviceId) {
    const { isUseOnline } = await prompt({
      type: "confirm",
      message:
        "获取到的 serviceId 和你的配置 serviceId 不一致, 是否使用获取的 serviceId？",
      name: "isUseOnline",
    });
    if (isUseOnline) {
      serviceId = sid;
    }
  }
  const { buildId, serviceVersionId } = await build({
    accessToken,
    expiryDuration,
    refreshToken,
    tokenType,
    userId,
    serviceId,
  });
  const { deployId } = await deployStart({
    accessToken,
    tokenType,
    userId,
    buildId,
    serviceVersionId,
  });
  const { id } = await deploy({
    accessToken,
    tokenType,
    userId,
    buildId,
    serviceVersionId,
    deployId,
  });
  return {
    accessToken,
    expiryDuration,
    refreshToken,
    tokenType,
    userId,
    buildId,
    serviceVersionId,
    deployId,
  };
}

if (__filename === require.main.filename) {
  const { config } = require("./config");
  main(config);
}

module.exports = main;
