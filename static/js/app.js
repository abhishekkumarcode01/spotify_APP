// Global State
let currentTrack = null;
let currentPlaylist = [];
let currentTrackIndex = 0;
let isPlaying = false;
let audioPlayer = document.getElementById('audio-player');

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    checkSpotifyStatus();
    loadPlaylists();
    loadLibrary();
});

function initializeApp() {
    // Setup audio player events
    audioPlayer.addEventListener('timeupdate', updateProgress);
    audioPlayer.addEventListener('ended', handleTrackEnd);
    audioPlayer.addEventListener('loadedmetadata', updateDuration);
    
    // Setup volume
    audioPlayer.volume = 0.8;
}

function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.dataset.section;
            showSection(section);
        });
    });
    
    // Spotify connect
    document.getElementById('spotify-connect-btn').addEventListener('click', connectSpotify);
    document.getElementById('spotify-disconnect-btn').addEventListener('click', disconnectSpotify);
    
    // File upload
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');
    
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    fileInput.addEventListener('change', handleFileSelect);
    
    // Search
    document.getElementById('search-input').addEventListener('input', debounce(handleSearch, 300));
    
    // Progress bar
    document.getElementById('progress-container').addEventListener('click', seekTo);
    
    // Volume
    document.getElementById('volume-slider').addEventListener('input', handleVolumeChange);
}

// Navigation
function showSection(sectionId) {
    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.section === sectionId) {
            item.classList.add('active');
        }
    });
    
    // Show section
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    const targetSection = document.getElementById(`${sectionId}-section`);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Load section-specific data
    if (sectionId === 'playlists') {
        loadPlaylists();
    } else if (sectionId === 'library') {
        loadLibrary();
    }
}

// Spotify Integration
async function checkSpotifyStatus() {
    try {
        const response = await fetch('/api/spotify/status');
        const data = await response.json();
        updateSpotifyUI(data.connected);
    } catch (error) {
        console.error('Error checking Spotify status:', error);
    }
}

function updateSpotifyUI(connected) {
    const statusIndicator = document.querySelector('.status-indicator');
    const statusText = document.querySelector('.status-text');
    const connectBtn = document.getElementById('spotify-connect-btn');
    const disconnectBtn = document.getElementById('spotify-disconnect-btn');
    
    if (connected) {
        statusIndicator.classList.remove('disconnected');
        statusIndicator.classList.add('connected');
        statusText.textContent = 'Connected';
        connectBtn.style.display = 'none';
        disconnectBtn.style.display = 'inline-flex';
    } else {
        statusIndicator.classList.remove('connected');
        statusIndicator.classList.add('disconnected');
        statusText.textContent = 'Not Connected';
        connectBtn.style.display = 'inline-flex';
        disconnectBtn.style.display = 'none';
    }
}

async function connectSpotify() {
    try {
        const response = await fetch('/api/spotify/auth');
        const data = await response.json();
        
        if (data.error) {
            if (data.message) {
                alert('Spotify is not configured!\n\nTo use Spotify features, you need to:\n1. Go to https://developer.spotify.com/dashboard\n2. Create a new app\n3. Get your Client ID and Client Secret\n4. Set them as environment variables:\n   SPOTIFY_CLIENT_ID=your_id\n   SPOTIFY_CLIENT_SECRET=your_secret\n\nOr create a .env file with these values.');
            } else {
                showToast(data.error);
            }
            return;
        }
        
        if (data.auth_url) {
            window.location.href = data.auth_url;
        }
    } catch (error) {
        console.error('Error connecting to Spotify:', error);
        showToast('Failed to connect to Spotify');
    }
}

async function disconnectSpotify() {
    try {
        await fetch('/api/spotify/disconnect');
        updateSpotifyUI(false);
        showToast('Disconnected from Spotify');
    } catch (error) {
        console.error('Error disconnecting from Spotify:', error);
    }
}

