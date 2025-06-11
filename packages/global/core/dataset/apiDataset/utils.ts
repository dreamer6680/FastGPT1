import type { ApiDatasetServerType } from './type';

export const filterApiDatasetServerPublicData = (apiDatasetServer?: ApiDatasetServerType) => {
  if (!apiDatasetServer) return undefined;

  const { apiServer, yuqueServer, feishuShareServer, feishuKnowledgeServer, feishuPrivateServer } =
    apiDatasetServer;

  return {
    apiServer: apiServer
      ? {
          baseUrl: apiServer.baseUrl,
          authorization: '',
          basePath: apiServer.basePath
        }
      : undefined,
    yuqueServer: yuqueServer
      ? {
          userId: yuqueServer.userId,
          token: '',
          basePath: yuqueServer.basePath
        }
      : undefined,
    feishuShareServer: feishuShareServer
      ? {
          user_access_token: feishuShareServer.user_access_token,
          refresh_token: '',
          outdate_time: 0,
          folderToken: feishuShareServer.folderToken,
          appId: feishuShareServer.appId,
          appSecret: feishuShareServer.appSecret
        }
      : undefined,
    feishuKnowledgeServer: feishuKnowledgeServer
      ? {
          user_access_token: feishuKnowledgeServer.user_access_token,
          refresh_token: '',
          outdate_time: 0,
          basePath: feishuKnowledgeServer.basePath
        }
      : undefined,
    feishuPrivateServer: feishuPrivateServer
      ? {
          user_access_token: feishuPrivateServer.user_access_token,
          refresh_token: '',
          outdate_time: 0,
          basePath: feishuPrivateServer.basePath
        }
      : undefined
  };
};
