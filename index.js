// api endpoints:
// search: https://api.spotify.com/v1/search
// artists: https://api.spotify.com/v1/artists
// single artist: https://api.spotify.com/v1/artists/{id}
// artist's albums: https://api.spotify.com/v1/artists/{id}/albums
// artist's top tracks: https://api.spotify.com/v1/artists/{id}/top-tracks
// albums: https://api.spotify.com/v1/albums
// single album: https://api.spotify.com/v1/albums/{id}

// website requirements:
// one page
// search bar
// search results with search term
// search filters
// use data from an api
// no results message
// hover states
// press enter or search button
// show at least 6 results
// skeleton loading state

// website ui:
// on page load, show a list of popular (or random) artists - 10 total in a grid
// include a search input to search by artist name
// include a filter to filter by genre ???
// include a sort dropdown to sort alphabetical by artist name, number of albums/singles
// information for each artist will include: name, image, genres, number of albums, link to artist page
// artist page will include name, image, genres, list of top tracks (name only), list of albums
// information for each album will include: name, image, release date, number of tracks
// search results will include artists only with same information as above


// const clientID = '5a6960985fbc4fd1b21b4a0c0be80839';
// const clientSecret = '1eff2b0a945a4984ab69f5431e49ff35';
const clientID = '5eea5bb6b03543a5aeffd28155206b0b';
const clientSecret = 'd06fda22796249d7ad39e4f0944d32ac';
const orderSelect = document.querySelector('#sort-artists');
let accessToken = '';
let cached;
let playlistData;
let searchData;
let artistSource = '';
let currentArtists = [];

// get access token
async function getAccessToken() {
    const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Authorization': 'Basic ' + btoa(`${clientID}:${clientSecret}`),
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
    });
    const data = await response.json();
    accessToken = data.access_token;
    return accessToken;
}


// on page load, show the top ten artists from the public Billboard Hot 100 playlist: https://open.spotify.com/playlist/6UeSakyzhiEt4NB3UAd6NQ
async function showPopularArtists() {
    if( !accessToken ) {
        accessToken = await getAccessToken();
    }
    const response = await fetch(`https://api.spotify.com/v1/playlists/6UeSakyzhiEt4NB3UAd6NQ`, {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });

    if( !playlistData ) {
        playlistData = await response.json();
    }

    const tracks = playlistData.tracks.items;

    // get list of artists from tracks that are not explicit
    const cleanTracks = tracks.filter(track => !track.track.explicit);
    const artists = cleanTracks.map(track => track.track.artists[0]);

    // filter out duplicate artists
    // using filter() and findIndex() keeps the first occurrence of each object with a unique property and filters out duplicates
    const uniqueArtists = artists.filter((obj, index, arr) => arr.findIndex(item => JSON.stringify(item) === JSON.stringify(obj)) === index);
    
    // return first 10 artists
    const topTenArtists = uniqueArtists.slice(0, 10);

    // update currentArtists array and content source
    currentArtists = topTenArtists;
    artistSource = 'playlist';

    // get sort order from dropdown and call to render artists
    const sortOrder = orderSelect.options[orderSelect.selectedIndex];
    sortAndRenderArtists(artistSource, sortOrder);
}

async function searchArtists(event) {
    event.preventDefault();
    const searchTerm = event.target[0].value.trim();

    // show default popular artists if no search term is entered
    if( !searchTerm ) {
        showPopularArtists();
        return;
    }

    if( !accessToken ) {
        accessToken = await getAccessToken();
    }
    // default limit from Spotify API is 20 - change by adding &limit=X to fetch url
    const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(searchTerm)}&type=artist&limit=10`, {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });
    searchData = await response.json();

    // update currentArtists array and content source
    const searchResults = searchData.artists.items;
    currentArtists = searchResults;
    artistSource = 'search';

    // get sort order from dropdown and call to render artists
    const sortOrder = orderSelect.options[orderSelect.selectedIndex];
    sortAndRenderArtists(artistSource, sortOrder);
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function artistHtml(artist) {
    const artistInfo = await getArtistInfo(artist.id);
    // console.log(artistInfo);

    const artistAlbums = await getTotalAlbums(artist.id);

    return `<div class="grid__card">
        <div class="card__image card__image--round">
            ${getArtistImage(artistInfo)}
        </div>
        <h3>${artistInfo.name}</h3>
        <p class="artist__albums">${artistAlbums.toLocaleString('en-US')} Albums/Singles</p>
        <p class="artist__genres">${listGenres(artistInfo.genres)}</p>
    </div>`;
}

async function getArtistInfo(artistId) {
    cached = localStorage.getItem(`artist_${artistId}`);
    if( cached ) {
        // console.log(`Fetched ${artistId} from cache`);
        return JSON.parse(cached);
    } else {
        // console.log(`Fetched ${artistId} from API`);
    }

    if( !accessToken ) {
        accessToken = await getAccessToken();
    }
    const response = await fetch(`https://api.spotify.com/v1/artists/${artistId}`, {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });

    const artistData = await response.json();
    localStorage.setItem(`artist_${artistId}`, JSON.stringify(artistData));
    return artistData;
}