async function loadSpotifyPlaylists() {
    const container = document.getElementById('spotify-playlists-container');
    container.innerHTML = '<div class="spinner"></div>';
    
    try {
        const response = await fetch('/api/spotify/playlists');
        const data = await response.json();
        
        if (data.error) {
            container.innerHTML = `<p class="error">${data.error}</p>`;
            return;
        }
        
        if (data.playlists.length === 0) {
            container.innerHTML = '<p>No playlists found</p>';
            return;
        }
        
        container.innerHTML = data.playlists.map(playlist => `
            <div class="playlist-card" onclick="loadSpotifyPlaylist('${playlist.id}')">
                <div class="playlist-image">
                    ${playlist.image 
                        ? `<img src="${playlist.image}" alt="${playlist.name}">` 
                        : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="8" y1="6" x2="21" y2="6"></line>
                            <line x1="8" y1="12" x2="21" y2="12"></line>
                            <line x1="8" y1="18" x2="21" y2="18"></line>
                           </svg>`
                    }
                </div>
                <div class="playlist-info">
                    <h3>${escapeHtml(playlist.name)}</h3>
                    <p>${playlist.tracks_total} tracks</p>
                </div>
            </div>
        `).join('');
        
        // Show spotify section
        showSection('spotify');
        
    } catch (error) {
        console.error('Error loading Spotify playlists:', error);
        container.innerHTML = '<p class="error">Failed to load playlists</p>';
    }
}

async function loadSpotifyPlaylist(playlistId) {
    try {
        const response = await fetch(`/api/spotify/playlists/${playlistId}`);
        const data = await response.json();
        
        if (data.error) {
            showToast(data.error);
            return;
        }
        
        // Create a local playlist from Spotify data
        const newPlaylist = {
            name: data.playlist.name,
            description: data.playlist.description || 'Imported from Spotify',
            image: data.playlist.image,
            tracks: data.tracks.map(track => ({
                id: track.id,
                name: track.name,
                artist: track.artist,
                album: track.album,
                duration: track.duration,
                preview_url: track.preview_url,
                image: track.image
            }))
        };
        
        // Save to local playlists
        await fetch('/api/playlists', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newPlaylist)
        });
        
        showToast('Playlist imported successfully!');
        loadPlaylists();
        showSection('playlists');
        
    } catch (error) {
        console.error('Error importing playlist:', error);
        showToast('Failed to import playlist');
    }
}

// Spotify Search
async function searchSpotify() {
    const searchInput = document.getElementById('spotify-search-input');
    const query = searchInput.value.trim();
    
    if (!query) {
        showToast('Please enter a search term');
        return;
    }
    
    const container = document.getElementById('search-results-container');
    container.innerHTML = '<div class="spinner"></div>';
    
    try {
        const response = await fetch(`/api/spotify/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        if (data.error) {
            if (data.message) {
                container.innerHTML = `
                    <div class="no-results">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        <h3>Spotify Not Configured</h3>
                        <p>To use Spotify search, you need to set up Spotify credentials.</p>
                        <p style="margin-top: 16px; font-size: 14px;">
                            <strong>Quick Setup:</strong><br>
                            1. Go to <a href="https://developer.spotify.com/dashboard" target="_blank" style="color: var(--primary-color);">Spotify Developer Dashboard</a><br>
                            2. Create a new app<br>
                            3. Get your Client ID and Client Secret<br>
                            4. Create a .env file with:<br>
                            <code style="background: var(--bg-lighter); padding: 8px; display: block; margin-top: 8px;">
                                SPOTIFY_CLIENT_ID=your_client_id<br>
                                SPOTIFY_CLIENT_SECRET=your_client_secret
                            </code>
                        </p>
                    </div>
                `;
            } else {
                container.innerHTML = `<p class="error">${data.error}</p>`;
            }
            return;
        }
        
        if (data.tracks.length === 0) {
            container.innerHTML = `
                <div class="no-results">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    <h3>No results found</h3>
                    <p>Try a different search term</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = data.tracks.map((track, index) => `
            <div class="search-result-item" id="search-result-${index}">
                <div class="search-result-image">
                    ${track.image 
                        ? `<img src="${track.image}" alt="${track.name}">` 
                        : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="2" y="2" width="20" height="20" rx="2"></rect>
                            <circle cx="12" cy="12" r="4"></circle>
                           </svg>`
                    }
                </div>
                <div class="search-result-info">
                    <h4>${escapeHtml(track.name)}</h4>
                    <p>${escapeHtml(track.artist)} • ${escapeHtml(track.album)}</p>
                </div>
                <span class="search-result-duration">${formatTime(track.duration)}</span>
                <button class="search-result-play-btn" onclick="playSpotifyTrack(${index})">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                </button>
            </div>
        `).join('');
        
        // Store tracks for playback
        window.searchResults = data.tracks;
        
    } catch (error) {
        console.error('Error searching Spotify:', error);
        container.innerHTML = '<p class="error">Failed to search. Make sure you\'re connected to Spotify.</p>';
    }
}

function playSpotifyTrack(index) {
    const track = window.searchResults[index];
    if (!track) return;
    
    // Update playing state
    document.querySelectorAll('.search-result-item').forEach(item => {
        item.classList.remove('playing');
    });
    document.getElementById(`search-result-${index}`).classList.add('playing');
    
    // Play the track
    if (track.preview_url) {
        playTrack(track);
        showToast(`Now playing: ${track.name}`);
    } else {
        showToast('Preview not available for this track');
    }
}

// Add enter key listener for search
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('spotify-search-input');
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchSpotify();
            }
        });
    }
});

