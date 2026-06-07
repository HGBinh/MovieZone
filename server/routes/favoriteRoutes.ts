import express from 'express';
import {
  getFavorites,
  addFavorite,
  removeFavorite,
} from '../controllers/favoriteController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.use(protect);

router.get('/', getFavorites);
router.post('/add', addFavorite);
router.delete('/:movieId', removeFavorite);

export default router;
