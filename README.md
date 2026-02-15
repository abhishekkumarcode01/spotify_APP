# MusicHub - Your Personal Music Player

A modern, Spotify-like music player built with Python/Flask that allows you to import your Spotify playlists and play local music files. Features a beautiful, responsive UI and Progressive Web App (PWA) support for mobile devices.

## Features

- 🎵 **Modern UI**: Spotify-inspired dark theme with smooth animations
- 🎧 **Music Playback**: Full-featured audio player with controls
- 📱 **Mobile Friendly**: Responsive design and PWA support
- 🔗 **Spotify Integration**: Import your Spotify playlists
- 🔍 **Spotify Search**: Search and play songs directly from Spotify without uploading
- 📁 **Local Music**: Upload and play your own music files
- 🔍 **Local Search**: Quickly find tracks in your library
- 📋 **Playlist Management**: Create and manage custom playlists
- 🎨 **Beautiful Design**: Clean, intuitive interface

## Screenshots

The application features:
- Sidebar navigation
- Home dashboard with quick actions
- Playlist grid view
- Music library with search
- Upload area with drag & drop
- Bottom player bar with controls

## Prerequisites

- Python 3.8 or higher
- pip (Python package manager)
- A Spotify Developer Account (optional, for Spotify integration)

## Installation

### 1. Clone or Download the Project

```bash
cd "c:/Users/Abhishek/Desktop/music app"
```

### 2. Create a Virtual Environment (Recommended)

```bash
python -m venv venv
```

### 3. Activate the Virtual Environment

**Windows:**
```bash
venv\Scripts\activate
```

**Mac/Linux:**
```bash
source venv/bin/activate
```

### 4. Install Dependencies

```bash
pip install -r requirements.txt
```

## Spotify Setup (Optional)

**Note:** Spotify integration is optional. The app works perfectly with just local music files. If you want to search and play songs from Spotify, follow these steps:

### Get Spotify Credentials

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Set the redirect URI to: `http://localhost:5000/api/spotify/callback`
4. Copy your Client ID and Client Secret

### Set Environment Variables

**Option 1: Using .env file (Recommended)**

Create a `.env` file in the project root:
```
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
```

**Option 2: Using Command Line**

**Windows (Command Prompt):**
```cmd
set SPOTIFY_CLIENT_ID=your_client_id_here
set SPOTIFY_CLIENT_SECRET=your_client_secret_here
```

**Windows (PowerShell):**
```powershell
$env:SPOTIFY_CLIENT_ID="your_client_id_here"
$env:SPOTIFY_CLIENT_SECRET="your_client_secret_here"
```

**Mac/Linux:**
```bash
export SPOTIFY_CLIENT_ID=your_client_id_here
export SPOTIFY_CLIENT_SECRET=your_client_secret_here
```

**Without Spotify:** The app will still work perfectly! You can upload your own music files and use all other features.

### 2. Create a Virtual Environment (Recommended)

```bash
python -m venv venv
```

### 3. Activate the Virtual Environment

**Windows:**
```bash
venv\Scripts\activate
```

**Mac/Linux:**
```bash
source venv/bin/activate
```

### 4. Install Dependencies

```bash
pip install -r requirements.txt
```

## Spotify Setup (Optional)

To enable Spotify playlist import:

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Set the redirect URI to: `http://localhost:5000/api/spotify/callback`
4. Copy your Client ID and Client Secret

### Set Environment Variables

**Windows (Command Prompt):**
```cmd
set SPOTIFY_CLIENT_ID=your_client_id_here
set SPOTIFY_CLIENT_SECRET=your_client_secret_here
```

**Windows (PowerShell):**
```powershell
$env:SPOTIFY_CLIENT_ID="your_client_id_here"
$env:SPOTIFY_CLIENT_SECRET="your_client_secret_here"
```

**Mac/Linux:**
```bash
export SPOTIFY_CLIENT_ID=your_client_id_here
export SPOTIFY_CLIENT_SECRET=your_client_secret_here
```

Or create a `.env` file in the project root:
```
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
```

## Running the Application

### Start the Server

```bash
python app.py
```

The application will start on `http://localhost:5000`

### Access the Application

Open your web browser and navigate to:
```
http://localhost:5000
```

## Usage

### Uploading Music

1. Navigate to the "Upload" section
2. Drag and drop music files or click to browse
3. Supported formats: MP3, WAV, OGG, FLAC, etc.

### Importing Spotify Playlists

1. Click "Connect Spotify" in the sidebar
2. Authorize the application with your Spotify account
3. Browse your Spotify playlists
4. Click on a playlist to import it

**Note:** Imported playlists will use Spotify's 30-second preview clips for playback.

### Searching and Playing Spotify Songs

1. Connect to Spotify (see above)
2. Navigate to the "Search" section in the sidebar
3. Type a song name, artist, or album in the search box
4. Click "Search" or press Enter
5. Click the play button on any result to play it immediately

**Note:** Spotify search plays 30-second preview clips. No upload required!

### Creating Playlists

