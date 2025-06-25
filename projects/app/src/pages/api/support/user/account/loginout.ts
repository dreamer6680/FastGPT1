import type { NextApiRequest, NextApiResponse } from 'next';
import { clearCookie } from '@fastgpt/service/support/permission/controller';
import { NextAPI } from '@/service/middleware/entry';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { addAuditLog } from '@fastgpt/service/support/audit/util';
import { AuditEventEnum } from '@fastgpt/global/support/audit/constants';
import { getUserDetail } from '@fastgpt/service/support/user/controller';
import { delUserAllSession } from '@fastgpt/service/support/user/session';

async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  const user = await authCert({ req, authToken: true });
  const userDetail = await getUserDetail({ userId: user.userId });
  await delUserAllSession(user.userId);
  addAuditLog({
    teamId: user.teamId,
    tmbId: user.tmbId,
    event: AuditEventEnum.LOGINOUT,
    params: {
      name: userDetail.username
    }
  });
  clearCookie(res);
}

export default NextAPI(handler);
