const mongoose = require('mongoose');

const playlistSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    username: {
        type: String,
        required: true
    },
    items: [{
        mediaId: {
            type: String,
            required: true
        },
        title: {
            type: String,
            required: true
        },
        poster: String,
        mediaType: {
            type: String,
            enum: ['movie', 'tv'],
            required: true
        },
        addedAt: {
            type: Date,
            default: Date.now
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt timestamp before saving
playlistSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Playlist', playlistSchema);
