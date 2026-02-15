from flask import Flask, render_template, request, jsonify, send_from_directory
import os
import json
import secrets
import requests
from urllib.parse import urlencode

app = Flask(__name__)

# Configuration
SPOTIFY_CLIENT_ID = os.environ.get('SPOTIFY_CLIENT_ID', '')
SPOTIFY_CLIENT_SECRET = os.environ.get('SPOTIFY_CLIENT_SECRET', '')
SPOTIFY_REDIRECT_URI = os.environ.get('SPOTIFY_REDIRECT_URI', 'http://localhost:5000/api/spotify/callback')
SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize'
SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token'
SPOTIFY_API_BASE = 'https://api.spotify.com/v1'

# Check if Spotify is configured
SPOTIFY_CONFIGURED = bool(SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET)

# Data storage paths
DATA_DIR = 'data'
USER_DATA_FILE = os.path.join(DATA_DIR, 'user_data.json')
PLAYLISTS_FILE = os.path.join(DATA_DIR, 'playlists.json')

# Create necessary directories
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs('static/music', exist_ok=True)
os.makedirs('static/css', exist_ok=True)
os.makedirs('static/js', exist_ok=True)


def load_user_data():
    """Load user data from file"""
    if os.path.exists(USER_DATA_FILE):
        with open(USER_DATA_FILE, 'r') as f:
            return json.load(f)
    return {'spotify_token': None, 'playlists': []}


def save_user_data(data):
    """Save user data to file"""
    with open(USER_DATA_FILE, 'w') as f:
        json.dump(data, f, indent=2)


def load_playlists():
    """Load playlists from file"""
    if os.path.exists(PLAYLISTS_FILE):
        with open(PLAYLISTS_FILE, 'r') as f:
            return json.load(f)
    return []


def save_playlists(playlists):
    """Save playlists to file"""
    with open(PLAYLISTS_FILE, 'w') as f:
        json.dump(playlists, f, indent=2)


@app.route('/')
def index():
    """Serve the main application"""
    return render_template('index.html')


@app.route('/api/spotify/auth')
def spotify_auth():
    """Initiate Spotify OAuth flow"""
    if not SPOTIFY_CONFIGURED:
        return jsonify({
            'error': 'Spotify not configured',
            'message': 'Please set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET environment variables'
        }), 400
    
    params = {
        'client_id': SPOTIFY_CLIENT_ID,
        'response_type': 'code',
        'redirect_uri': SPOTIFY_REDIRECT_URI,
        'scope': 'playlist-read-private playlist-read-collaborative user-library-read streaming'
    }
    auth_url = f'{SPOTIFY_AUTH_URL}?{urlencode(params)}'
    return jsonify({'auth_url': auth_url})


@app.route('/api/spotify/callback')
def spotify_callback():
    """Handle Spotify OAuth callback"""
    code = request.args.get('code')
    error = request.args.get('error')
    
    if error:
        return jsonify({'error': error}), 400
    
    if not code:
        return jsonify({'error': 'No code provided'}), 400
    
    # Exchange code for access token
    data = {
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': SPOTIFY_REDIRECT_URI,
        'client_id': SPOTIFY_CLIENT_ID,
        'client_secret': SPOTIFY_CLIENT_SECRET
    }
    
    response = requests.post(SPOTIFY_TOKEN_URL, data=data)
    
    if response.status_code != 200:
        return jsonify({'error': 'Failed to get access token'}), 400
    
    auth_data = response.json()
    
    # Save token
    user_data = load_user_data()
    user_data['spotify_token'] = {
        'access_token': auth_data['access_token'],
        'refresh_token': auth_data.get('refresh_token'),
        'expires_in': auth_data.get('expires_in')
    }
    save_user_data(user_data)
    
    return render_template('index.html', spotify_connected=True)


@app.route('/api/spotify/status')
def spotify_status():
    """Check Spotify connection status"""
    user_data = load_user_data()
    connected = user_data['spotify_token'] is not None
    return jsonify({'connected': connected})


@app.route('/api/spotify/playlists')
def spotify_playlists():
    """Get user's Spotify playlists"""
    user_data = load_user_data()
    if not user_data['spotify_token']:
        return jsonify({'error': 'Not connected to Spotify'}), 401
    
    headers = {
        'Authorization': f"Bearer {user_data['spotify_token']['access_token']}"
    }
    
    response = requests.get(f'{SPOTIFY_API_BASE}/me/playlists', headers=headers)
    
    if response.status_code != 200:
        return jsonify({'error': 'Failed to fetch playlists'}), 400
    
    playlists_data = response.json()
    playlists = []
    
    for playlist in playlists_data.get('items', []):
        playlists.append({
            'id': playlist['id'],
            'name': playlist['name'],
            'description': playlist.get('description', ''),
            'image': playlist['images'][0]['url'] if playlist.get('images') else None,
            'tracks_total': playlist['tracks']['total'],
            'owner': playlist['owner']['display_name']
        })
    
    return jsonify({'playlists': playlists})


