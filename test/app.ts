import fastify from 'fastify';

import {
  Item,
  ItemMembershipTaskManager,
  ItemService,
  MemberTaskManager,
  TaskRunner,
} from '@graasp/sdk';
import 'graasp-mailer';
import { ItemTaskManager } from 'graasp-test';

import plugin, { GraaspPublishPluginOptions } from '../src/service-api';
import { GRAASP_ACTOR } from './constants';

const schemas = {
  $id: 'http://graasp.org/',
  definitions: {
    uuid: {
      type: 'string',
      pattern: '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$',
    },
    idParam: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { $ref: '#/definitions/uuid' },
      },
      additionalProperties: false,
    },
  },
};

// WARNING: use different task manager and db service for public decoration?
const build = async ({
  runner,
  itemTaskManager,
  itemService,
  memberTaskManager,
  itemMembershipTaskManager,
  options,
}: {
  runner: TaskRunner<Item>;
  itemTaskManager: ItemTaskManager;
  itemService: ItemService;
  itemMembershipTaskManager: ItemMembershipTaskManager;
  memberTaskManager: MemberTaskManager;
  options?: GraaspPublishPluginOptions;
}) => {
  const app = fastify();
  app.addSchema(schemas);
  app.decorateRequest('member', GRAASP_ACTOR);

  app.decorate('taskRunner', runner);
  app.decorate('items', {
    taskManager: itemTaskManager,
  });
  app.decorate('members', {
    taskManager: memberTaskManager,
  });
  app.decorate('public', {
    items: { taskManager: itemTaskManager, dbService: itemService },
  });
  app.decorate('itemMemberships', {
    taskManager: itemMembershipTaskManager,
  });
  app.decorate('mailer', { sendPublishNotificationEmail: async () => Error('mock error') });

  await app.register(plugin, options);

  return app;
};
export default build;
