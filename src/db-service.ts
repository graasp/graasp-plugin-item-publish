export class PublishedItemService {
  private publicTadId;
  private publishedTagId;

  constructor({ publicTagId, publishedTagId }: { publicTagId: string; publishedTagId: string }) {
    this.publicTadId = publicTagId;
    this.publishedTagId = publishedTagId;
  }
}
