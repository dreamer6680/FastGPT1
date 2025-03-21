---
title: '使用ollama接入本地模型 '
description: ' 采用ollama部署自己的模型'
icon: 'api'
draft: false
toc: true
weight: 950
---

[ollama](https://ollama.com/) Ollama是一个开源的AI大模型部署工具，专注于简化大语言模型的部署和使用，支持一键下载和运行各种大模型。

## 安装 Ollama

Ollama 本身支持多种安装方式，但是推荐使用 Docker 拉取镜像部署。如果是个人设备上安装了 Ollama 后续需要解决如何让 Docker 中 Fastgpt 容器访问宿主机 Ollama的问题，较为麻烦。 

### Docker 安装（推荐）

你可以使用 Ollama 官方的 Docker 镜像来一键安装和启动 Ollama 服务（确保你的机器上已经安装了 Docker），命令如下：

```bash
docker pull ollama/ollama 
docker run --rm -d --name ollama -p 11434:11434 ollama/ollama
```

如果你的 fastgpt 是在 Docker 中进行部署的，建议在拉取 Ollama 镜像时保证和 Fastgpt 镜像处于同一网络，否则可能出现 Fastgpt 无法访问的问题，命令如下：

```bash
docker run --rm -d --name ollama --network （你的 Fastgpt 容器所在网络） -p 11434:11434 ollama/ollama
```

### 设备安装

目前 Ollama 已经支持在设备上直接安装下载，你可以在 [ Ollama 官网](https://ollama.com/)上进行安装下载。



## 将 Ollama 接入 Fastgpt

### 1. AI Proxy 接入

如果你采用的是 Fastgpt 中的默认配置文件部署[这里](/docs/development/docker.md)，即默认采用 AI Proxy 进行启动。以及在确保你的 Fastgpt 可以直接访问 Ollama 容器的情况下，就可以运行 Fastgpt ，在页面中选择账号->模型提供商->模型渠道->新增渠道。
![](/docSite\assets\imgs\Ollama-models1.png)
在渠道选择中选择 Ollama ，然后加入自己拉取的模型，最后填入代理地址，如果是容器中安装 Ollama ，代理地址中的 localhost 替换为自己的ip地址。
![](/docSite\assets\imgs\Ollama-models2.png)
最后，在模型配置中，加入自己的模型即可开发使用，具体参考[这里](/docSite\content\zh-cn\docs\development\modelConfig\intro.md)。

### 2. OneAPI 接入

我们也可以使用 Xinference 的命令行工具来启动模型，默认 Model UID 是 qwen-chat（后续通过将通过这个 ID 来访问模型）。

```bash
xinference launch -n qwen-chat - 14 -f pytorch
```

除了 WebUI 和命令行工具， Xinference 还提供了 Python SDK 和 RESTful API 等多种交互方式， 更多用法可以参考 [Xinference 官方文档](https://inference.readthedocs.io/en/latest/getting_started/index.html)。

## 将本地模型接入 One API

One API 的部署和接入请参考[这里](/docs/development/modelconfig/one-api/)。

为 qwen1.5-chat 添加一个渠道，这里的 Base 网站 需要填 Xinference 服务的端点，并且注册 qwen-chat (模型的 UID) 。

![](/imgs/one-api-add-xinference-models.jpg)

可以使用以下命令进行测试：

```bash
curl --location --请求 POST 'https://<oneapi_url>/v1/chat/completions' \
--header 'Authorization: Bearer <oneapi_token>' \
--header 'Content-Type: application/json' \
--data-raw '{
  "model": "qwen-chat",
  "messages": [{"role": "user", "content": "Hello!"}]
}'
```

将 <oneapi_url> 替换为你的 One API 地址，<oneapi_token> 替换为你的 One API 令牌。model 为刚刚在 One API 填写的自定义模型。

## 将本地模型接入 FastGPT

修改 FastGPT 的 `config.json` 配置文件的 llmModels 部分加入 qwen-chat 模型：

```json
...
  "llmModels": [
    {
      "model": "qwen-chat", // 模型名(对应OneAPI中渠道的模型名)
      "name": "Qwen", // 模型别名
      "avatar": "/imgs/model/Qwen.svg", // 模型的logo
      "maxContext": 125000, // 最大上下文
      "maxResponse": 4000, // 最大回复
      "quoteMaxToken": 120000, // 最大引用内容
      "maxTemperature": 1.2, // 最大温度
      "charsPointsPrice": 0, // n积分/1k token（商业版）
      "censor": false, // 是否开启敏感校验（商业版）
      "vision": true, // 是否支持图片输入
      "datasetProcess": true, // 是否设置为知识库处理模型（QA），务必保证至少有一个为true，否则知识库会报错
      "usedInClassify": true, // 是否用于问题分类（务必保证至少有一个为true）
      "usedInExtractFields": true, // 是否用于内容提取（务必保证至少有一个为true）
      "usedInToolCall": true, // 是否用于工具调用（务必保证至少有一个为true）
      "toolChoice": true, // 是否支持工具选择（分类，内容提取，工具调用会用到。）
      "functionCall": false, // 是否支持函数调用（分类，内容提取，工具调用会用到。会优先使用 toolChoice，如果为false，则使用 functionCall，如果仍为 false，则使用提示词模式）
      "customCQPrompt": "", // 自定义文本分类提示词（不支持工具和函数调用的模型
      "customExtractPrompt": "", // 自定义内容提取提示词
      "defaultSystemChatPrompt": "", // 对话默认携带的系统提示词
      "defaultConfig": {} // 请求API时，挟带一些默认配置（比如 GLM4 的 top_p）
    }
  ],
...
```

然后重启 FastGPT 就可以在应用配置中选择 Qwen 模型进行对话：

![](/imgs/fastgpt-list-models.png)

---

+ 参考：[FastGPT + Xinference：一站式本地 LLM 私有化部署和应用开发](https://xorbits.cn/blogs/fastgpt-weather-chat)


