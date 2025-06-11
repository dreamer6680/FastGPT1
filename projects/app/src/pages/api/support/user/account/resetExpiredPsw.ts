import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { NextAPI } from '@/service/middleware/entry';
import { i18nT } from '@fastgpt/web/i18n/utils';
import { checkPswExpired } from '@/service/support/user/account/password';
import { hashStr } from '@fastgpt/global/common/string/tools';

export type resetExpiredPswQuery = {};

export type resetExpiredPswBody = {
  newPsw: string;
};

export type resetExpiredPswResponse = {};

async function resetExpiredPswHandler(
  req: ApiRequestProps<resetExpiredPswBody, resetExpiredPswQuery>,
  res: ApiResponseType<resetExpiredPswResponse>
): Promise<resetExpiredPswResponse> {
  const newPsw = req.body.newPsw;
  const { userId } = await authCert({ req, authToken: true });
  const user = await MongoUser.findById(userId, 'passwordUpdateTime username').lean();

  if (!user) {
    return Promise.reject('The password has not expired');
  }
  const username = hashStr(user.username);

  // check if can reset password
  const canReset = checkPswExpired({ updateTime: user.passwordUpdateTime });

  if (user.password === newPsw) {
    return Promise.reject(i18nT('common:user.Password has no change'));
  }

  if (username === newPsw) {
    return Promise.reject(i18nT('common:user.Password is the same as the username'));
  }

  if (!canReset) {
    return Promise.reject(i18nT('common:user.No_right_to_reset_password'));
  }

  // 更新对应的记录
  await MongoUser.updateOne(
    {
      _id: userId
    },
    {
      password: newPsw,
      passwordUpdateTime: new Date()
    }
  );

  return {};
}

export default NextAPI(resetExpiredPswHandler);
