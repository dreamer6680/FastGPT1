import { MongoUser } from '@fastgpt/service/support/user/schema';
import { UserStatusEnum } from '@fastgpt/global/support/user/constant';

const THREE_MONTHS_AGO = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

export async function getUserList(): Promise<void> {
  // 查找需休眠的用户（未登录或三个月未登录，且当前不是禁用状态）
  const usersToSleep = await MongoUser.find({
    $or: [{ lastLoginTime: { $exists: false } }, { lastLoginTime: { $lt: THREE_MONTHS_AGO } }],
    status: { $ne: UserStatusEnum.forbidden }
  }).lean();

  if (usersToSleep.length === 0) return;

  console.log('usersToSleep', usersToSleep);

  // 构建批量更新操作
  const bulkOps = usersToSleep.map((user) => ({
    updateOne: {
      filter: { _id: user._id },
      update: { $set: { status: UserStatusEnum.forbidden } }
    }
  }));

  // 执行批量更新
  await MongoUser.bulkWrite(bulkOps);
}
