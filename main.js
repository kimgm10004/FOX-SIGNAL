document.addEventListener('DOMContentLoaded', () => {
    // Containers
    const sectionsContainer = document.getElementById('sections-container');
    const searchResultsContainer = document.getElementById('search-results-container');
    const resultsGrid = document.getElementById('results-grid');
    const randomAnimeContainer = document.getElementById('random-anime-container');
    const topPopularContainer = document.getElementById('top-popular-container');
    const newAnimeContainer = document.getElementById('new-anime-container');
    const topRatedContainer = document.getElementById('top-rated-container');

    // Controls
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');
    const siteTitle = document.querySelector('header h1');
    const loadingIndicator = document.getElementById('loading');
    const refreshButton = document.getElementById('refresh-button'); // Get reference to refresh button

    // Modal
    const modalOverlay = document.getElementById('modal-overlay');
    const modalContent = document.getElementById('modal-content');
    const modalBody = document.getElementById('modal-body');
    const modalCloseBtn = document.getElementById('modal-close-btn');

    // New functions for managing global loading indicator
    const showGlobalLoading = () => {
        loadingIndicator.style.display = 'block';
    };

    const hideGlobalLoading = () => {
        loadingIndicator.style.display = 'none';
    };

    if (refreshButton) {
        refreshButton.addEventListener('click', () => {
            window.location.reload(); // Reloads the entire page
        });
    }

    const API_BASE = 'https://api.jikan.moe/v4';
    const YOUTUBE_API_KEY = 'AIzaSyAssRCgZTTDcTgHM3Efa18bBXhXlxtTW8k'; // User provided API key

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

    const fetchYoutubeVideoId = async (query) => {
        const YOUTUBE_SEARCH_URL = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&key=${YOUTUBE_API_KEY}&type=video&maxResults=1`;
        try {
            const response = await fetch(YOUTUBE_SEARCH_URL);
            if (!response.ok) {
                console.error('YouTube API error:', response.statusText);
                return null;
            }
            const data = await response.json();
            if (data.items && data.items.length > 0) {
                return data.items[0].id.videoId;
            }
            return null;
        } catch (error) {
            console.error('Error fetching YouTube video:', error);
            return null;
        }
    };

    const showDetails = async (animeId) => {
        openModal();
        modalBody.innerHTML = '<div id="modal-loading-indicator">불러오는 중...</div>';
        
        const animePromise = fetchData(`/anime/${animeId}/full`);
        const charactersPromise = fetchData(`/anime/${animeId}/characters`);

        const [anime, charactersData] = await Promise.all([animePromise, charactersPromise]);

        if (!anime) {
            modalBody.innerHTML = '<p>세부 정보를 불러오는 데 실패했습니다.</p>';
            return;
        }

        const synopsis = anime.synopsis ? anime.synopsis : '줄거리가 없습니다.';
        
        // Prepare additional info
        const titles = [anime.title_english, anime.title_japanese, ...(anime.title_synonyms || [])]
                        .filter(t => t && t !== anime.title)
                        .join(', ') || 'N/A';
        const genres = anime.genres.map(g => g.name).join(', ') || 'N/A';
        const studios = anime.studios.map(s => s.name).join(', ') || 'N/A';
        const type = anime.type || 'N/A';
        const episodes = anime.episodes || 'N/A';
        const status = anime.status || 'N/A';
        const aired = anime.aired ? anime.aired.string : 'N/A';
        const source = anime.source || 'N/A';
        const duration = anime.duration || 'N/A';
        const rating = anime.rating || 'N/A';
        const broadcast = anime.broadcast.string || 'N/A';


        // Main Anime Info
        let modalContentHTML = `
            <div class="modal-grid">
                <img src="${anime.images.jpg.large_image_url}" alt="${anime.title}">
                <div class="modal-info">
                    <h2>${anime.title_japanese || anime.title}</h2>
                    ${titles !== 'N/A' ? `<p class="alt-titles"><strong>다른 제목:</strong> ${titles}</p>` : ''}
                    <div class="modal-stats">
                        <div class="stat">점수<span>⭐ ${anime.score || 'N/A'}</span></div>
                        <div class="stat">순위<span>#${anime.rank || 'N/A'}</span></div>
                        <div class="stat">인기<span>#${anime.popularity || 'N/A'}</span></div>
                    </div>
                    <div class="additional-info">
                        <p><strong>유형:</strong> ${type}</p>
                        <p><strong>에피소드:</strong> ${episodes}</p>
                        <p><strong>상태:</strong> ${status}</p>
                        <p><strong>방영:</strong> ${aired}</p>
                        <p><strong>방송:</strong> ${broadcast}</p>
                        <p><strong>원작:</strong> ${source}</p>
                        <p><strong>시간:</strong> ${duration}</p>
                        <p><strong>등급:</strong> ${rating}</p>
                        <p><strong>장르:</strong> ${genres}</p>
                        <p><strong>스튜디오:</strong> ${studios}</p>
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
                    <h3 class="modal-section-title">주요 등장인물</h3>
                    <div class="characters-row">
                `;
                mainCharacters.forEach(char => {
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

        // YouTube Theme Songs
        const themeOpenings = anime.theme.openings || [];
        const themeEndings = anime.theme.endings || [];
        let youtubeVideosHTML = '';
        
        if (themeOpenings.length > 0 || themeEndings.length > 0) {
            modalContentHTML += `<h3 class="modal-section-title">주제가</h3><div class="youtube-videos-section">`;
            
            const youtubePromises = [];
            
            // Fetch first 3 openings
            themeOpenings.slice(0, 3).forEach((opTitleFull, index) => {
                const opTitle = opTitleFull.replace(/#\d+:\s*/, '');
                const query = `${anime.title} ${opTitle} opening`;
                youtubePromises.push(fetchYoutubeVideoId(query).then(videoId => ({ type: 'opening', videoId, title: opTitle, search_query: query, index })));
            });

            // Fetch first 3 endings
            themeEndings.slice(0, 3).forEach((edTitleFull, index) => {
                const edTitle = edTitleFull.replace(/#\d+:\s*/, '');
                const query = `${anime.title} ${edTitle} ending`;
                youtubePromises.push(fetchYoutubeVideoId(query).then(videoId => ({ type: 'ending', videoId, title: edTitle, search_query: query, index })));
            });

            const results = await Promise.all(youtubePromises);

            // Sort results by type (openings first) and then by original index
            results.sort((a, b) => {
                if (a.type === 'opening' && b.type === 'ending') return -1;
                if (a.type === 'ending' && b.type === 'opening') return 1;
                return a.index - b.index;
            });

            results.forEach(result => {
                if (result.videoId) {
                    youtubeVideosHTML += `
                        <div class="youtube-player-container">
                            <h4>${result.type === 'opening' ? '오프닝' : '엔딩'}${result.index > 0 ? ` ${result.index + 1}` : ''}: ${result.title}</h4>
                            <iframe 
                                src="https://www.youtube.com/embed/${result.videoId}?autoplay=0&rel=0"
                                frameborder="0" 
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowfullscreen></iframe>
                        </div>
                    `;
                } else {
                    const searchLink = `https://www.youtube.com/results?search_query=${encodeURIComponent(result.search_query)}`;
                    youtubeVideosHTML += `
                        <div class="youtube-player-container no-video">
                            <h4>${result.type === 'opening' ? '오프닝' : '엔딩'}${result.index > 0 ? ` ${result.index + 1}` : ''}: ${result.title}</h4>
                            <p>영상을 찾을 수 없습니다. <a href="${searchLink}" target="_blank">YouTube에서 검색하기</a></p>
                        </div>
                    `;
                }
            });

            modalContentHTML += youtubeVideosHTML + '</div>';
        }


        modalBody.innerHTML = modalContentHTML;

        // Push AdSense ads in the modal
        (adsbygoogle = window.adsbygoogle || []).push({});

        document.getElementById('translate-btn').addEventListener('click', () => {
            // Papago does not support direct URL-based text pre-fill like Google Translate
            window.open('https://papago.naver.com/', '_blank');
            alert('파파고 웹사이트로 이동합니다. 번역할 텍스트를 직접 복사하여 붙여넣어 주세요.');
        });

        // Add LiveRe Comments
        const commentsSection = document.createElement('div');
        commentsSection.innerHTML = `
            <h3 class="modal-section-title">댓글</h3>
            <livere-comment client-id="nF1ZelFhyRrWeseuliAS" url="${window.location.origin + window.location.pathname + '?animeId=' + animeId}"></livere-comment>
        `;
        modalBody.appendChild(commentsSection);

        // Load LiveRe script if not already loaded
        if (!document.querySelector('script[src="https://www.livere.org/livere-widget.js"]')) {
            const script = document.createElement('script');
            script.type = 'module';
            script.src = 'https://www.livere.org/livere-widget.js';
            document.head.appendChild(script);
        }
    };

    // --- API Fetching ---
    const fetchData = async (endpoint, limit = 10) => {
        showGlobalLoading();
        try {
            let url;
            // Endpoints that do not typically use a 'limit' parameter from this function's default
            if (endpoint.includes('/characters') || endpoint.includes('/full') || endpoint.includes('/random')) {
                url = `${API_BASE}${endpoint}`;
            } else {
                // For other endpoints, apply the limit
                url = `${API_BASE}${endpoint}${endpoint.includes('?') ? '&' : '?'}limit=${limit}&sfw`;
            }
            
            const response = await fetch(url); // Use the correctly constructed URL
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            return data.data;
        } catch (error) {
            console.error('API fetch error:', error);
            return null;
        } finally {
            hideGlobalLoading();
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
        const randomAnime = fetchData('/random/anime');
        const topPopular = fetchData('/top/anime?filter=bypopularity&limit=10');
        const newAnime = fetchData('/seasons/now?limit=10');
        const topRated = fetchData('/top/anime?filter=favorite&limit=10');
        
        const [randomData, popularData, newData, ratedData] = await Promise.all([randomAnime, topPopular, newAnime, topRated]);
        
        if (randomData) {
            displayAnime([randomData], randomAnimeContainer);
        }
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

    const externalLinksConfig = [
        { id: 'laftel-link', popupName: 'laftel-popup' },
        { id: 'figure-link', popupName: 'figure-popup' },
        { id: 'community-link', popupName: 'community-popup' },
        { id: 'novel-link', popupName: 'novel-popup' },
        { id: 'ost-link', popupName: 'ost-popup' },
        { id: 'naver-webtoon-link', popupName: 'naver-webtoon-popup' },
        { id: 'kakao-webtoon-link', popupName: 'kakao-webtoon-popup' },
    ];

    externalLinksConfig.forEach(({ id, popupName }) => {
        const linkElement = document.getElementById(id);
        if (linkElement) {
            linkElement.addEventListener('click', (e) => {
                e.preventDefault();
                window.open(linkElement.href, popupName, 'width=800,height=600');
            });
        }
    });

    // Initial load
    loadInitialSections();
});
