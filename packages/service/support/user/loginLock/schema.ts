import { connectionMongo, getMongoModel } from '../../../common/mongo';
const { Schema } = connectionMongo;

export const userLoginLockCollectionName = 'user_login_locks';

const UserLoginLockSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  failedAttempts: {
    type: Number,
    default: 0
  },
  lastFailedTime: {
    type: Date,
    default: () => new Date()
  },
  lockExpireTime: {
    type: Date,
    default: null
  },
  createTime: {
    type: Date,
    default: () => new Date()
  }
});

try {
  // 创建索引
  UserLoginLockSchema.index({ username: 1 });
  UserLoginLockSchema.index({ lockExpireTime: 1 });
  UserLoginLockSchema.index({ createTime: -1 });
} catch (error) {
  console.log(error);
}

export type UserLoginLockModelSchema = {
  _id: string;
  username: string;
  failedAttempts: number;
  lastFailedTime: Date;
  lockExpireTime: Date | null;
  createTime: Date;
};

export const MongoUserLoginLock = getMongoModel<UserLoginLockModelSchema>(
  userLoginLockCollectionName,
  UserLoginLockSchema
);