1. Go to the "Playlists" section
2. Click "+ Create Playlist"
3. Enter a name and optional description

### Playing Music

1. Click on any track in the library or playlist
2. Use the player controls at the bottom:
   - ⏮️ Previous track
   - ▶️ Play/Pause
   - ⏭️ Next track
   - 🔊 Volume control
   - Progress bar for seeking

## Mobile Installation

### Option 1: Add to Home Screen (iOS/Android)

1. Open the app in your mobile browser
2. Tap the share button
3. Select "Add to Home Screen"
4. The app will be installed as a PWA

### Option 2: Use as Web App

Simply access the app from your mobile browser at your server's IP address.

### Accessing from Mobile on Local Network

1. Find your computer's local IP address:
   - **Windows:** Open Command Prompt and run `ipconfig`
   - **Mac/Linux:** Open Terminal and run `ifconfig` or `ip addr`
2. On your mobile device, navigate to: `http://YOUR_IP_ADDRESS:5000`

**Example:** If your IP is `192.168.1.100`, access: `http://192.168.1.100:5000`

## Project Structure

```
music app/
├── app.py                 # Flask application
├── requirements.txt       # Python dependencies
├── README.md             # This file
├── templates/
│   └── index.html        # Main HTML template
├── static/
│   ├── css/
│   │   └── style.css     # Stylesheet
│   ├── js/
│   │   └── app.js        # Frontend JavaScript
│   ├── music/            # Uploaded music files
│   ├── manifest.json     # PWA manifest
│   └── sw.js            # Service worker
└── data/
    ├── user_data.json    # User settings
    └── playlists.json    # Saved playlists
```

## API Endpoints

### Authentication
- `GET /api/spotify/auth` - Get Spotify authorization URL
- `GET /api/spotify/callback` - Handle Spotify OAuth callback
- `GET /api/spotify/status` - Check Spotify connection status
- `GET /api/spotify/disconnect` - Disconnect from Spotify

### Playlists
- `GET /api/playlists` - Get all playlists
- `POST /api/playlists` - Create a new playlist
- `PUT /api/playlists/<id>` - Update a playlist
- `DELETE /api/playlists/<id>` - Delete a playlist

### Spotify
- `GET /api/spotify/playlists` - Get user's Spotify playlists
- `GET /api/spotify/playlists/<id>` - Get specific Spotify playlist details
- `GET /api/spotify/search?q=<query>` - Search for tracks on Spotify

### Music
- `POST /api/upload` - Upload music files
- `GET /api/music/<filename>` - Serve music file
- `GET /api/search?q=<query>` - Search music library

## Troubleshooting

### Port Already in Use

If port 5000 is already in use, modify the port in [`app.py`](app.py:1):

```python
app.run(debug=True, host='0.0.0.0', port=5001)  # Change to 5001 or another port
```

### Spotify Connection Issues

- Ensure your redirect URI matches exactly: `http://localhost:5000/api/spotify/callback`
- Check that your Client ID and Client Secret are correct
- Make sure your Spotify app has the correct scopes enabled

### Mobile Access Issues

- Ensure your firewall allows connections on port 5000
- Make sure your mobile device is on the same network as your computer
- Try accessing via your computer's IP address instead of localhost

### Music Not Playing

- Check that the file format is supported by your browser
- Ensure the file was uploaded successfully
- Check browser console for errors

## Development

### Adding New Features

The application is structured for easy extension:

- **Backend**: Add new routes in [`app.py`](app.py:1)
- **Frontend**: Add new functions in [`static/js/app.js`](static/js/app.js:1)
- **Styling**: Modify [`static/css/style.css`](static/css/style.css:1)
- **UI**: Update [`templates/index.html`](templates/index.html:1)

### Customizing the Theme

Edit the CSS variables in [`static/css/style.css`](static/css/style.css:1):

```css
:root {
    --primary-color: #1db954;
    --bg-dark: #121212;
    --bg-light: #181818;
    /* ... more variables */
}
```

## Deployment

### For Personal Use

Run locally as described above. Access from any device on your network using your computer's IP address.

### For Public Access

Consider using:
- **ngrok**: For quick public access (temporary)
- **Heroku**: For cloud deployment
- **VPS**: For permanent hosting (DigitalOcean, AWS, etc.)

### Using ngrok (Quick Public Access)

1. Install ngrok from https://ngrok.com
2. Run: `ngrok http 5000`
3. Use the provided URL to access your app from anywhere

## Security Notes

- This is a personal project, not production-ready for public deployment
- Consider adding authentication for multi-user scenarios
- Validate and sanitize all file uploads
- Use HTTPS in production
- Keep your Spotify credentials secure

## License

This project is open source and available for personal use.

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the code comments
3. Ensure all dependencies are installed correctly

## Future Enhancements

Potential features to add:
- User authentication and profiles
- Music visualization
- Lyrics display
- Equalizer
- Offline mode with full caching
- Social sharing
- Last.fm integration
- Music recommendations
- Podcast support

---

**Enjoy your music! 🎵**
