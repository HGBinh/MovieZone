import mongoose from 'mongoose';

const movieSchema = new mongoose.Schema({
  tmdbId: { type: String, unique: true, sparse: true },
  title: { type: String, required: true },
  description: { type: String },
  posterPath: { type: String },
  backdropPath: { type: String },
  trailerUrl: { type: String },
  releaseDate: { type: String },
  runtime: { type: String },
  country: { type: String },
  voteAverage: { type: Number },
  genres: [String],
  views: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
}, {
  timestamps: true,
});

export default mongoose.model('Movie', movieSchema);
