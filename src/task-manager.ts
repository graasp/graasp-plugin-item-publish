import {
  Actor,
  Item,
  ItemMembershipTaskManager,
  ItemService,
  ItemTaskManager,
  Member,
  Task,
} from 'graasp';
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
  }

  // todo: refactor this task depending on tag task sequence
  createPublishItemTaskSequence(member: Member, itemId: string): Task<Actor, any>[] {
    // get item from id and validate membership
    const getItemTask = this.itemTaskManager.createGetTask(member, itemId);
    const validatePermissionTask =
      this.itemMembershipTaskManager.createGetMemberItemMembershipTask(member);
    validatePermissionTask.getInput = () => ({
      item: getItemTask.getResult(),
      validatePermission: 'admin',
    });

    // publish item 
    const publishTask = new PublishItemTask(
      member,
      this.publishedItemService,
      this.publicItemService,
      this.itemTagService,
      this.itemService,
      this.tagIds,
    );
    publishTask.getInput = () => ({ item: getItemTask.getResult() as Item });

    return [getItemTask, validatePermissionTask, publishTask];
  }
}
