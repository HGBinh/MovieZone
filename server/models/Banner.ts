import mongoose from 'mongoose';

const bannerSchema = new mongoose.Schema({
  movie: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Movie',
    required: false,
  },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  image: { type: String, required: true },
  link: { type: String },
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
}, {
  timestamps: true,
});

export default mongoose.model('Banner', bannerSchema);
