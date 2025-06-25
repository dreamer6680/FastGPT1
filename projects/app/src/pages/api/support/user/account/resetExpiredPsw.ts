import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { NextAPI } from '@/service/middleware/entry';
import { i18nT } from '@fastgpt/web/i18n/utils';
import { checkPswExpired } from '@/service/support/user/account/password';
import { hashStr } from '@fastgpt/global/common/string/tools';
import { addAuditLog } from '@fastgpt/service/support/audit/util';
import { AuditEventEnum } from '@fastgpt/global/support/audit/constants';
import crypto from 'crypto';

export type resetExpiredPswQuery = {};

export type resetExpiredPswBody = {
  newPsw: string;
  signature: string;
};

export type resetExpiredPswResponse = {};

async function resetExpiredPswHandler(
  req: ApiRequestProps<resetExpiredPswBody, resetExpiredPswQuery>,
  res: ApiResponseType<resetExpiredPswResponse>
): Promise<resetExpiredPswResponse> {
  const { newPsw, signature } = req.body;
  const { tmbId, teamId } = await authCert({ req, authToken: true });
  const tmb = await MongoTeamMember.findById(tmbId);
  if (!tmb) {
    return Promise.reject('can not find it');
  }
  const userId = tmb.userId;
  const user = await MongoUser.findById(userId, 'passwordUpdateTime username password').lean();

  if (!user) {
    return Promise.reject('The password has not expired');
  }
  const username = hashStr(user.username);

  if (!newPsw || !signature) {
    return Promise.reject('缺少字段');
  }
  const isValid = crypto
    .createHash('sha256')
    .update(newPsw + user.username)
    .digest('hex');
  if (isValid !== signature) {
    return Promise.reject('数据完整性校验失败');
  }

  // check if can reset password
  const canReset = checkPswExpired({ updateTime: user.passwordUpdateTime });

  if (user.password === hashStr(newPsw)) {
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

  (async () => {
    addAuditLog({
      tmbId,
      teamId,
      event: AuditEventEnum.CHANGE_PASSWORD,
      params: {}
    });
  })();

  return {};
}

export default NextAPI(resetExpiredPswHandler);
