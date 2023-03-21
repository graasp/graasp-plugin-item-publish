import { FastifyLoggerInstance } from 'fastify';

import {
  Actor,
  Item,
  ItemMembershipTaskManager,
  ItemService,
  ItemTaskManager,
  Member,
  PermissionLevel,
  Task,
} from '@graasp/sdk';
import { ItemTagService, ItemTagTaskManager } from 'graasp-item-tags';
import { PublicItemService, PublicItemTaskManager } from 'graasp-plugin-public';

import { PublishedItemService } from './db-service';
import { PublishItemTask } from './tasks/publish-item-task';

export class TaskManager {
  private itemService: ItemService;
  private itemTaskManager: ItemTaskManager;
  private itemMembershipTaskManager: ItemMembershipTaskManager;
  private itemTagService: ItemTagService;
  private itemTagTaskManager: ItemTagTaskManager;
  private publishedItemService: PublishedItemService;
  private publicItemTaskManager: PublicItemTaskManager;
  private publicItemService: PublicItemService;
  private tagIds: {
    publicTagId: string;
    publishedTagId: string;
  };
  private log: FastifyLoggerInstance;

  constructor(
    publishedItemService: PublishedItemService,
    itemTaskManager: ItemTaskManager,
    itemService: ItemService,
    itemMembershipTaskManager: ItemMembershipTaskManager,
    itemTagTaskManager: ItemTagTaskManager,
    itemTagService: ItemTagService,
    publicItemTaskManager: PublicItemTaskManager,
    publicItemService: PublicItemService,
    tagIds: {
      publicTagId: string;
      publishedTagId: string;
    },
    log: FastifyLoggerInstance,
  ) {
    this.itemService = itemService;
    this.itemTaskManager = itemTaskManager;
    this.itemTagService = itemTagService;
    this.itemMembershipTaskManager = itemMembershipTaskManager;
    this.tagIds = tagIds;
    this.publishedItemService = publishedItemService;
    this.itemTagTaskManager = itemTagTaskManager;
    this.publicItemTaskManager = publicItemTaskManager;
    this.publicItemService = publicItemService;
    this.log = log;
  }

  getPublishItemTaskName = () => PublishItemTask.name;

  // todo: refactor this task depending on tag task sequence
  createPublishItemTaskSequence(member: Member, item: Item): Task<Actor, unknown>[] {
    // get item from id and validate membership
    const validatePermissionTask =
      this.itemMembershipTaskManager.createGetMemberItemMembershipTask(member);
    validatePermissionTask.getInput = () => ({
      item,
      validatePermission: PermissionLevel.Admin,
    });

    // publish item
    const publishTask = new PublishItemTask(
      member,
      this.publishedItemService,
      this.publicItemService,
      this.itemTagService,
      this.itemService,
      this.tagIds,
      { item },
      this.log,
    );

    return [validatePermissionTask, publishTask];
  }
}
