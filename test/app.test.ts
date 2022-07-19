import { StatusCodes } from 'http-status-codes';
import { v4 } from 'uuid';

import { ItemService, MemberTaskManager } from '@graasp/sdk';
import {
  ItemMembershipTaskManager,
  ItemTaskManager,
  Task as MockTask,
  TaskRunner,
} from 'graasp-test';

import build from './app';
import { MEMBERS, MEMBERSHIPS, MOCK_ITEM } from './constants';

const itemTaskManager = new ItemTaskManager();
const memberTaskManager = {} as unknown as MemberTaskManager;
const itemMembershipTaskManager = new ItemMembershipTaskManager();
const runner = new TaskRunner();
const itemService = {} as unknown as ItemService;

describe('Publish Plugin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Endpoints', () => {
    beforeEach(() => {
      jest.spyOn(runner, 'setTaskPreHookHandler').mockImplementation(async () => false);
      jest.spyOn(runner, 'setTaskPostHookHandler').mockImplementation(async () => false);
    });

    describe('GET /publish', () => {
      const item = MOCK_ITEM;
      const mockGetTask = jest.fn().mockReturnValue(new MockTask(item));
      itemTaskManager.createGetTask = mockGetTask;
      const mockGetMemberIMTask = jest.fn().mockReturnValue(new MockTask(item));
      itemMembershipTaskManager.createGetMemberItemMembershipTask = mockGetMemberIMTask;
      const mockGetItemMembershipTask = jest.fn().mockReturnValue([new MockTask(MEMBERSHIPS)]);
      itemMembershipTaskManager.createGetOfItemTaskSequence = mockGetItemMembershipTask;
      const mockGetManyTask = jest.fn().mockReturnValue(new MockTask([MEMBERS.ANNA, MEMBERS.BOB]));
      memberTaskManager.createGetManyTask = mockGetManyTask;
      jest.spyOn(runner, 'runSingleSequence').mockImplementation(async (task) => task[0].result);
      jest.spyOn(runner, 'runSingle').mockImplementation(async (task) => task.result);

      it('Successfully publish item with notification', async () => {
        const app = await build({
          itemTaskManager,
          itemService,
          memberTaskManager,
          itemMembershipTaskManager,
          runner,
        });

        const res = await app.inject({
          method: 'GET',
          url: `/${v4()}/publish?notification=true`,
        });

        expect(res.statusCode).toBe(StatusCodes.OK);
        expect(mockGetTask).toHaveBeenCalledTimes(1);
        expect(mockGetManyTask).toHaveBeenCalledTimes(1);
        expect(res.json()).toEqual(item);
      });

      it('Successfully publish item without notification', async () => {
        const app = await build({
          itemTaskManager,
          itemService,
          memberTaskManager,
          itemMembershipTaskManager,
          runner,
        });

        const res = await app.inject({
          method: 'GET',
          url: `/${v4()}/publish`,
        });

        expect(res.statusCode).toBe(StatusCodes.OK);
        expect(mockGetTask).toHaveBeenCalledTimes(1);
        // get member is not called
        expect(mockGetManyTask).toHaveBeenCalledTimes(0);
        expect(res.json()).toEqual(item);
      });

      it('Bad request if id is invalid', async () => {
        const app = await build({
          itemTaskManager,
          itemService,
          memberTaskManager,
          itemMembershipTaskManager,
          runner,
        });

        const res = await app.inject({
          method: 'GET',
          url: '/invalid-id/publish',
        });

        expect(res.statusCode).toBe(StatusCodes.BAD_REQUEST);
      });
    });
  });
});
