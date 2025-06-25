import type { UserAuthTypeEnum } from '@fastgpt/global/support/user/auth/constants';
import { MongoUserAuth } from './schema';
import { i18nT } from '../../../../web/i18n/utils';
import { mongoSessionRun } from '../../../common/mongo/sessionRun';
import crypto from 'crypto';

export const addAuthCode = async ({
  key,
  code,
  openid,
  type,
  expiredTime
}: {
  key: string;
  code?: string;
  openid?: string;
  type: `${UserAuthTypeEnum}`;
  expiredTime?: Date;
}) => {
  return MongoUserAuth.updateOne(
    {
      key,
      type
    },
    {
      code,
      openid,
      expiredTime
    },
    {
      upsert: true
    }
  );
};

export const authCode = async ({
  key,
  type,
  code
}: {
  key: string;
  type: `${UserAuthTypeEnum}`;
  code: string;
}) => {
  return mongoSessionRun(async (session) => {
    const result = await MongoUserAuth.findOne(
      {
        key,
        type,
        code: { $regex: new RegExp(`^${code}$`, 'i') }
      },
      undefined,
      { session }
    );

    if (!result) {
      return Promise.reject(i18nT('common:error.code_error'));
    }

    await result.deleteOne({ session });

    return 'SUCCESS';
  });
};

export const authSignature = async ({
  key,
  type,
  signature,
  data
}: {
  key: string;
  type: `${UserAuthTypeEnum}`;
  signature: string;
  data: string;
}) => {
  return mongoSessionRun(async (session) => {
    const result = await MongoUserAuth.findOne(
      {
        key,
        type
      },
      undefined,
      { session }
    );
    console.log('result', result?.code);

    if (!result || !result.code) {
      return Promise.reject(i18nT('common:error.code_error'));
    }

    // 使用存储的公钥验证签名
    const publicKey = result.code;
    const isValid = crypto.verify(
      'sha256',
      Buffer.from(data),
      publicKey,
      Buffer.from(signature, 'base64')
    );

    if (!isValid) {
      return Promise.reject(i18nT('common:error.data_error'));
    }

    await result.deleteOne({ session });

    return 'SUCCESS';
  });
};
