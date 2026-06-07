import mongoose from 'mongoose';

const adminMessageSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminChatGroup',
    default: null,
  },
  content: {
    type: String,
    required: true,
  },
  isEdited: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

const AdminMessage = mongoose.model('AdminMessage', adminMessageSchema);

export default AdminMessage;