// Playlists
async function loadPlaylists() {
    const container = document.getElementById('playlists-container');
    container.innerHTML = '<div class="spinner"></div>';
    
    try {
        const response = await fetch('/api/playlists');
        const data = await response.json();
        
        if (data.playlists.length === 0) {
            container.innerHTML = '<p>No playlists yet. Create one!</p>';
            return;
        }
        
        container.innerHTML = data.playlists.map(playlist => `
            <div class="playlist-card" onclick="playPlaylist('${playlist.id}')">
                <div class="playlist-image">
                    ${playlist.image 
                        ? `<img src="${playlist.image}" alt="${playlist.name}">` 
                        : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="8" y1="6" x2="21" y2="6"></line>
                            <line x1="8" y1="12" x2="21" y2="12"></line>
                            <line x1="8" y1="18" x2="21" y2="18"></line>
                           </svg>`
                    }
                </div>
                <div class="playlist-info">
                    <h3>${escapeHtml(playlist.name)}</h3>
                    <p>${playlist.tracks.length} tracks</p>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading playlists:', error);
        container.innerHTML = '<p class="error">Failed to load playlists</p>';
    }
}

async function createPlaylist() {
    const name = prompt('Enter playlist name:');
    if (!name) return;
    
    const description = prompt('Enter description (optional):') || '';
    
    try {
        await fetch('/api/playlists', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, description })
        });
        
        showToast('Playlist created!');
        loadPlaylists();
    } catch (error) {
        console.error('Error creating playlist:', error);
        showToast('Failed to create playlist');
    }
}

async function playPlaylist(playlistId) {
    try {
        const response = await fetch('/api/playlists');
        const data = await response.json();
        const playlist = data.playlists.find(p => p.id === playlistId);
        
        if (playlist && playlist.tracks.length > 0) {
            currentPlaylist = playlist.tracks;
            currentTrackIndex = 0;
            playTrack(currentPlaylist[0]);
        }
    } catch (error) {
        console.error('Error playing playlist:', error);
    }
}

// Library
async function loadLibrary() {
    const container = document.getElementById('library-container');
    container.innerHTML = '<div class="spinner"></div>';
    
    try {
        const response = await fetch('/api/search?q=');
        const data = await response.json();
        
        if (data.results.length === 0) {
            container.innerHTML = '<p>No music files found. Upload some!</p>';
            return;
        }
        
        container.innerHTML = data.results.map((item, index) => `
            <div class="library-item" onclick="playLocalTrack('${item.url}', '${escapeHtml(item.filename)}')">
                <span class="library-item-number">${index + 1}</span>
                <div class="library-item-image">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 18V5l12-2v13"></path>
                        <circle cx="6" cy="18" r="3"></circle>
                    </svg>
                </div>
                <div class="library-item-info">
                    <h4>${escapeHtml(item.filename)}</h4>
                    <p>Local file</p>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading library:', error);
        container.innerHTML = '<p class="error">Failed to load library</p>';
    }
}

async function handleSearch(e) {
    const query = e.target.value;
    const container = document.getElementById('library-container');
    
    if (query.length < 2) {
        loadLibrary();
        return;
    }
    
    try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        container.innerHTML = data.results.map((item, index) => `
            <div class="library-item" onclick="playLocalTrack('${item.url}', '${escapeHtml(item.filename)}')">
                <span class="library-item-number">${index + 1}</span>
                <div class="library-item-image">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 18V5l12-2v13"></path>
                        <circle cx="6" cy="18" r="3"></circle>
                    </svg>
                </div>
                <div class="library-item-info">
                    <h4>${escapeHtml(item.filename)}</h4>
                    <p>Local file</p>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error searching:', error);
    }
}

// File Upload
function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        uploadFiles(files);
    }
}