@app.route('/api/spotify/playlists/<playlist_id>')
def spotify_playlist_details(playlist_id):
    """Get details of a specific Spotify playlist"""
    user_data = load_user_data()
    if not user_data['spotify_token']:
        return jsonify({'error': 'Not connected to Spotify'}), 401
    
    headers = {
        'Authorization': f"Bearer {user_data['spotify_token']['access_token']}"
    }
    
    # Get playlist details
    response = requests.get(f'{SPOTIFY_API_BASE}/playlists/{playlist_id}', headers=headers)
    
    if response.status_code != 200:
        return jsonify({'error': str(response.text)}), 400
    
    playlist = response.json()
    
    # Get playlist tracks
    tracks_response = requests.get(
        f'{SPOTIFY_API_BASE}/playlists/{playlist_id}/tracks',
        headers=headers
    )
    
    tracks_data = tracks_response.json()
    tracks = []
    
    for item in tracks_data.get('items', []):
        track = item.get('track')
        if track:
            tracks.append({
                'id': track['id'],
                'name': track['name'],
                'artist': track['artists'][0]['name'] if track.get('artists') else 'Unknown',
                'album': track['album']['name'] if track.get('album') else 'Unknown',
                'duration': track['duration_ms'] // 1000,
                'preview_url': track.get('preview_url'),
                'image': track['album']['images'][0]['url'] if track.get('album') and track['album'].get('images') else None
            })
    
    return jsonify({
        'playlist': {
            'id': playlist['id'],
            'name': playlist['name'],
            'description': playlist.get('description', ''),
            'image': playlist['images'][0]['url'] if playlist.get('images') else None
        },
        'tracks': tracks
    })


@app.route('/api/spotify/search')
def spotify_search():
    """Search for tracks on Spotify"""
    if not SPOTIFY_CONFIGURED:
        return jsonify({
            'error': 'Spotify not configured',
            'message': 'Please set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET environment variables'
        }), 400
    
    user_data = load_user_data()
    if not user_data['spotify_token']:
        return jsonify({'error': 'Not connected to Spotify'}), 401
    
    query = request.args.get('q', '')
    if not query:
        return jsonify({'error': 'No query provided'}), 400
    
    headers = {
        'Authorization': f"Bearer {user_data['spotify_token']['access_token']}"
    }
    
    params = {
        'q': query,
        'type': 'track',
        'limit': 20
    }
    
    response = requests.get(f'{SPOTIFY_API_BASE}/search', headers=headers, params=params)
    
    if response.status_code != 200:
        return jsonify({'error': 'Failed to search Spotify'}), 400
    
    search_data = response.json()
    tracks = []
    
    for track in search_data.get('tracks', {}).get('items', []):
        tracks.append({
            'id': track['id'],
            'name': track['name'],
            'artist': track['artists'][0]['name'] if track.get('artists') else 'Unknown',
            'album': track['album']['name'] if track.get('album') else 'Unknown',
            'duration': track['duration_ms'] // 1000,
            'preview_url': track.get('preview_url'),
            'image': track['album']['images'][0]['url'] if track.get('album') and track['album'].get('images') else None,
            'uri': track.get('uri')
        })
    
    return jsonify({'tracks': tracks})


@app.route('/api/playlists', methods=['GET', 'POST'])
def playlists():
    """Manage local playlists"""
    if request.method == 'GET':
        playlists = load_playlists()
        return jsonify({'playlists': playlists})
    
    elif request.method == 'POST':
        data = request.json
        playlists = load_playlists()
        
        new_playlist = {
            'id': str(len(playlists) + 1),
            'name': data.get('name', 'New Playlist'),
            'description': data.get('description', ''),
            'tracks': data.get('tracks', []),
            'image': data.get('image', None),
            'created_at': str(secrets.token_hex(8))
        }
        
        playlists.append(new_playlist)
        save_playlists(playlists)
        
        return jsonify({'playlist': new_playlist})


@app.route('/api/playlists/<playlist_id>', methods=['PUT', 'DELETE'])
def playlist_detail(playlist_id):
    """Manage specific playlist"""
    playlists = load_playlists()
    
    if request.method == 'DELETE':
        playlists = [p for p in playlists if p['id'] != playlist_id]
        save_playlists(playlists)
        return jsonify({'success': True})
    
    elif request.method == 'PUT':
        data = request.json
        for i, playlist in enumerate(playlists):
            if playlist['id'] == playlist_id:
                playlists[i].update(data)
                break
        save_playlists(playlists)
        return jsonify({'success': True})


@app.route('/api/upload', methods=['POST'])
def upload_music():
    """Upload local music files"""
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if file:
        filename = file.filename
        file.save(os.path.join('static/music', filename))
        return jsonify({
            'success': True,
            'filename': filename,
            'url': f'/static/music/{filename}'
        })


@app.route('/api/music/<filename>')
def serve_music(filename):
    """Serve music files"""
    return send_from_directory('static/music', filename)


@app.route('/api/search', methods=['GET'])
def search_music():
    """Search local music files"""
    query = request.args.get('q', '').lower()
    music_dir = 'static/music'
    
    if not os.path.exists(music_dir):
        return jsonify({'results': []})
    
    results = []
    for filename in os.listdir(music_dir):
        if query in filename.lower():
            results.append({
                'filename': filename,
                'url': f'/static/music/{filename}'
            })
    
    return jsonify({'results': results})


@app.route('/api/spotify/disconnect')
def spotify_disconnect():
    """Disconnect from Spotify"""
    user_data = load_user_data()
    user_data['spotify_token'] = None
    save_user_data(user_data)
    return jsonify({'success': True})


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
