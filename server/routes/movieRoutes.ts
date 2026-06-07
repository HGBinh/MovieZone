import express from 'express';
import {
  getTrendingMovies,
  getPopularMovies,
  getTopRatedMovies,
  getUpcomingMovies,
  searchMovies,
  getMovieDetails,
  getLocalMovies,
  getBanners,
  discoverMovies,
} from '../controllers/movieController';

const router = express.Router();

router.get('/trending', getTrendingMovies);
router.get('/popular', getPopularMovies);
router.get('/top-rated', getTopRatedMovies);
router.get('/upcoming', getUpcomingMovies);
router.get('/search', searchMovies);
router.get('/discover', discoverMovies);
router.get('/local', getLocalMovies);
router.get('/banners', getBanners);
router.get('/:id', getMovieDetails);

export default router;
