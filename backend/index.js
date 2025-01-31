const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const User = require('./models/User');
const Playlist = require('./models/Playlist');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// User routes
app.post('/signup', async (req, res) => {
  const { username, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();
    res.status(201).json({ message: 'User created successfully' });
  } catch (err) {
    res.status(400).json({ message: 'Error creating user', error: err.message });
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    res.status(200).json({ 
      message: 'Login successful',
      username: user.username
    });
  } catch (err) {
    res.status(500).json({ message: 'Error logging in', error: err.message });
  }
});

// Playlist routes
// Get all playlists for a user
app.get('/playlists', async (req, res) => {
  try {
    const username = req.headers.username;
    if (!username) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    const playlists = await Playlist.find({ username }).sort({ updatedAt: -1 });
    res.json(playlists);
  } catch (error) {
    console.error('Error fetching playlists:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a single playlist
app.get('/playlists/:id', async (req, res) => {
  try {
    const username = req.headers.username;
    if (!username) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const playlist = await Playlist.findOne({
      _id: req.params.id,
      username
    });
    
    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found' });
    }
    
    res.json(playlist);
  } catch (error) {
    console.error('Error fetching playlist:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new playlist
app.post('/playlists', async (req, res) => {
  try {
    const username = req.headers.username;
    if (!username) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const { name, description } = req.body;
    const playlist = new Playlist({
      name,
      description,
      username,
      items: []
    });
    
    await playlist.save();
    res.status(201).json(playlist);
  } catch (error) {
    console.error('Error creating playlist:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a playlist
app.put('/playlists/:id', async (req, res) => {
  try {
    const username = req.headers.username;
    if (!username) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const { name, description } = req.body;
    const playlist = await Playlist.findOne({
      _id: req.params.id,
      username
    });
    
    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found' });
    }
    
    playlist.name = name;
    playlist.description = description;
    await playlist.save();
    
    res.json(playlist);
  } catch (error) {
    console.error('Error updating playlist:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a playlist
app.delete('/playlists/:id', async (req, res) => {
  try {
    const username = req.headers.username;
    if (!username) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const playlist = await Playlist.findOne({
      _id: req.params.id,
      username
    });
    
    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found' });
    }
    
    await playlist.deleteOne();
    res.json({ message: 'Playlist deleted' });
  } catch (error) {
    console.error('Error deleting playlist:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add item to playlist
app.post('/playlists/:id/items', async (req, res) => {
  try {
    const username = req.headers.username;
    if (!username) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const playlist = await Playlist.findOne({
      _id: req.params.id,
      username
    });
    
    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found' });
    }
    
    const { mediaId, title, poster, mediaType } = req.body;
    
    // Check if item already exists
    const itemExists = playlist.items.some(item => item.mediaId === mediaId);
    if (itemExists) {
      return res.status(400).json({ message: 'Item already in playlist' });
    }
    
    playlist.items.push({
      mediaId,
      title,
      poster,
      mediaType
    });
    
    await playlist.save();
    res.json(playlist);
  } catch (error) {
    console.error('Error adding item to playlist:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove item from playlist
app.delete('/playlists/:id/items/:mediaId', async (req, res) => {
  try {
    const username = req.headers.username;
    if (!username) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const playlist = await Playlist.findOne({
      _id: req.params.id,
      username
    });
    
    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found' });
    }
    
    playlist.items = playlist.items.filter(
      item => item.mediaId !== req.params.mediaId
    );
    
    await playlist.save();
    res.json(playlist);
  } catch (error) {
    console.error('Error removing item from playlist:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
