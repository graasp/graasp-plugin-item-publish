import { ItemService, MemberTaskManager } from 'graasp';
import { ItemMembershipTaskManager, ItemTaskManager, TaskRunner } from 'graasp-test';

import build from './app';

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

    describe('POST /publish', () => {
      it('Successfully publish item', async () => {
        const app = await build({
          itemTaskManager,
          itemService,
          memberTaskManager,
          itemMembershipTaskManager,
          runner,
        });

        // todo
      });
    });
  });
});
