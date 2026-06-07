declare module 'multer-storage-cloudinary' {
  import type { StorageEngine } from 'multer';
  import type { v2 as CloudinaryV2 } from 'cloudinary';

  export class CloudinaryStorage implements StorageEngine {
    constructor(options: {
      cloudinary: typeof CloudinaryV2;
      params: Record<string, unknown>;
    });
  }
}
