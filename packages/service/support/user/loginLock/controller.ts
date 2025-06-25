import { MongoUserLoginLock } from './schema';
import { addMinutes, isAfter } from 'date-fns';

export interface LoginLockInfo {
  isLocked: boolean;
  remainingAttempts: number;
  lockExpireTime?: Date;
  remainingLockTime?: number; // 剩余锁定时间（分钟）
}

/**
 * 检查用户是否被锁定
 */
export const checkUserLoginLock = async (username: string): Promise<LoginLockInfo> => {
  const lockRecord = await MongoUserLoginLock.findOne({ username });

  if (!lockRecord) {
    return {
      isLocked: false,
      remainingAttempts: 10
    };
  }

  // 检查是否在锁定时间内
  if (lockRecord.lockExpireTime && isAfter(lockRecord.lockExpireTime, new Date())) {
    const remainingMinutes = Math.ceil(
      (lockRecord.lockExpireTime.getTime() - new Date().getTime()) / (1000 * 60)
    );
    return {
      isLocked: true,
      remainingAttempts: 0,
      lockExpireTime: lockRecord.lockExpireTime,
      remainingLockTime: remainingMinutes
    };
  }

  // 锁定时间已过，重置失败次数
  if (lockRecord.lockExpireTime && !isAfter(lockRecord.lockExpireTime, new Date())) {
    await MongoUserLoginLock.deleteOne({ username });
    return {
      isLocked: false,
      remainingAttempts: 10
    };
  }

  return {
    isLocked: false,
    remainingAttempts: 10 - lockRecord.failedAttempts
  };
};

/**
 * 记录登录失败
 */
export const recordLoginFailure = async (username: string): Promise<LoginLockInfo> => {
  const lockRecord = await MongoUserLoginLock.findOne({ username });
  const now = new Date();

  if (!lockRecord) {
    // 第一次失败
    await MongoUserLoginLock.create({
      username,
      failedAttempts: 1,
      lastFailedTime: now
    });

    return {
      isLocked: false,
      remainingAttempts: 9
    };
  }

  // 检查是否在锁定时间内
  if (lockRecord.lockExpireTime && isAfter(lockRecord.lockExpireTime, now)) {
    const remainingMinutes = Math.ceil(
      (lockRecord.lockExpireTime.getTime() - now.getTime()) / (1000 * 60)
    );
    return {
      isLocked: true,
      remainingAttempts: 0,
      lockExpireTime: lockRecord.lockExpireTime,
      remainingLockTime: remainingMinutes
    };
  }

  // 锁定时间已过，重置失败次数
  if (lockRecord.lockExpireTime && !isAfter(lockRecord.lockExpireTime, now)) {
    await MongoUserLoginLock.updateOne(
      { username },
      {
        failedAttempts: 1,
        lastFailedTime: now,
        lockExpireTime: null
      }
    );

    return {
      isLocked: false,
      remainingAttempts: 9
    };
  }

  const newFailedAttempts = lockRecord.failedAttempts + 1;

  if (newFailedAttempts >= 10) {
    // 达到10次失败，锁定30分钟
    const lockExpireTime = addMinutes(now, 30);

    await MongoUserLoginLock.updateOne(
      { username },
      {
        failedAttempts: newFailedAttempts,
        lastFailedTime: now,
        lockExpireTime
      }
    );

    return {
      isLocked: true,
      remainingAttempts: 0,
      lockExpireTime,
      remainingLockTime: 30
    };
  } else {
    // 未达到锁定条件
    await MongoUserLoginLock.updateOne(
      { username },
      {
        failedAttempts: newFailedAttempts,
        lastFailedTime: now
      }
    );

    return {
      isLocked: false,
      remainingAttempts: 10 - newFailedAttempts
    };
  }
};

/**
 * 清除登录失败记录（登录成功时调用）
 */
export const clearLoginFailures = async (username: string): Promise<void> => {
  await MongoUserLoginLock.deleteOne({ username });
};