function handleFileSelect(e) {
    const files = e.target.files;
    if (files.length > 0) {
        uploadFiles(files);
    }
}

async function uploadFiles(files) {
    const progressDiv = document.getElementById('upload-progress');
    const progressFill = document.getElementById('progress-fill');
    const statusText = document.getElementById('upload-status');
    
    progressDiv.style.display = 'block';
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);
        
        statusText.textContent = `Uploading ${file.name} (${i + 1}/${files.length})`;
        
        try {
            await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            
            const progress = ((i + 1) / files.length) * 100;
            progressFill.style.width = `${progress}%`;
            
        } catch (error) {
            console.error('Error uploading file:', error);
        }
    }
    
    statusText.textContent = 'Upload complete!';
    setTimeout(() => {
        progressDiv.style.display = 'none';
        progressFill.style.width = '0%';
    }, 2000);
    
    showToast('Files uploaded successfully!');
    loadLibrary();
}

// Player Functions
function playTrack(track) {
    currentTrack = track;
    
    // Update player UI
    document.getElementById('player-track-name').textContent = track.name;
    document.getElementById('player-artist-name').textContent = track.artist || 'Unknown';
    
    const albumArt = document.getElementById('player-album-art');
    if (track.image) {
        albumArt.innerHTML = `<img src="${track.image}" alt="${track.name}">`;
    } else {
        albumArt.innerHTML = `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="2" width="20" height="20" rx="2"></rect>
            <circle cx="12" cy="12" r="4"></circle>
        </svg>`;
    }
    
    // Play audio
    if (track.preview_url) {
        audioPlayer.src = track.preview_url;
        audioPlayer.play();
        isPlaying = true;
        updatePlayButton();
    }
}

function playLocalTrack(url, filename) {
    currentTrack = {
        name: filename.replace(/\.[^/.]+$/, ''),
        artist: 'Local',
        url: url
    };
    
    document.getElementById('player-track-name').textContent = currentTrack.name;
    document.getElementById('player-artist-name').textContent = currentTrack.artist;
    
    audioPlayer.src = url;
    audioPlayer.play();
    isPlaying = true;
    updatePlayButton();
}

function togglePlay() {
    if (!currentTrack) return;
    
    if (isPlaying) {
        audioPlayer.pause();
    } else {
        audioPlayer.play();
    }
    
    isPlaying = !isPlaying;
    updatePlayButton();
}

function updatePlayButton() {
    const playBtn = document.getElementById('play-btn');
    if (isPlaying) {
        playBtn.innerHTML = `<svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16"></rect>
            <rect x="14" y="4" width="4" height="16"></rect>
        </svg>`;
    } else {
        playBtn.innerHTML = `<svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg>`;
    }
}

function previousTrack() {
    if (currentPlaylist.length === 0) return;
    
    currentTrackIndex = (currentTrackIndex - 1 + currentPlaylist.length) % currentPlaylist.length;
    playTrack(currentPlaylist[currentTrackIndex]);
}

function nextTrack() {
    if (currentPlaylist.length === 0) return;
    
    currentTrackIndex = (currentTrackIndex + 1) % currentPlaylist.length;
    playTrack(currentPlaylist[currentTrackIndex]);
}

function handleTrackEnd() {
    if (currentPlaylist.length > 0) {
        nextTrack();
    } else {
        isPlaying = false;
        updatePlayButton();
    }
}

function updateProgress() {
    const progress = (audioPlayer.currentTime / audioPlayer.duration) * 100;
    document.getElementById('progress-bar').style.width = `${progress}%`;
    document.getElementById('current-time').textContent = formatTime(audioPlayer.currentTime);
}

function updateDuration() {
    document.getElementById('total-time').textContent = formatTime(audioPlayer.duration);
}

function seekTo(e) {
    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audioPlayer.currentTime = percent * audioPlayer.duration;
}

function handleVolumeChange(e) {
    audioPlayer.volume = e.target.value / 100;
}

// Utility Functions
function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Service Worker Registration (for PWA)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/static/sw.js')
            .then(registration => console.log('SW registered'))
            .catch(error => console.log('SW registration failed'));
    });
}
