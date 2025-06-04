import { useApiDatasetRequest } from './custom/api';
import { useYuqueDatasetRequest } from './yuqueDataset/api';
import { useFeishuShareDatasetRequest } from './feishuShareDataset/api';
import { useFeishuKnowledgeDatasetRequest } from './feishuKnowledgeDataset/api';
import { useFeishuPrivateDatasetRequest } from './feishuPrivateDataset/api';
import type { ApiDatasetServerType } from '@fastgpt/global/core/dataset/apiDataset/type';

export const getApiDatasetRequest = async (apiDatasetServer?: ApiDatasetServerType) => {
  const { apiServer, yuqueServer, feishuShareServer, feishuKnowledgeServer, feishuPrivateServer } =
    apiDatasetServer || {};

  if (apiServer) {
    return useApiDatasetRequest({ apiServer });
  }
  if (yuqueServer) {
    return useYuqueDatasetRequest({ yuqueServer });
  }
  if (feishuShareServer) {
    return useFeishuShareDatasetRequest({ feishuShareServer });
  }
  if (feishuKnowledgeServer) {
    return useFeishuKnowledgeDatasetRequest({ feishuKnowledgeServer });
  }
  if (feishuPrivateServer) {
    return useFeishuPrivateDatasetRequest({ feishuPrivateServer });
  }
  return Promise.reject('Can not find api dataset server');
};
