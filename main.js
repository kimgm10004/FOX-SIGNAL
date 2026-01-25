document.addEventListener('DOMContentLoaded', () => {
    // Containers
    const sectionsContainer = document.getElementById('sections-container');
    const searchResultsContainer = document.getElementById('search-results-container');
    const resultsGrid = document.getElementById('results-grid');
    const topPopularContainer = document.getElementById('top-popular-container');
    const newAnimeContainer = document.getElementById('new-anime-container');
    const topRatedContainer = document.getElementById('top-rated-container');

    // Controls
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');
    const siteTitle = document.querySelector('header h1');
    const loadingIndicator = document.getElementById('loading');

    const API_BASE = 'https://api.jikan.moe/v4';

    const displayAnime = (animeList, container) => {
        container.innerHTML = '';
        if (!animeList || animeList.length === 0) {
            container.innerHTML = '<p>결과가 없습니다.</p>';
            return;
        }

        animeList.forEach(anime => {
            const animeCard = document.createElement('div');
            animeCard.className = 'anime-card';

            const title = anime.title_japanese || anime.title;
            const imageUrl = anime.images.jpg.large_image_url;

            animeCard.innerHTML = `
                <img src="${imageUrl}" alt="${title}">
                <div class="anime-info">
                    <h3>${title}</h3>
                    <p>⭐ ${anime.score || 'N/A'}</p>
                </div>
            `;
            animeCard.addEventListener('click', () => {
                window.open(anime.url, '_blank');
            });
            container.appendChild(animeCard);
        });
    };

    const fetchData = async (endpoint, limit = 10) => {
        loadingIndicator.style.display = 'block';
        try {
            const url = `${API_BASE}${endpoint}${endpoint.includes('?') ? '&' : '?'}limit=${limit}&sfw`;
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            return data.data;
        } catch (error) {
            console.error('API fetch error:', error);
            // Optionally display an error in the specific container
            return null;
        } finally {
            loadingIndicator.style.display = 'none';
        }
    };
    
    const showSearchResults = (show) => {
        searchResultsContainer.style.display = show ? 'block' : 'none';
        sectionsContainer.style.display = show ? 'none' : 'block';
    };

    const searchAnime = async (query) => {
        showSearchResults(true);
        const animeList = await fetchData(`/anime?q=${encodeURIComponent(query)}`);
        displayAnime(animeList, resultsGrid);
    };

    const loadInitialSections = async () => {
        showSearchResults(false);
        const topPopular = fetchData('/top/anime?filter=bypopularity');
        const newAnime = fetchData('/seasons/now');
        const topRated = fetchData('/top/anime?filter=favorite');
        
        const [popularData, newData, ratedData] = await Promise.all([topPopular, newAnime, topRated]);
        
        displayAnime(popularData, topPopularContainer);
        displayAnime(newData, newAnimeContainer);
        displayAnime(ratedData, topRatedContainer);
    };

    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const query = searchInput.value.trim();
        if (query) searchAnime(query);
    });

    siteTitle.addEventListener('click', () => {
        searchInput.value = '';
        showSearchResults(false);
    });

    // Initial load
    loadInitialSections();
});
