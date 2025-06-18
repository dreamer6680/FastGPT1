import { MongoUser } from '@fastgpt/service/support/user/schema';
import { hashStr } from '@fastgpt/global/common/string/tools';
import { createDefaultTeam, addTeamMember } from '@fastgpt/service/support/user/team/controller';
import { exit } from 'process';
import { mongoSessionRun } from '@fastgpt/service/common/mongo/sessionRun';

export async function initRootUser(retry = 3): Promise<any> {
  try {
    const systemUser = await MongoUser.findOne({
      username: 'system'
    });
    const teamUser = await MongoUser.findOne({
      username: 'team'
    });
    const logUser = await MongoUser.findOne({
      username: 'log'
    });
    const psw = process.env.DEFAULT_ROOT_PSW || '123456';

    let systemId = systemUser?._id || '';
    let teamId = teamUser?._id || '';
    let logId = logUser?._id || '';
    await mongoSessionRun(async (session) => {
      // init root user
      if (!systemId && !teamId && !logId) {
        const [{ _id: sId }] = await MongoUser.create(
          [
            {
              username: 'system',
              password: hashStr(psw),
              role: 'admin'
            }
          ],
          { session, ordered: true }
        );
        systemId = sId;
        const [{ _id: tId }] = await MongoUser.create(
          [
            {
              username: 'team',
              password: hashStr(psw),
              role: 'admin'
            }
          ],
          { session, ordered: true }
        );
        teamId = tId;
        const [{ _id: lId }] = await MongoUser.create(
          [
            {
              username: 'log',
              password: hashStr(psw),
              role: 'admin'
            }
          ],
          { session, ordered: true }
        );
        logId = lId;
      }
      // init root team
      const teamb = await createDefaultTeam({ userId: systemId, session });
      await addTeamMember({
        userId: systemId,
        teamId: teamb?.teamId,
        memberName: 'system',
        session
      });
      await addTeamMember({ userId: logId, teamId: teamb?.teamId, memberName: 'log', session });
      await addTeamMember({ userId: teamId, teamId: teamb?.teamId, memberName: 'team', session });
    });

    console.log(`root user init:`, {
      username: 'system,team,log',
      password: psw
    });
  } catch (error) {
    if (retry > 0) {
      console.log('retry init root user');
      return initRootUser(retry - 1);
    } else {
      console.error('init root user error', error);
      exit(1);
    }
  }
}
