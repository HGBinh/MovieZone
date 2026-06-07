import { Request, Response } from 'express';
import axios from 'axios';
import Movie from '../models/Movie';
import Banner from '../models/Banner';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

const getTrendingMovies = async (req: Request, res: Response): Promise<void> => {
  let { language = 'en-US', page = 1, type = 'movie' } = req.query;
  if (parseInt(String(page)) > 500) page = 500;

  try {
    const response = await axios.get(
      `${TMDB_BASE_URL}/trending/${type}/day?api_key=${process.env.TMDB_API_KEY}&language=${language}&page=${page}`
    );
    res.json(response.data);
  } catch {
    res.status(500).json({ message: 'Error fetching trending movies' });
  }
};

const getPopularMovies = async (req: Request, res: Response): Promise<void> => {
  let { language = 'en-US', page = 1, type = 'movie' } = req.query;
  if (parseInt(String(page)) > 500) page = 500;

  try {
    const endpoint = type === 'tv' ? 'tv/popular' : 'movie/popular';
    const response = await axios.get(
      `${TMDB_BASE_URL}/${endpoint}?api_key=${process.env.TMDB_API_KEY}&language=${language}&page=${page}`
    );
    res.json(response.data);
  } catch {
    res.status(500).json({ message: 'Error fetching popular movies' });
  }
};

const getTopRatedMovies = async (req: Request, res: Response): Promise<void> => {
  let { language = 'en-US', page = 1, type = 'movie' } = req.query;
  if (parseInt(String(page)) > 500) page = 500;

  try {
    const endpoint = type === 'tv' ? 'tv/top_rated' : 'movie/top_rated';
    const response = await axios.get(
      `${TMDB_BASE_URL}/${endpoint}?api_key=${process.env.TMDB_API_KEY}&language=${language}&page=${page}`
    );
    res.json(response.data);
  } catch {
    res.status(500).json({ message: 'Error fetching top rated movies' });
  }
};

const getUpcomingMovies = async (req: Request, res: Response): Promise<void> => {
  let { language = 'en-US', page = 1 } = req.query;
  if (parseInt(String(page)) > 500) page = 500;

  try {
    const response = await axios.get(
      `${TMDB_BASE_URL}/movie/upcoming?api_key=${process.env.TMDB_API_KEY}&language=${language}&page=${page}`
    );
    res.json(response.data);
  } catch {
    res.status(500).json({ message: 'Error fetching upcoming movies' });
  }
};

const discoverMovies = async (req: Request, res: Response): Promise<void> => {
  let { language = 'en-US', page = 1, type = 'movie', genre, year } = req.query;
  if (parseInt(String(page)) > 500) page = 500;

  try {
    let url = `${TMDB_BASE_URL}/discover/${type}?api_key=${process.env.TMDB_API_KEY}&language=${language}&page=${page}&sort_by=popularity.desc`;

    if (genre) url += `&with_genres=${genre}`;
    if (year) {
      const yearParam = type === 'tv' ? 'first_air_date_year' : 'primary_release_year';
      url += `&${yearParam}=${year}`;
    }

    const response = await axios.get(url);
    res.json(response.data);
  } catch {
    res.status(500).json({ message: 'Error discovering movies' });
  }
};

const searchMovies = async (req: Request, res: Response): Promise<void> => {
  let { query, page = 1, language = 'en-US', type = 'movie' } = req.query;
  if (parseInt(String(page)) > 500) page = 500;

  try {
    const endpoint = type === 'tv' ? 'search/tv' : 'search/movie';
    const response = await axios.get(
      `${TMDB_BASE_URL}/${endpoint}?api_key=${process.env.TMDB_API_KEY}&query=${query}&page=${page}&language=${language}`
    );
    res.json(response.data);
  } catch {
    res.status(500).json({ message: 'Error searching movies' });
  }
};

