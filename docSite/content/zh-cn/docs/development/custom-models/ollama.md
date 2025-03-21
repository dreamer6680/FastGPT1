---
title: '使用 Ollama 接入本地模型 '
description: ' 采用 Ollama 部署自己的模型'
icon: 'api'
draft: false
toc: true
weight: 950
---

[Ollama](https://ollama.com/) 是一个开源的AI大模型部署工具，专注于简化大语言模型的部署和使用，支持一键下载和运行各种大模型。

## 安装 Ollama

Ollama 本身支持多种安装方式，但是推荐使用 Docker 拉取镜像部署。如果是个人设备上安装了 Ollama 后续需要解决如何让 Docker 中 FastGPT 容器访问宿主机 Ollama的问题，较为麻烦。 

### Docker 安装（推荐）

你可以使用 Ollama 官方的 Docker 镜像来一键安装和启动 Ollama 服务（确保你的机器上已经安装了 Docker），命令如下：

```bash
docker pull ollama/ollama 
docker run --rm -d --name ollama -p 11434:11434 ollama/ollama
```

如果你的 FastGPT 是在 Docker 中进行部署的，建议在拉取 Ollama 镜像时保证和 FastGPT 镜像处于同一网络，否则可能出现 FastGPT 无法访问的问题，命令如下：

```bash
docker run --rm -d --name ollama --network （你的 Fastgpt 容器所在网络） -p 11434:11434 ollama/ollama
```

在安装完成后，需要进行检测测试，首先进入 FastGPT 所在的容器，尝试访问自己的 Ollama 容器，命令如下：

```bash
docker exec -it 容器名 /bin/sh
curl http://XXX.XXX.XXX.XXX:11434  #ip地址不能是localhost
```
看到访问显示自己的 Ollama 服务以及启动，说明两个容器可以正常通信。

## 将 Ollama 接入 FastGPT

### 1. AI Proxy 接入

如果你采用的是 FastGPT 中的默认配置文件部署[这里](/docs/development/docker.md)，即默认采用 AI Proxy 进行启动。以及在确保你的 FastGPT 可以直接访问 Ollama 容器的情况下，就可以运行 FastGPT ，在页面中选择账号->模型提供商->模型渠道->新增渠道。

![](/imgs/Ollama-models1.png)

在渠道选择中选择 Ollama ，然后加入自己拉取的模型，最后填入代理地址，如果是容器中安装 Ollama ，代理地址中的 localhost 替换为自己的ip地址。

![](/imgs/Ollama-models2.png)

最后，在模型配置中，加入自己的模型即可开发使用，具体参考[这里](/docs/development/modelConfig/intro.md)。

### 2. OneAPI 接入

如果你想使用 OneAPI ，可以首先修改部署 FastGPT 的 docker-compose.yml 文件，在其中将 AI Proxy 的使用注释，在 OPENAI_BASE_URL 中加入自己的 OneAPI 开放地址，默认是http://自己的IP:端口/v1，v1必须填写。KEY 中填写自己在 OneAPI 的令牌。

![](/imgs/Ollama-models-oneapi1.png)

进入 OneAPI 页面，添加新的渠道，类型选择 Ollama ，在模型中填入自己 Ollama 中的模型，需要保证名字对应，再在下方填入自己的 Ollama 代理地址，默认http://自己的IP:端口，不需要填写/v1。添加成功后在 OneAPI 进行渠道测试，测试成功则说明添加成功。

在 FastGPT 中点击账号->模型提供商->模型配置->新增模型，添加自己的模型即可，添加模型时需要保证模型ID和Ollama中的模型ID一致。

![](/imgs/Ollama-models-direct2.png)

### 3. 直接接入
如果你既不想使用 AI Proxy，也不想使用 OneAPI，也可以选择直接接入，修改部署 FastGPT 的 docker-compose.yml 文件，在其中将 AI Proxy 的使用注释，采用和 OneAPI 的类似配置。注释掉 AIProxy 相关代码，在OPENAI_BASE_URL中加入自己的 Ollama 开放地址，默认是http://自己的IP:端口/v1，v1必须填写。在KEY中随便填入，因为 Ollama 默认没有鉴权，如果开启鉴权，请自行填写。其他操作和在 OneAPI 中加入 Ollama 一致，只需在 FastGPT 中加入自己的模型即可使用。

---



