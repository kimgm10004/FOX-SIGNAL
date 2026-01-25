document.addEventListener('DOMContentLoaded', () => {
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');
    const resultsContainer = document.getElementById('results-container');
    const loadingIndicator = document.getElementById('loading');
    const siteTitle = document.querySelector('header h1');

    const API_BASE = 'https://api.jikan.moe/v4';

    const displayAnime = (animeList) => {
        resultsContainer.innerHTML = '';
        if (!animeList || animeList.length === 0) {
            resultsContainer.innerHTML = '<p>검색 결과가 없습니다.</p>';
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
            // Add click event to open mal_id link
            animeCard.addEventListener('click', () => {
                window.open(anime.url, '_blank');
            });
            resultsContainer.appendChild(animeCard);
        });
    };

    const fetchData = async (endpoint) => {
        loadingIndicator.style.display = 'block';
        resultsContainer.innerHTML = '';
        try {
            const response = await fetch(`${API_BASE}${endpoint}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data.data;
        } catch (error) {
            console.error('API fetch error:', error);
            resultsContainer.innerHTML = '<p>데이터를 불러오는 중 오류가 발생했습니다. 나중에 다시 시도해주세요.</p>';
            return null;
        } finally {
            loadingIndicator.style.display = 'none';
        }
    };

    const searchAnime = async (query) => {
        const animeList = await fetchData(`/anime?q=${encodeURIComponent(query)}&sfw`);
        displayAnime(animeList);
    };

    const getTopAnime = async () => {
        const animeList = await fetchData('/top/anime?filter=airing');
        displayAnime(animeList);
    };

    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const query = searchInput.value.trim();
        if (query) {
            searchAnime(query);
        }
    });

    siteTitle.addEventListener('click', () => {
        searchInput.value = '';
        getTopAnime();
    });

    // Initial load
    getTopAnime();
});