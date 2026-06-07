import { Request, Response } from 'express';
import Favorite from '../models/Favorite';
import User from '../models/User';

const getFavorites = async (req: Request, res: Response): Promise<void> => {
  try {
    const favorites = await Favorite.find({ user: req.user!._id }).sort({ createdAt: -1 });
    res.json(favorites);
  } catch {
    res.status(500).json({ message: 'Error fetching favorites' });
  }
};

const addFavorite = async (req: Request, res: Response): Promise<void> => {
  const { movieId, movieTitle, posterPath, releaseDate, voteAverage } = req.body;

  try {
    const favoriteExists = await Favorite.findOne({
      user: req.user!._id,
      movieId,
    });

    if (favoriteExists) {
      res.status(400).json({ message: 'Movie already in favorites' });
      return;
    }

    const favorite = await Favorite.create({
      user: req.user!._id,
      movieId,
      movieTitle,
      posterPath,
      releaseDate,
      voteAverage,
    });

    await User.findByIdAndUpdate(req.user!._id, {
      $addToSet: { favorites: movieId.toString() },
    });

    res.status(201).json(favorite);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error adding favorite' });
  }
};

const removeFavorite = async (req: Request, res: Response): Promise<void> => {
  try {
    const favorite = await Favorite.findOne({
      user: req.user!._id,
      movieId: req.params.movieId,
    });

    if (!favorite) {
      res.status(404).json({ message: 'Favorite not found' });
      return;
    }

    await favorite.deleteOne();

    await User.findByIdAndUpdate(req.user!._id, {
      $pull: { favorites: req.params.movieId.toString() },
    });

    res.json({ message: 'Removed from favorites' });
  } catch {
    res.status(500).json({ message: 'Error removing favorite' });
  }
};

export {
  getFavorites,
  addFavorite,
  removeFavorite,
};
