import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary';

const createStorage = (folder: string) =>
  new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: folder,
      allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
      transformation: [{ width: 1280, height: 720, crop: 'limit' }],
    },
  });

const avatarUpload = multer({ storage: createStorage('moviezone_avatars') as multer.StorageEngine });
const movieUpload = multer({ storage: createStorage('moviezone_movies') as multer.StorageEngine });
const bannerUpload = multer({ storage: createStorage('moviezone_banners') as multer.StorageEngine });

export { avatarUpload, movieUpload, bannerUpload };
