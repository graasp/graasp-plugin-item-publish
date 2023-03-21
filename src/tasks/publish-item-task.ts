import { FastifyLoggerInstance } from 'fastify';

import {
  Actor,
  DatabaseTransactionHandler,
  Item,
  ItemService,
  PostHookHandlerType,
  PreHookHandlerType,
  TaskStatus,
} from '@graasp/sdk';
import { ItemTag, ItemTagService } from 'graasp-item-tags';
import { ItemNotPublic, PublicItemService } from 'graasp-plugin-public';

import { PublishedItemService } from '../db-service';
import { BasePublishedItemTask } from './base-published-item-task';

export type PublishItemTaskInputType = {
  item: Item;
};
export class PublishItemTask extends BasePublishedItemTask<ItemTag | ItemNotPublic> {
  input: PublishItemTaskInputType;
  getInput: () => PublishItemTaskInputType;
  log?: FastifyLoggerInstance;

  preHookHandler: PreHookHandlerType<Item>;
  postHookHandler: PostHookHandlerType<Item>;

  get name(): string {
    return PublishItemTask.name;
  }

  constructor(
    actor: Actor,
    publishedItemService: PublishedItemService,
    publicItemService: PublicItemService,
    itemTagService: ItemTagService,
    itemService: ItemService,
    tagIds: {
      publicTagId: string;
      publishedTagId: string;
    },
    input?: PublishItemTaskInputType,
    log?: FastifyLoggerInstance,
  ) {
    super(actor, publishedItemService, publicItemService, itemTagService, itemService, tagIds);
    this.input = input;
    this.log = log;
  }

  async run(handler: DatabaseTransactionHandler): Promise<void> {
    this.status = TaskStatus.RUNNING;

    const { item } = this.input;
    this.targetId = item?.id;

    // always check item is public
    const isPublic = await this.publicItemService.isPublic(item, handler);
    if (!isPublic) {
      throw new ItemNotPublic(item.id);
    }

    await this.preHookHandler?.(item, this.actor, { log: this.log, handler });
    const itemTag = await this.itemTagService.create(
      { itemPath: item.path, creator: this.actor.id, tagId: this.tagIds.publishedTagId },
      handler,
    );
    await this.postHookHandler?.(item, this.actor, { log: this.log, handler });

    this._result = itemTag;
    this.status = TaskStatus.OK;
  }
}
