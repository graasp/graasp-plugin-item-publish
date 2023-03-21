import { FastifyLoggerInstance } from 'fastify';

import { Actor, DatabaseTransactionHandler, ItemService, Task, TaskStatus } from '@graasp/sdk';
import { ItemTagService } from 'graasp-item-tags';
import { PublicItemService } from 'graasp-plugin-public';

import { PublishedItemService } from '../db-service';

export abstract class BasePublishedItemTask<R> implements Task<Actor, R> {
  protected publicItemService: PublicItemService;
  protected publishedItemService: PublishedItemService;
  protected itemService: ItemService;
  protected tagIds: {
    publicTagId: string;
    publishedTagId: string;
  };

  protected _result: R;
  protected _message: string;

  readonly actor: Actor;

  status: TaskStatus;
  targetId: string;
  skip?: boolean;

  input: unknown;
  getInput: () => unknown;

  getResult: () => unknown;

  protected itemTagService: ItemTagService;
  constructor(
    actor: Actor,
    publishedItemService: PublishedItemService,
    publicItemService: PublicItemService,
    itemTagService: ItemTagService,
    itemService: ItemService,
    tagIds: { publicTagId: string; publishedTagId: string },
  ) {
    this.actor = actor;
    this.publishedItemService = publishedItemService;
    this.publicItemService = publicItemService;
    this.itemTagService = itemTagService;
    this.itemService = itemService;
    this.tagIds = tagIds;
    this.status = TaskStatus.NEW;
  }

  abstract get name(): string;
  get result(): R {
    return this._result;
  }
  get message(): string {
    return this._message;
  }

  abstract run(
    handler: DatabaseTransactionHandler,
    log: FastifyLoggerInstance,
  ): Promise<void | BasePublishedItemTask<R>[]>;
}
