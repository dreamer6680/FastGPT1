import type { NextApiRequest, NextApiResponse } from 'next';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { setCookie } from '@fastgpt/service/support/permission/controller';
import { getUserDetail } from '@fastgpt/service/support/user/controller';
import type { PostLoginProps } from '@fastgpt/global/support/user/api.d';
import { UserStatusEnum } from '@fastgpt/global/support/user/constant';
import { NextAPI } from '@/service/middleware/entry';
import { useIPFrequencyLimit } from '@fastgpt/service/common/middle/reqFrequencyLimit';
import { pushTrack } from '@fastgpt/service/common/middle/tracks/utils';
import { CommonErrEnum } from '@fastgpt/global/common/error/code/common';
import { UserErrEnum } from '@fastgpt/global/common/error/code/user';
import { addAuditLog } from '@fastgpt/service/support/audit/util';
import { AuditEventEnum } from '@fastgpt/global/support/audit/constants';
import { UserAuthTypeEnum } from '@fastgpt/global/support/user/auth/constants';
import { authCode } from '@fastgpt/service/support/user/auth/controller';
import { createUserSession } from '@fastgpt/service/support/user/session';
import {
  checkUserLoginLock,
  recordLoginFailure,
  clearLoginFailures
} from '@fastgpt/service/support/user/loginLock/controller';
import requestIp from 'request-ip';
import crypto from 'crypto';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { username, password, code, signature } = req.body as PostLoginProps;

  if (!username || !password || !code || !signature) {
    return Promise.reject(CommonErrEnum.invalidParams);
  }

  // 检查用户是否被锁定
  const lockInfo = await checkUserLoginLock(username);
  if (lockInfo.isLocked) {
    return Promise.reject(`账号已被锁定，请${lockInfo.remainingLockTime}分钟后再试`);
  }

  // 验证密码签名
  await authCode({
    key: username,
    code,
    type: UserAuthTypeEnum.login
  });
  console.log('code', code);
  console.log(
    'signature',
    crypto
      .createHash('sha256')
      .update(code + password + username)
      .digest('hex')
  );
  console.log('password', password);
  console.log('username', username);
  console.log('signature', signature);

  const isValid = crypto
    .createHash('sha256')
    .update(code + password + username)
    .digest('hex');
  if (isValid !== signature) {
    return Promise.reject(UserErrEnum.signature_error);
  }

  // 检测用户是否存在
  const authCert = await MongoUser.findOne(
    {
      username
    },
    'status'
  );
  if (!authCert) {
    // 记录登录失败
    await recordLoginFailure(username);
    return Promise.reject(UserErrEnum.account_psw_error);
  }

  if (authCert.status === UserStatusEnum.forbidden) {
    // 记录登录失败
    await recordLoginFailure(username);
    return Promise.reject('Invalid account!');
  }

  const user = await MongoUser.findOne({
    username,
    password
  });

  if (!user) {
    // 记录登录失败
    const failureInfo = await recordLoginFailure(username);

    if (failureInfo.isLocked) {
      return Promise.reject(`密码错误，账号已被锁定，请${failureInfo.remainingLockTime}分钟后再试`);
    } else {
      return Promise.reject(`密码错误，还剩${failureInfo.remainingAttempts}次尝试机会`);
    }
  }

  // 登录成功，清除失败记录
  await clearLoginFailures(username);

  const userDetail = await getUserDetail({
    tmbId: user?.lastLoginTmbId,
    userId: user._id
  });

  await MongoUser.findByIdAndUpdate(user._id, {
    lastLoginTmbId: userDetail.team.tmbId,
    lastLoginTime: new Date()
  });

  const token = await createUserSession({
    userId: user._id,
    teamId: userDetail.team.teamId,
    tmbId: userDetail.team.tmbId,
    isRoot: username === 'root',
    ip: requestIp.getClientIp(req)
  });

  setCookie(res, token);

  pushTrack.login({
    type: 'password',
    uid: user._id,
    teamId: userDetail.team.teamId,
    tmbId: userDetail.team.tmbId
  });
  addAuditLog({
    tmbId: userDetail.team.tmbId,
    teamId: userDetail.team.teamId,
    event: AuditEventEnum.LOGIN
  });

  return {
    user: userDetail,
    token
  };
}

const lockTime = Number(process.env.PASSWORD_LOGIN_LOCK_SECONDS || 120);
export default NextAPI(
  useIPFrequencyLimit({ id: 'login-by-password', seconds: lockTime, limit: 10, force: true }),
  handler
);
