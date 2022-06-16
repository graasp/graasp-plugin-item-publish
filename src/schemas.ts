export default {
  $id: 'http://graasp.org/published-items/',
  definitions: {
    uuid: {
      type: 'string',
      pattern: '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$',
    },
    idsQuery: {
      type: 'object',
      required: ['id'],
      properties: {
        id: {
          type: 'array',
          items: { $ref: 'http://graasp.org/#/definitions/uuid' },
          uniqueItems: true,
        },
      },
      additionalProperties: false,
    },
    // permission values
    permission: {
      type: 'string',
      enum: ['read', 'write', 'admin'],
    },

    itemMembership: {
      type: 'object',
      properties: {
        id: { $ref: 'http://graasp.org/#/definitions/uuid' },
        memberId: { $ref: 'http://graasp.org/#/definitions/uuid' },
        /**
         * itemPath's 'pattern' not supported in serialization.
         * since 'itemMembership' schema is only used for serialization it's safe
         * to just use `{ type: 'string' }`
         */
        // itemPath: { $ref: 'http://graasp.org/#/definitions/itemPath' },
        itemPath: { type: 'string' },
        // TODO: bug! should allow relative $ref: #/definitions/permission
        // check: https://github.com/fastify/fastify/issues/2328
        permission: { type: 'string' },
        creator: { $ref: 'http://graasp.org/#/definitions/uuid' },
        createdAt: { type: 'string' },
        updatedAt: { type: 'string' },
      },
    },
    // item properties to be returned to the client
    item: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        description: { type: ['string', 'null'] },
        type: { type: 'string' },
        path: { type: 'string' },
        extra: {
          type: 'object',
          additionalProperties: true,
        },
        creator: { type: 'string' },
        createdAt: {},
        updatedAt: {},
        settings: {},
      },
      additionalProperties: false,
    },
    error: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        code: { type: 'string' },
        message: { type: 'string' },
        statusCode: { type: 'number' },
        data: {},
        origin: { type: 'string' },
      },
      additionalProperties: false,
    },
  },
};

export const publishItem = {
  params: { $ref: 'http://graasp.org/#/definitions/idParam' },
  // response: {
  //   200: { $ref: 'http://graasp.org/published-items/#/definitions/item' },
  // },
};
