## wowjoy 构建部署
- deploy.js
> 构建和部署
- build-push.sh
> 前端项目打包和push到ui层
- index.js
> 整个流程

### deploy.config.js
```js
{
  gitUrl: "....git", // 必填
  gitBranch: "0.0.1", // 必填
  serviceId: "xxxxxxxxxxxxxx", // 必填
  defaultUsername: "zhangsan",
  defaultPassword: "111111",
}
```
### 命令行执行 (配置优先级更高)
> wow-deploy [serviceId] [defaultUsername] [defaultPassword]

> wow-run [serviceId] [defaultUsername] [defaultPassword]



