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
// include a filter to filter by genre
// include a sort dropdown to sort alphabetical by artist name, number of albums/singles, ???
// information for each artist will include: name, image, genres, number of albums, link to artist page
// artist page will include name, image, genres, list of top tracks (name only), list of albums
// information for each album will include: name, image, release date, number of tracks
// search results will include artists only with same information as above


const clientID = '5a6960985fbc4fd1b21b4a0c0be80839';
const clientSecret = '1eff2b0a945a4984ab69f5431e49ff35';
let accessToken = '';

// 1. Get access token
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


// 2. On page load, show the top ten artists from the public Billboard Hot 100 playlist: https://open.spotify.com/playlist/6UeSakyzhiEt4NB3UAd6NQ
async function showTopArtists() {
    if( !accessToken ) {
        accessToken = await getAccessToken();
    }
    const response = await fetch(`https://api.spotify.com/v1/playlists/6UeSakyzhiEt4NB3UAd6NQ`, {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });

    const playlistData = await response.json();
    const tracks = playlistData.tracks.items;

    // get list of artists from tracks that are not explicit
    const cleanTracks = tracks.filter(track => !track.track.explicit);
    const artists = cleanTracks.map(track => track.track.artists[0]);

    // filter out duplicate artists
    // using filter() and findIndex() keeps the first occurrence of each object with a unique property and filters out duplicates
    const uniqueArtists = artists.filter((obj, index, arr) => arr.findIndex(item => JSON.stringify(item) === JSON.stringify(obj)) === index);
    
    // return first 10 artists
    const topTenArtists = uniqueArtists.slice(0, 10);

    // output grid with artist info
    const artistsHtmlArray = await Promise.all(topTenArtists.map(artist => artistHtml(artist)));
    const artistsHtml = artistsHtmlArray.join('');
    document.querySelector('.grid--artists').innerHTML = artistsHtml;

    // remove loading icon
    document.querySelector('.loading').classList.remove('content-loading');
}
showTopArtists();

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
    if( !accessToken ) {
        accessToken = await getAccessToken();
    }
    const response = await fetch(`https://api.spotify.com/v1/artists/${artistId}`, {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });
    const artistData = await response.json();
    return artistData;
}

function getArtistImage(artist) {
    const imageUrl = artist.images[1].url;
    return `<img src="${imageUrl}" alt="${artist.name}">`;
}

function listGenres(genres) {
    if( genres ) {
        return genres.join(', ');
    }
    return;
}

async function getTotalAlbums(artistId) {
    if( !accessToken ) {
        accessToken = await getAccessToken();
    }
    const response = await fetch(`https://api.spotify.com/v1/artists/${artistId}/albums`, {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });
    const artistAlbums = await response.json();
    return artistAlbums.total;
}