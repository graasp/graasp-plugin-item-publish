import { FastifyPluginAsync } from 'fastify';

import { Actor, IdParam, ItemMembership, PermissionLevel } from '@graasp/sdk';
import { ItemTagService, ItemTagTaskManager } from 'graasp-item-tags';
import mailerPlugin from 'graasp-mailer';
import { PublicItemService, PublicItemTaskManager } from 'graasp-plugin-public';

import { PublishedItemService } from './db-service';
import schemas, { publishItem } from './schemas';
import { TaskManager as PublishedItemTaskManager } from './task-manager';
import { buildItemLink } from './utils';

export interface GraaspPublishPluginOptions {
  publishedTagId: string;
  publicTagId: string;
  graaspActor: Actor;
  hostname: string;
}

const plugin: FastifyPluginAsync<GraaspPublishPluginOptions> = async (fastify, options) => {
  if (!mailerPlugin) {
    throw new Error('Mailer plugin is not defined');
  }

  const {
    items: { dbService: iS, taskManager: iTM },
    itemMemberships: { dbService: iMS, taskManager: iMTM },
    members: { taskManager: mTM },
    taskRunner: runner,
    // cannot use public decoration because it is not defined in private endpoints
    mailer,
    log,
  } = fastify;
  const { publicTagId, publishedTagId, hostname } = options;

  const itemTagService = new ItemTagService();
  const publicIS = new PublicItemService(publicTagId);
  const publicITM = new PublicItemTaskManager(publicIS, iS, itemTagService, publicTagId);

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
    log,
  );

  fastify.decorate('publish', {
    taskManager: pITM,
  });

  const sendNotificationEmail = ({ item, member, log }) => {
    const lang = member?.extra?.lang as string;
    const itemLink = buildItemLink(item, hostname);

    mailer.sendPublishNotificationEmail(member, itemLink, item.name, lang).catch((err) => {
      log.warn(err, `mailer failed. item published: ${item.name}, ${item.id}`);
    });
  };

  fastify.addSchema(schemas);

  fastify.get<{ Params: IdParam; Querystring: { notification: boolean } }>(
    '/:id/publish',
    { schema: publishItem },
    async ({ member, params: { id }, query: { notification }, log }) => {
      // todo: validate before publish ?

      const item = await runner.runSingle(iTM.createGetTask(member, id));

      // validate permission and add publish item-tag
      const tasks = pITM.createPublishItemTaskSequence(member, item);
      const publishedItem = await runner.runSingleSequence(tasks, log);

      // notify co-editors about publish of the item, only trigger when notification is TRUE
      if (notification) {
        // get item memberships
        const itemMemberships = (await runner.runSingleSequence(
          iMTM.createGetOfItemTaskSequence(member, id),
        )) as ItemMembership[];
        // get co-editors
        const coEditorIds = itemMemberships
          .filter(
            (membership) =>
              membership.permission === PermissionLevel.Admin ||
              membership.permission == PermissionLevel.Write,
          )
          .map((membership) => membership.memberId);
        // send email notification to all co-editors
        const coEditors = await runner.runSingle(mTM.createGetManyTask(member, coEditorIds));
        coEditors.forEach(async (coEditor) => {
          sendNotificationEmail({ item, member: coEditor, log });
        });
      }

      // return published item
      // todo: return copied item?
      return publishedItem;
    },
  );
};

export default plugin;