function getArtistImage(artist) {
    let imageUrl;

    if( artist.images.length ) {
        imageUrl = artist.images[1].url;
    } else {
        imageUrl = 'https://placehold.co/320x320';
    }
    return `<img src="${imageUrl}" alt="${artist.name}">`;
}

function listGenres(genres) {
    if( genres ) {
        return genres.join(', ');
    }
    return;
}

async function getTotalAlbums(artistId) {
    const cached = localStorage.getItem(`artist_${artistId}_albums`);
    if( cached ) {
        // console.log(`Fetched albums for ${artistId} from cache`);
        return parseInt(cached, 10);
    }
    // console.log(`Fetched albums for ${artistId} from API`);

    if( !accessToken ) {
        accessToken = await getAccessToken();
    }

    const response = await fetch(`https://api.spotify.com/v1/artists/${artistId}/albums`, {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });
    const artistAlbums = await response.json();
    localStorage.setItem(`artist_${artistId}_albums`, artistAlbums.total);
    return artistAlbums.total;
}

function sortArtists(event) {
    const sortOrder = event.target.value;
    sortAndRenderArtists(artistSource, sortOrder);
}

function showLoadingIcon(isLoading) {
    const icon = document.querySelector('.loading');
    const grid = document.querySelector('.grid--artists');

    if( isLoading ) {
        // show icon
        icon.classList.add('content-loading');
        grid.classList.add('faded');
    } else {
        // hide icon
        icon.classList.remove('content-loading');
        grid.classList.remove('faded');
    }
}

async function sortAndRenderArtists(artistSource, sortOrder) {
    // console.log(artistSource, sortOrder);

    // show loading icon
    showLoadingIcon(true);

    // get current artists based on source

    let artists = [...currentArtists];
    let sortedArtists = artists;

    // apply sort order
    if( sortOrder === 'alphabetical_asc' ) {
        sortedArtists.sort((a, b) => {
            const nameA = a.name.toLowerCase();
            const nameB = b.name.toLowerCase();

            if( nameA < nameB ) {
                return -1;
            } else if( nameA > nameB ) {
                return 1;
            } else {
                return 0;
            }
        });
    } else if( sortOrder === 'alphabetical_desc' ) {
        sortedArtists.sort((a, b) => {
            const nameA = a.name.toLowerCase();
            const nameB = b.name.toLowerCase();

            if( nameA > nameB ) {
                return -1;
            } else if( nameA < nameB ) {
                return 1;
            } else {
                return 0;
            }
        });
    } else {
        sortedArtists = artists;
    }

    // check for cached data
    const isCached = sortedArtists.every(artist => localStorage.getItem(`artist_${artist.id}`));
    const htmlArray = [];

    // build html array
    for( let i = 0; i < sortedArtists.length; i++ ) {
        const html = await artistHtml(sortedArtists[i]);
        htmlArray.push(html);
        
        // delay each request by 300ms to prevent exceeding rate limits (only if data is not cached)
        if( !isCached ) {
            await delay(200);
        }
    }

    // output grid with artist info
    document.querySelector('.grid--artists').innerHTML = htmlArray.join('');

    // hide loading icon
    showLoadingIcon(false);
}

// show popular artists on page load
showPopularArtists();