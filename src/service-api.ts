import { FastifyPluginAsync } from 'fastify';

import { Actor, IdParam } from 'graasp';
import { ItemTagService, ItemTagTaskManager } from 'graasp-item-tags';
import publicPlugin from 'graasp-plugin-public';

import { PublishedItemService } from './db-service';
import { publishItem } from './schemas';
import { TaskManager as PublishedItemTaskManager } from './task-manager';

export interface GraaspPublishPluginOptions {
  publishedTagId: string;
  publicTagId: string;
  graaspActor: Actor;
}

const plugin: FastifyPluginAsync<GraaspPublishPluginOptions> = async (fastify, options) => {
  if (!publicPlugin) {
    throw new Error('public plugin is not defined');
  }

  const {
    items: { dbService: iS, taskManager: iTM },
    itemMemberships: { dbService: iMS, taskManager: iMTM },
    taskRunner: runner,
    public: {
      items: { taskManager: publicITM, dbService: publicIS },
    },
  } = fastify;
  const { graaspActor, publicTagId, publishedTagId } = options;

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

  fastify.get<{ Params: IdParam }>(
    '/:id/publish',
    { schema: publishItem },
    async ({ member, params: { id: itemId }, log }) => {
      // todo: validate before publish ?

      const tasks = pITM.createPublishItemTaskSequence(member, itemId);

      const result = await runner.runSingleSequence(tasks, log);

      // todo: notify on publish

      // return published item
      // todo: return copied item?
      return result;
    },
  );
};

export default plugin;
