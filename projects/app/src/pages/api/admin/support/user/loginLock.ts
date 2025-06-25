import type { NextApiRequest, NextApiResponse } from 'next';
import { jsonRes } from '@fastgpt/service/common/response';
import { MongoUserLoginLock } from '@fastgpt/service/support/user/loginLock/schema';
import { NextAPI } from '@/service/middleware/entry';
import type { ApiRequestProps } from '@fastgpt/service/type/next';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { MongoUser } from '@fastgpt/service/support/user/schema';

export type LoginLockQuery = {
  action: 'list' | 'unlock' | 'clear';
  username?: string;
  page?: number;
  pageSize?: number;
};

export type LoginLockResponse = {
  list?: Array<{
    username: string;
    failedAttempts: number;
    lastFailedTime: Date;
    lockExpireTime: Date | null;
    isLocked: boolean;
    remainingLockTime?: number;
  }>;
  total?: number;
  message?: string;
};

async function handler(
  req: ApiRequestProps<{}, LoginLockQuery>,
  res: NextApiResponse<LoginLockResponse>
) {
  const { action, username, page = 1, pageSize = 20 } = req.query;

  try {
    // 验证管理员权限
    const result = await authCert({ req, authToken: true });
    const user = await MongoUser.findOne({
      _id: result.userId
    });

    if (!user || user.role !== 'admin') {
      throw new Error('无权限访问');
    }

    switch (action) {
      case 'list': {
        const skip = (page - 1) * pageSize;
        const [list, total] = await Promise.all([
          MongoUserLoginLock.find({}).sort({ createTime: -1 }).skip(skip).limit(pageSize).lean(),
          MongoUserLoginLock.countDocuments({})
        ]);

        const now = new Date();
        const formattedList = list.map((item) => {
          const isLocked = item.lockExpireTime && item.lockExpireTime > now;
          const remainingLockTime =
            isLocked && item.lockExpireTime
              ? Math.ceil((item.lockExpireTime.getTime() - now.getTime()) / (1000 * 60))
              : undefined;

          return {
            username: item.username,
            failedAttempts: item.failedAttempts,
            lastFailedTime: item.lastFailedTime,
            lockExpireTime: item.lockExpireTime,
            isLocked,
            remainingLockTime
          };
        });

        return jsonRes(res, {
          data: {
            list: formattedList,
            total
          }
        });
      }

      case 'unlock': {
        if (!username) {
          throw new Error('username is required');
        }

        await MongoUserLoginLock.deleteOne({ username });

        return jsonRes(res, {
          data: {
            message: `用户 ${username} 已解锁`
          }
        });
      }

      case 'clear': {
        await MongoUserLoginLock.deleteMany({});

        return jsonRes(res, {
          data: {
            message: '所有登录锁定记录已清除'
          }
        });
      }

      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    return jsonRes(res, {
      code: 500,
      error
    });
  }
}

export default NextAPI(handler);