const getMovieDetails = async (req: Request, res: Response): Promise<void> => {
  const id = String(req.params.id);
  const { language = 'en-US', type = 'movie' } = req.query;

  try {
    if (id.startsWith('banner_')) {
      const bannerId = id.replace('banner_', '');
      const banner = await Banner.findOne({ _id: bannerId, isActive: true }).populate(
        'movie',
        'title description posterPath backdropPath trailerUrl releaseDate runtime country genres voteAverage views'
      );

      if (!banner) {
        res.status(404).json({ message: 'Banner not found' });
        return;
      }

      const linked =
        banner.movie && typeof banner.movie === 'object' && (banner.movie as { _id?: unknown })._id;

      if (linked) {
        const m = banner.movie as unknown as {
          _id: string;
          title: string;
          description?: string;
          posterPath?: string;
          backdropPath?: string;
          trailerUrl?: string;
          releaseDate?: string;
          runtime?: string;
          country?: string;
          genres?: string[];
          voteAverage?: number;
          views?: number;
          toObject: () => Record<string, unknown>;
        };
        res.json({
          ...m.toObject(),
          id: m._id,
          poster_path: m.posterPath,
          backdrop_path: m.backdropPath || m.posterPath,
          release_date: m.releaseDate,
          vote_average: m.voteAverage || 0,
          genres: (m.genres || []).map((g: string) => ({ name: g })),
          isLocal: true,
          isBanner: true,
          overview: m.description,
          runtime: m.runtime || 120,
          production_countries: [{ name: m.country || 'N/A' }],
          tagline: 'MovieZone Exclusive',
        });
        return;
      }

      res.json({
        id: `banner_${banner._id}`,
        title: banner.title,
        overview: banner.description || '',
        poster_path: banner.image,
        backdrop_path: banner.image,
        release_date: '',
        vote_average: 0,
        runtime: null,
        genres: [],
        isLocal: true,
        isBanner: true,
        isBannerUnlinked: true,
        production_countries: [{ name: 'N/A' }],
        tagline: 'MovieZone Exclusive',
        views: 0,
      });
      return;
    }

    if (id.startsWith('local_')) {
      const localId = id.replace('local_', '');
      const movie = await Movie.findById(localId);
      if (movie) {
        res.json({
          ...movie.toObject(),
          id: movie._id,
          poster_path: movie.posterPath,
          backdrop_path: movie.posterPath,
          release_date: movie.releaseDate,
          vote_average: movie.voteAverage || 0,
          genres: (movie.genres || []).map((g: string) => ({ name: g })),
          isLocal: true,
          overview: movie.description,
          runtime: movie.runtime || 120,
          production_countries: [{ name: movie.country || 'N/A' }],
          tagline: 'MovieZone Exclusive',
        });
        return;
      } else {
        res.status(404).json({ message: 'Local movie not found' });
        return;
      }
    }

    const endpoint = type === 'tv' ? 'tv' : 'movie';
    const movieResponse = await axios.get(
      `${TMDB_BASE_URL}/${endpoint}/${id}?api_key=${process.env.TMDB_API_KEY}&language=${language}&append_to_response=videos,credits,similar,recommendations&include_video_language=en,${String(language).split('-')[0]}`
    );
    res.json(movieResponse.data);
  } catch {
    res.status(500).json({ message: 'Error fetching movie details' });
  }
};

const getLocalMovies = async (req: Request, res: Response): Promise<void> => {
  try {
    const movies = await Movie.find({ tmdbId: { $exists: false } }).sort({ createdAt: -1 });
    res.json(movies);
  } catch {
    res.status(500).json({ message: 'Error fetching local movies' });
  }
};

const getBanners = async (req: Request, res: Response): Promise<void> => {
  try {
    const banners = await Banner.find({ isActive: true })
      .populate('movie', 'title posterPath description voteAverage releaseDate')
      .sort({ order: 1 });
    res.json(banners);
  } catch {
    res.status(500).json({ message: 'Error fetching banners' });
  }
};

export {
  getTrendingMovies,
  getPopularMovies,
  getTopRatedMovies,
  getUpcomingMovies,
  searchMovies,
  getMovieDetails,
  getLocalMovies,
  getBanners,
  discoverMovies,
};
