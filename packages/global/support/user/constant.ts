export enum UserStatusEnum {
  active = 'active',
  forbidden = 'forbidden',
  admin = 'admin'
}
export const userStatusMap = {
  [UserStatusEnum.active]: {
    label: 'support.user.status.active'
  },
  [UserStatusEnum.forbidden]: {
    label: 'support.user.status.forbidden'
  },
  [UserStatusEnum.admin]: {
    label: 'support.user.status.admin'
  }
};

export enum OAuthEnum {
  github = 'github',
  google = 'google',
  wechat = 'wechat',
  microsoft = 'microsoft',
  sso = 'sso'
}
