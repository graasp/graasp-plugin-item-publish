import { FastifyPluginAsync } from 'fastify';

import { Actor, IdParam, ItemMembership } from 'graasp';
import { ItemTagService, ItemTagTaskManager } from 'graasp-item-tags';
import publicPlugin from 'graasp-plugin-public';
import mailerPlugin from 'graasp-mailer';

import { PublishedItemService } from './db-service';
import { publishItem } from './schemas';
import { TaskManager as PublishedItemTaskManager } from './task-manager';
import { buildItemLink } from './utils';

export interface GraaspPublishPluginOptions {
  publishedTagId: string;
  publicTagId: string;
  graaspActor: Actor;
}

const plugin: FastifyPluginAsync<GraaspPublishPluginOptions> = async (fastify, options) => {
  const {
    items: { dbService: iS, taskManager: iTM },
    itemMemberships: { dbService: iMS, taskManager: iMTM },
    members: { taskManager: mTM },
    taskRunner: runner,
    public: {
      items: { taskManager: publicITM, dbService: publicIS },
    },
    mailer,
  } = fastify;
  const { publicTagId, publishedTagId } = options;
  
  if (!publicPlugin) {
    throw new Error('public plugin is not defined');
  }

  if (!mailerPlugin) {
    throw new Error('Mailer plugin is not defined');
  }

  const itemTagService = new ItemTagService();
  const itemTagTaskManager = new ItemTagTaskManager(iS, iMS, itemTagService, iTM);
  const pIS = new PublishedItemService({ publicTagId, publishedTagId });
  const pITM = new PublishedItemTaskManager(
    pIS,
    iTM,
    iS,
    iMTM,
    itemTagTaskManager,
    itemTagService,
    publicITM,
    publicIS,
    {
      publicTagId,
      publishedTagId,
    },
  );

  const sendNotificationEmail = ({ item, member, log }) => {
    const lang = member?.extra?.lang as string;
    const itemLink = buildItemLink(item);

    mailer
      .sendPublishNotificationEmail(member, itemLink, item.name, lang)
      .catch((err) => {
        log.warn(err, `mailer failed. item published: ${item.name}, ${item.id}`);
      });
  };

  fastify.get<{ Params: IdParam, Querystring: { notification: boolean } }>(
    '/:id/publish',
    { schema: publishItem },
    async ({ member, params: { id }, query: { notification }, log }) => {
      // todo: validate before publish ?
      console.log('TASK START', id);
      const tasks = pITM.createPublishItemTaskSequence(member, id);

      const result = await runner.runSingleSequence(tasks, log);
      console.log(result);

      console.log(notification);
      // notify co-editors about publish of the item, only trigger when notification is TRUE
      if (notification) {
        const item = await runner.runSingle(iTM.createGetTask(member, id));
        console.log(item);
        const itemMemberships = await runner.runSingleSequence(iMTM.createGetOfItemTaskSequence(member, id)) as ItemMembership[];
        const coEditorIds = itemMemberships.filter(membership => membership.permission === 'write' || membership.permission == 'admin')?.map(membership => membership.memberId);
        console.log(coEditorIds);
        coEditorIds.forEach(async coEditorId => {
          const coEditor = await runner.runSingle(mTM.createGetTask(member, coEditorId));
          sendNotificationEmail({item, member: coEditor, log});
        });
      }

      // return published item
      // todo: return copied item?
      return result;
    },
  );
};

export default plugin;
