import { Actor } from 'graasp';
import { PermissionLevel } from '../src/constants';

export const GRAASP_ACTOR: Actor = {
  id: 'actorid',
};

export const ITEM_PUBLIC_TAG = {
  id: 'public-tag-id',
  name: 'public-item',
};

export const MEMBERS = {
  ANNA: {
    id: 'ecafbd2a-5642-31fb-ae93-0242ac130002',
    name: 'anna',
    email: 'anna@email.com',
    createdAt: '2021-04-13 14:56:34.749946',
    extra: {
      lang: 'fr',
    },
  },
  BOB: {
    id: 'ecafbd2a-5642-31fb-ae93-0242ac130004',
    name: 'bob',
    email: 'bob@email.com',
    createdAt: '2021-04-13 14:56:34.749946',
    extra: { lang: 'en' },
  },
};

export const MOCK_ITEM = {
  id: 'ecafbd2a-5688-11eb-ae93-0242ac130002',
  name: 'parent public item',
  path: 'ecafbd2a_5688_11eb_ae93_0242ac130002',
  extra: {
    image: 'someimageurl',
  },
  tags: [
    {
      id: 'ecbfbd2a-5688-11eb-ae93-0242ac130002',
      tagId: ITEM_PUBLIC_TAG.id,
      itemPath: 'ecafbd2a_5688_11eb_ae93_0242ac130002',
    },
  ],
  memberships: [
    {
      itemPath: 'fdf09f5a_5688_11eb_ae93_0242ac130002',
      permission: PermissionLevel.Admin,
      memberId: MEMBERS.ANNA.id,
    },
    {
      itemPath: 'fdf09f5a_5688_11eb_ae93_0242ac130002',
      permission: PermissionLevel.Write,
      memberId: MEMBERS.BOB.id,
    },
  ],
};
