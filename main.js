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

    // Modal
    const modalOverlay = document.getElementById('modal-overlay');
    const modalContent = document.getElementById('modal-content');
    const modalBody = document.getElementById('modal-body');
    const modalCloseBtn = document.getElementById('modal-close-btn');

    const API_BASE = 'https://api.jikan.moe/v4';

    // --- Modal Logic ---
    const openModal = () => modalOverlay.style.display = 'flex';
    const closeModal = () => {
        modalOverlay.style.display = 'none';
        modalBody.innerHTML = ''; // Clear content on close
    };

    modalCloseBtn.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modalOverlay.style.display === 'flex') {
            closeModal();
        }
    });

    // --- Data Display Logic ---
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
            animeCard.addEventListener('click', () => showDetails(anime.mal_id));
            container.appendChild(animeCard);
        });
    };

    const showDetails = async (animeId) => {
        openModal();
        modalBody.innerHTML = '<div id="loading">불러오는 중...</div>';
        
        const animePromise = fetchData(`/anime/${animeId}/full`);
        const charactersPromise = fetchData(`/anime/${animeId}/characters`);

        const [anime, charactersData] = await Promise.all([animePromise, charactersPromise]);

        if (!anime) {
            modalBody.innerHTML = '<p>세부 정보를 불러오는 데 실패했습니다.</p>';
            return;
        }

        const synopsis = anime.synopsis ? anime.synopsis : '줄거리가 없습니다.';
        
        // Main Anime Info
        let modalContentHTML = `
            <div class="modal-grid">
                <img src="${anime.images.jpg.large_image_url}" alt="${anime.title}">
                <div class="modal-info">
                    <h2>${anime.title_japanese || anime.title}</h2>
                    <div class="modal-stats">
                        <div class="stat">점수<span>⭐ ${anime.score || 'N/A'}</span></div>
                        <div class="stat">순위<span>#${anime.rank || 'N/A'}</span></div>
                        <div class="stat">인기<span>#${anime.popularity || 'N/A'}</span></div>
                    </div>
                    <p class="synopsis">${synopsis.replace(/\n/g, '<br>')}</p>
                    <button id="translate-btn" class="translate-button">한국어로 번역</button>
                </div>
            </div>
        `;

        // Characters Info
        if (charactersData && charactersData.length > 0) {
            const mainCharacters = charactersData.filter(char => char.role === 'Main');
            if (mainCharacters.length > 0) {
                modalContentHTML += `
                    <h3>주요 등장인물</h3>
                    <div class="characters-row">
                `;
                mainCharacters.slice(0, 5).forEach(char => {
                    const voiceActor = char.voice_actors.find(va => va.language === 'Japanese');
                    modalContentHTML += `
                        <div class="character-card">
                            <img src="${char.character.images.jpg.image_url}" alt="${char.character.name}">
                            <p class="character-name">${char.character.name}</p>
                            ${voiceActor ? `<p class="voice-actor">${voiceActor.person.name}</p>` : ''}
                        </div>
                    `;
                });
                modalContentHTML += `</div>`;
            }
        }

        modalBody.innerHTML = modalContentHTML;

        document.getElementById('translate-btn').addEventListener('click', () => {
            const googleTranslateUrl = `https://translate.google.com/?sl=auto&tl=ko&text=${encodeURIComponent(synopsis)}&op=translate`;
            window.open(googleTranslateUrl, '_blank');
        });
    };

    // --- API Fetching ---
    const fetchData = async (endpoint, limit = 10) => { // Removed limit from global fetchData
        loadingIndicator.style.display = 'block';
        try {
            const url = `${API_BASE}${endpoint}${endpoint.includes('?') ? '&' : '?'}limit=${limit}&sfw`;
            // If the endpoint is for characters or full details, limit might not be applicable or need a different approach
            const finalUrl = endpoint.includes('/characters') || endpoint.includes('/full') ? `${API_BASE}${endpoint}` : url;
            const response = await fetch(finalUrl);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            return data.data;
        } catch (error) {
            console.error('API fetch error:', error);
            return null;
        } finally {
            loadingIndicator.style.display = 'none';
        }
    };
    
    // --- Page Control ---
    const showSearchResults = (show) => {
        searchResultsContainer.style.display = show ? 'block' : 'none';
        sectionsContainer.style.display = show ? 'none' : 'block';
    };

    const searchAnime = async (query) => {
        showSearchResults(true);
        const animeList = await fetchData(`/anime?q=${encodeURIComponent(query)}&sfw`);
        displayAnime(animeList, resultsGrid);
    };

    const loadInitialSections = async () => {
        showSearchResults(false);
        const topPopular = fetchData('/top/anime?filter=bypopularity&limit=10');
        const newAnime = fetchData('/seasons/now?limit=10');
        const topRated = fetchData('/top/anime?filter=favorite&limit=10');
        
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