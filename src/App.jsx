import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import './App.css'

function App() {
  const [movies, setMovies] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [currentView, setCurrentView] = useState('trending');
  const [contentType, setContentType] = useState('movie');
  const [theme, setTheme] = useState(() => {
    // Get theme from localStorage or use 'light' as default
    return localStorage.getItem('theme') || 'light';
  });
  const [isThemeTransitioning, setIsThemeTransitioning] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [lastQuery, setLastQuery] = useState('');
  const categoryMenuRef = useRef(null);
  const searchInputRef = useRef(null);
  const suggestionsRef = useRef(null);

  const apiKey = import.meta.env.VITE_TMDB_API_KEY;
  
  // Categories and subcategories definition
  const categories = [
    {
      name: 'Genres',
      subcategories: [
        { id: 28, name: 'Action' },
        { id: 12, name: 'Adventure' },
        { id: 16, name: 'Animation' },
        { id: 35, name: 'Comedy' },
        { id: 80, name: 'Crime' },
        { id: 99, name: 'Documentary' },
        { id: 18, name: 'Drama' },
        { id: 10751, name: 'Family' },
        { id: 14, name: 'Fantasy' },
        { id: 36, name: 'History' },
        { id: 27, name: 'Horror' },
      ]
    },
    {
      name: 'Collections',
      subcategories: [
        { id: 'popular', name: 'Popular' },
        { id: 'top_rated', name: 'Top Rated' },
        { id: 'upcoming', name: 'Upcoming' },
        { id: 'now_playing', name: 'Now Playing' },
      ]
    },
    {
      name: 'TV Genres',
      subcategories: [
        { id: 10759, name: 'Action & Adventure' },
        { id: 16, name: 'Animation' },
        { id: 35, name: 'Comedy' },
        { id: 80, name: 'Crime' },
        { id: 99, name: 'Documentary' },
        { id: 18, name: 'Drama' },
        { id: 10751, name: 'Family' },
        { id: 10762, name: 'Kids' },
        { id: 9648, name: 'Mystery' },
        { id: 10763, name: 'News' },
        { id: 10764, name: 'Reality' },
      ]
    },
    {
      name: 'TV Collections',
      subcategories: [
        { id: 'popular', name: 'Popular' },
        { id: 'top_rated', name: 'Top Rated' },
        { id: 'on_the_air', name: 'On The Air' },
        { id: 'airing_today', name: 'Airing Today' },
      ]
    }
  ];

  // Toggle category dropdown
  const toggleCategoryMenu = () => {
    setCategoryMenuOpen(!categoryMenuOpen);
  };

  // Close category menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(event.target)) {
        setCategoryMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Function to fetch search suggestions as user types
  const fetchSearchSuggestions = async (query) => {
    if (query.length < 2) {
      setSearchSuggestions([]);
      return;
    }
    
    try {
      // Fetch movie and TV suggestions in parallel using Promise.all
      const [movieResponse, tvResponse] = await Promise.all([
        axios.get('https://api.themoviedb.org/3/search/movie', {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          params: {
            query: query,
            page: 1,
            include_adult: false
          }
        }),
        axios.get('https://api.themoviedb.org/3/search/tv', {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          params: {
            query: query,
            page: 1,
            include_adult: false
          }
        })
      ]);
      
      // Format TV results
      const formattedTvResults = tvResponse.data.results.map(show => ({
        ...show,
        title: show.name,
        release_date: show.first_air_date,
        media_type: 'tv'
      }));
      
      // Format movie results
      const formattedMovieResults = movieResponse.data.results.map(movie => ({
        ...movie,
        media_type: 'movie'
      }));
      
      // Combine results, sort by popularity and limit to 8 suggestions
      const combinedResults = [...formattedMovieResults, ...formattedTvResults]
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, 8);
      
      setSearchSuggestions(combinedResults);
    } catch (error) {
      console.error('Error fetching search suggestions:', error);
    }
  };

  // State to track if suggestions are loading
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  // Debounce function to limit API calls while typing
  useEffect(() => {
    if (searchTerm.length < 2) {
      setSearchSuggestions([]);
      setSuggestionsLoading(false);
      return;
    }
    
    setSuggestionsLoading(true);
    const timeoutId = setTimeout(() => {
      fetchSearchSuggestions(searchTerm);
      setSuggestionsLoading(false);
    }, 300); // Reduced from 500ms to 300ms for faster response
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [searchTerm]);

  // Handle clicks outside of suggestions to close the dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target) && 
          searchInputRef.current && !searchInputRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search for content (both movies and TV shows)
  const searchContent = async (e, page = 1) => {
    if (e) e.preventDefault();
    setShowSuggestions(false);
    
    if (searchTerm === '' && !lastQuery) return;
    
    const query = searchTerm || lastQuery;
    
    try {
      setLoading(true);
      setError(null);
      setSelectedMovie(null);
      setCurrentView('search');
      
      if (searchTerm) {
        setLastQuery(searchTerm);
        setCurrentPage(1);
      } else {
        setCurrentPage(page);
      }
      
      // Search for movies first
      const movieResponse = await axios.get('https://api.themoviedb.org/3/search/movie', {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        params: {
          query: query,
          page: page
        }
      });
      
      // Search for TV shows
      const tvResponse = await axios.get('https://api.themoviedb.org/3/search/tv', {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        params: {
          query: query,
          page: page
        }
      });

      // Set the total pages (use the higher value between movie and TV results)
      setTotalPages(Math.max(movieResponse.data.total_pages, tvResponse.data.total_pages));
      
      // Format TV results to match movie result structure
      const formattedTvResults = tvResponse.data.results.map(show => ({
        ...show,
        title: show.name,
        release_date: show.first_air_date,
        media_type: 'tv'
      }));
      
      // Add media_type to movie results
      const formattedMovieResults = movieResponse.data.results.map(movie => ({
        ...movie,
        media_type: 'movie'
      }));
      
      // Combine and sort results by popularity
      const combinedResults = [...formattedMovieResults, ...formattedTvResults]
        .sort((a, b) => b.popularity - a.popularity);
      
      setMovies(combinedResults);
      scrollToTop();
    } catch (err) {
      setError('Failed to fetch search results. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Function to scroll to top with smooth behavior
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Function to fetch trending content with pagination
  const fetchTrendingContent = async (page = 1) => {
    try {
      setLoading(true);
      setSelectedMovie(null);
      const response = await axios.get('https://api.themoviedb.org/3/trending/all/day', {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        params: {
          page: page
        }
      });
      
      // Format the results to ensure TV shows have the same structure as movies
      const formattedResults = response.data.results.map(item => {
        if (item.media_type === 'tv') {
          return {
            ...item,
            title: item.name,
            release_date: item.first_air_date
          };
        }
        return item;
      });
      
      setMovies(formattedResults);
      setCurrentPage(page);
      setTotalPages(response.data.total_pages);
      setCurrentView('trending');
      scrollToTop();
    } catch (err) {
      setError('Failed to fetch trending content.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Enhanced function to get movies by collection type with pagination
  const getMoviesByCollection = async (collectionType, collectionName, page = 1) => {
    try {
      setLoading(true);
      setError(null);
      setSelectedMovie(null);
      setCategoryMenuOpen(false);
      setCurrentView(`collection:${collectionName}`);
      setContentType('movie');
      
      const response = await axios.get(`https://api.themoviedb.org/3/movie/${collectionType}`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        params: {
          page: page
        }
      });
      
      // Add media_type to the results
      const formattedResults = response.data.results.map(movie => ({
        ...movie,
        media_type: 'movie'
      }));
      
      setMovies(formattedResults);
      setCurrentPage(page);
      setTotalPages(response.data.total_pages);
      scrollToTop();
    } catch (err) {
      setError(`Failed to fetch ${collectionName.toLowerCase()} movies. Please try again.`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Function to get TV shows by collection type with pagination
  const getTvShowsByCollection = async (collectionType, collectionName, page = 1) => {
    try {
      setLoading(true);
      setError(null);
      setSelectedMovie(null);
      setCategoryMenuOpen(false);
      setCurrentView(`tv-collection:${collectionName}`);
      setContentType('tv');
      
      const response = await axios.get(`https://api.themoviedb.org/3/tv/${collectionType}`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        params: {
          page: page
        }
      });
      
      // Format TV results to match movie result structure
      const formattedResults = response.data.results.map(show => ({
        ...show,
        title: show.name,
        release_date: show.first_air_date,
        media_type: 'tv'
      }));
      
      setMovies(formattedResults);
      setCurrentPage(page);
      setTotalPages(response.data.total_pages);
      scrollToTop();
    } catch (err) {
      setError(`Failed to fetch ${collectionName.toLowerCase()} TV shows. Please try again.`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Enhanced function to get movies by genre with pagination
  const getMoviesByGenre = async (genreId, genreName, page = 1) => {
    try {
      setLoading(true);
      setError(null);
      setSelectedMovie(null);
      setCategoryMenuOpen(false);
      setCurrentView(`genre:${genreName}`);
      setContentType('movie');
      
      const response = await axios.get('https://api.themoviedb.org/3/discover/movie', {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        params: {
          with_genres: genreId,
          sort_by: 'popularity.desc',
          page: page
        }
      });
      
      // Add media_type to the results
      const formattedResults = response.data.results.map(movie => ({
        ...movie,
        media_type: 'movie'
      }));
      
      setMovies(formattedResults);
      setCurrentPage(page);
      setTotalPages(response.data.total_pages);
      scrollToTop();
    } catch (err) {
      setError('Failed to fetch movies by genre. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Function to get TV shows by genre with pagination
  const getTvShowsByGenre = async (genreId, genreName, page = 1) => {
    try {
      setLoading(true);
      setError(null);
      setSelectedMovie(null);
      setCategoryMenuOpen(false);
      setCurrentView(`tv-genre:${genreName}`);
      setContentType('tv');
      
      const response = await axios.get('https://api.themoviedb.org/3/discover/tv', {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        params: {
          with_genres: genreId,
          sort_by: 'popularity.desc',
          page: page
        }
      });
      
      // Format TV results to match movie result structure
      const formattedResults = response.data.results.map(show => ({
        ...show,
        title: show.name,
        release_date: show.first_air_date,
        media_type: 'tv'
      }));
      
      setMovies(formattedResults);
      setCurrentPage(page);
      setTotalPages(response.data.total_pages);
      scrollToTop();
    } catch (err) {
      setError('Failed to fetch TV shows by genre. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Get content details (handles both movies and TV shows)
  const getContentDetails = async (id, mediaType) => {
    try {
      setLoading(true);
      
      // URL paths differ based on media type
      const contentType = mediaType === 'tv' ? 'tv' : 'movie';
      
      // Get content details
      const contentDetails = await axios.get(`https://api.themoviedb.org/3/${contentType}/${id}`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Get content reviews
      const contentReviews = await axios.get(`https://api.themoviedb.org/3/${contentType}/${id}/reviews`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      // Get content videos (trailers, teasers, etc.)
      const contentVideos = await axios.get(`https://api.themoviedb.org/3/${contentType}/${id}/videos`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      // Get content credits (cast and crew)
      const contentCredits = await axios.get(`https://api.themoviedb.org/3/${contentType}/${id}/credits`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      // Get similar content
      const similarContent = await axios.get(`https://api.themoviedb.org/3/${contentType}/${id}/similar`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Format content details based on media type
      let formattedDetails = contentDetails.data;
      
      if (mediaType === 'tv') {
        formattedDetails = {
          ...contentDetails.data,
          title: contentDetails.data.name,
          release_date: contentDetails.data.first_air_date,
          runtime: contentDetails.data.episode_run_time && contentDetails.data.episode_run_time.length > 0 
            ? contentDetails.data.episode_run_time[0] 
            : null,
          media_type: 'tv'
        };
      } else {
        formattedDetails = {
          ...contentDetails.data,
          media_type: 'movie'
        };
      }
      
      // Format similar content based on media type
      const formattedSimilar = similarContent.data.results.map(item => {
        if (mediaType === 'tv') {
          return {
            ...item,
            title: item.name,
            release_date: item.first_air_date,
            media_type: 'tv'
          };
        }
        return {
          ...item,
          media_type: 'movie'
        };
      });
      
      setSelectedMovie({
        ...formattedDetails,
        reviews: contentReviews.data.results,
        videos: contentVideos.data.results,
        credits: contentCredits.data,
        similar: formattedSimilar
      });
    } catch (err) {
      setError('Failed to fetch content details. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Load trending content on initial load
  useEffect(() => {
    fetchTrendingContent();
  }, []);

  // Apply theme to document when theme changes
  useEffect(() => {
    document.body.className = theme;
    // Also update the meta theme-color for mobile devices
    const metaThemeColor = document.querySelector("meta[name='theme-color']");
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme === 'dark' ? '#121212' : '#f8f9fa');
    }
  }, [theme]);

  // Get page title based on currentView
  const getPageTitle = () => {
    if (currentView === 'trending') return 'Trending Content';
    if (currentView === 'search') return 'Search Results';
    
    const [type, name] = currentView.split(':');
    if (type.startsWith('tv')) {
      return `TV Shows: ${name}`;
    }
    return name;
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    setSearchTerm(suggestion.title);
    setShowSuggestions(false);
    getContentDetails(suggestion.id, suggestion.media_type);
  };

  // Toggle theme between light and dark
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setIsThemeTransitioning(true);
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);

    // Remove transition class after animation duration
    setTimeout(() => {
      setIsThemeTransitioning(false);
    }, 500); // Match this duration with the CSS transition duration
  };

  // Function to handle page changes
  const handlePageChange = (page) => {
    // Reuse the last query or function based on current view
    if (currentView === 'search') {
      searchContent(null, page);
    } else if (currentView === 'trending') {
      fetchTrendingContent(page);
    } else if (currentView.startsWith('collection:')) {
      const collectionName = currentView.split(':')[1];
      const collectionType = categories[1].subcategories.find(c => c.name === collectionName)?.id;
      if (collectionType) {
        getMoviesByCollection(collectionType, collectionName, page);
      }
    } else if (currentView.startsWith('genre:')) {
      const genreName = currentView.split(':')[1];
      const genreId = categories[0].subcategories.find(c => c.name === genreName)?.id;
      if (genreId) {
        getMoviesByGenre(genreId, genreName, page);
      }
    } else if (currentView.startsWith('tv-collection:')) {
      const collectionName = currentView.split(':')[1];
      const collectionType = categories[3].subcategories.find(c => c.name === collectionName)?.id;
      if (collectionType) {
        getTvShowsByCollection(collectionType, collectionName, page);
      }
    } else if (currentView.startsWith('tv-genre:')) {
      const genreName = currentView.split(':')[1];
      const genreId = categories[2].subcategories.find(c => c.name === genreName)?.id;
      if (genreId) {
        getTvShowsByGenre(genreId, genreName, page);
      }
    }
  };

  // Function to generate page numbers for pagination
  const generatePageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5; // Maximum number of pages to show
    
    let startPage = Math.max(currentPage - Math.floor(maxVisiblePages / 2), 1);
    let endPage = startPage + maxVisiblePages - 1;
    
    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(endPage - maxVisiblePages + 1, 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    
    return pageNumbers;
  };

  return (
    <div className={`app ${theme} ${isThemeTransitioning ? 'transitioning' : ''}`}>
      {/* Navbar with search and categories */}
      <nav className="navbar">
        <div className="navbar-container">
          <div className="logo">
            <h1>MoviesFlix</h1>
          </div>
          
          <div className="nav-links">
            <button className="nav-link active" onClick={() => {
              setCategoryMenuOpen(false);
              fetchTrendingContent();
            }}>Home</button>
            
            <div className="categories-dropdown" ref={categoryMenuRef}>
              <button 
                className={`nav-link categories-toggle ${categoryMenuOpen ? 'active' : ''}`} 
                onClick={toggleCategoryMenu}
              >
                Categories <span className="dropdown-arrow">▼</span>
              </button>
              
              {categoryMenuOpen && (
                <div className="categories-menu">
                  {categories.map((category) => (
                    <div 
                      key={category.name} 
                      className={`category-group ${activeCategory === category.name ? 'active' : ''}`}
                      onMouseEnter={() => setActiveCategory(category.name)}
                    >
                      <div className="category-name">{category.name}</div>
                      <div className="subcategories">
                        {category.subcategories.map((subcategory) => (
                          <button 
                            key={subcategory.id} 
                            className="subcategory"
                            onClick={() => {
                              if (category.name === 'Genres') {
                                getMoviesByGenre(subcategory.id, subcategory.name);
                              } else if (category.name === 'Collections') {
                                getMoviesByCollection(subcategory.id, subcategory.name);
                              } else if (category.name === 'TV Genres') {
                                getTvShowsByGenre(subcategory.id, subcategory.name);
                              } else if (category.name === 'TV Collections') {
                                getTvShowsByCollection(subcategory.id, subcategory.name);
                              }
                            }}
                          >
                            {subcategory.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="search-container">
            <form onSubmit={searchContent} className="search-form">
              <div className="search-input-container">
                <input
                  type="text"
                  placeholder="Search for movies & TV shows..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => searchTerm && setShowSuggestions(true)}
                  ref={searchInputRef}
                />
                {searchTerm.length >= 2 && showSuggestions && (
                  <div className="search-suggestions" ref={suggestionsRef}>
                    {suggestionsLoading ? (
                      <div className="suggestion-loading">
                        <div className="suggestion-spinner"></div>
                        <p>Finding matches...</p>
                      </div>
                    ) : searchSuggestions.length > 0 ? (
                      searchSuggestions.map(suggestion => (
                        <div 
                          key={`${suggestion.id}-${suggestion.media_type}`} 
                          className="search-suggestion-item"
                          onClick={() => handleSuggestionClick(suggestion)}
                        >
                          <div className="suggestion-poster">
                            {suggestion.poster_path ? (
                              <img 
                                src={`https://image.tmdb.org/t/p/w92${suggestion.poster_path}`} 
                                alt={suggestion.title}
                              />
                            ) : (
                              <div className="suggestion-no-image"></div>
                            )}
                          </div>
                          <div className="suggestion-info">
                            <div className="suggestion-title">{suggestion.title}</div>
                            <div className="suggestion-details">
                              <span className="suggestion-year">
                                {suggestion.release_date ? new Date(suggestion.release_date).getFullYear() : 'N/A'}
                              </span>
                              <span className="suggestion-type">
                                {suggestion.media_type === 'tv' ? 'TV Show' : 'Movie'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="no-suggestions">No results found</div>
                    )}
                  </div>
                )}
              </div>
              <button type="submit" className="search-button">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <span>Search</span>
              </button>
            </form>
          </div>
          
          <button 
            className="theme-toggle" 
            onClick={toggleTheme} 
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      </nav>

      <div className="content-container">
        {loading && <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>}
        
        {error && <div className="error">{error}</div>}

        <main>
          {!selectedMovie && !loading && (
            <>
              <h2 className="section-title">{getPageTitle()}</h2>
              <div className="movies-grid">
                {movies.map(item => (
                  <div 
                    key={item.id} 
                    className="movie-card" 
                    onClick={() => getContentDetails(item.id, item.media_type)}
                  >
                    {item.poster_path ? (
                      <img 
                        src={`https://image.tmdb.org/t/p/w500${item.poster_path}`} 
                        alt={item.title} 
                      />
                    ) : (
                      <div className="no-image">No Image</div>
                    )}
                    <div className="movie-info">
                      <div className="media-type-badge">{item.media_type === 'tv' ? 'TV' : 'Movie'}</div>
                      <h3>{item.title}</h3>
                      <div className="movie-meta">
                        <span className="rating">
                          <i className="star">★</i>
                          {item.vote_average ? `${item.vote_average.toFixed(1)}/10` : 'NR'}
                        </span>
                        <span className="year">{item.release_date ? new Date(item.release_date).getFullYear() : 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pagination">
                  <button 
                    className="page-button" 
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(1)}
                  >
                    &laquo; First
                  </button>
                  
                  <button 
                    className="page-button" 
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                  >
                    &lsaquo; Prev
                  </button>
                  
                  <div className="page-numbers">
                    {generatePageNumbers().map(pageNum => (
                      <button 
                        key={pageNum} 
                        className={`page-number ${pageNum === currentPage ? 'active' : ''}`}
                        onClick={() => handlePageChange(pageNum)}
                      >
                        {pageNum}
                      </button>
                    ))}
                  </div>
                  
                  <button 
                    className="page-button" 
                    disabled={currentPage === totalPages}
                    onClick={() => handlePageChange(currentPage + 1)}
                  >
                    Next &rsaquo;
                  </button>
                  
                  <button 
                    className="page-button" 
                    disabled={currentPage === totalPages}
                    onClick={() => handlePageChange(totalPages)}
                  >
                    Last &raquo;
                  </button>
                </div>
              )}
            </>
          )}

          {selectedMovie && (
            <div className="movie-details">
              <button className="back-button" onClick={() => setSelectedMovie(null)}>
                <i className="arrow-left">←</i> Back to Results
              </button>
              
              <div className="movie-detail-header">
                {selectedMovie.poster_path ? (
                  <img 
                    src={`https://image.tmdb.org/t/p/w500${selectedMovie.poster_path}`} 
                    alt={selectedMovie.title} 
                  />
                ) : (
                  <div className="no-image large">No Image Available</div>
                )}
                
                <div className="movie-info-detail">
                  <div className="media-type-badge large">
                    {selectedMovie.media_type === 'tv' ? 'TV Series' : 'Movie'}
                  </div>
                  <h2>{selectedMovie.title}</h2>
                  <p className="tagline">{selectedMovie.tagline}</p>
                  <p className="release-date">
                    {selectedMovie.media_type === 'tv' ? 'First Aired:' : 'Released:'} 
                    {selectedMovie.release_date ? new Date(selectedMovie.release_date).toLocaleDateString() : 'N/A'}
                  </p>
                  {selectedMovie.media_type === 'tv' && selectedMovie.number_of_seasons && (
                    <p className="seasons-info">
                      <strong>Seasons:</strong> {selectedMovie.number_of_seasons} 
                      {selectedMovie.number_of_episodes && (
                        <span> ({selectedMovie.number_of_episodes} episodes)</span>
                      )}
                    </p>
                  )}
                  <div className="genres">
                    {selectedMovie.genres && selectedMovie.genres.map(genre => (
                      <span 
                        key={genre.id} 
                        className="genre" 
                        onClick={() => {
                          if (selectedMovie.media_type === 'tv') {
                            getTvShowsByGenre(genre.id, genre.name);
                          } else {
                            getMoviesByGenre(genre.id, genre.name);
                          }
                        }}
                      >
                        {genre.name}
                      </span>
                    ))}
                  </div>
                  <p className="rating">
                    <i className="star">★</i> {selectedMovie.vote_average ? `${selectedMovie.vote_average.toFixed(1)}/10` : 'No rating'}
                    <span className="vote-count">({selectedMovie.vote_count} votes)</span>
                  </p>
                  {selectedMovie.runtime && (
                    <p className="runtime">
                      <strong>Runtime:</strong> {selectedMovie.runtime} min
                    </p>
                  )}
                  {selectedMovie.media_type === 'tv' && selectedMovie.status && (
                    <p className="status">
                      <strong>Status:</strong> {selectedMovie.status}
                    </p>
                  )}
                  {selectedMovie.media_type === 'movie' && selectedMovie.budget > 0 && (
                    <p className="budget">
                      <strong>Budget:</strong> ${(selectedMovie.budget).toLocaleString()}
                    </p>
                  )}
                  {selectedMovie.media_type === 'movie' && selectedMovie.revenue > 0 && (
                    <p className="revenue">
                      <strong>Revenue:</strong> ${(selectedMovie.revenue).toLocaleString()}
                    </p>
                  )}
                  {selectedMovie.production_companies && selectedMovie.production_companies.length > 0 && (
                    <div className="production-companies">
                      <strong>Production:</strong>{' '}
                      {selectedMovie.production_companies.map(company => company.name).join(', ')}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Content Trailer Section */}
              {selectedMovie.videos && selectedMovie.videos.length > 0 && (
                <div className="trailer-section">
                  <h3>Trailer</h3>
                  <div className="trailer-container">
                    {(() => {
                      // Find official trailer first
                      let trailer = selectedMovie.videos.find(video => 
                        video.type === 'Trailer' && 
                        video.site === 'YouTube' && 
                        video.name.toLowerCase().includes('official')
                      );
                      
                      // If no official trailer, get any trailer
                      if (!trailer) {
                        trailer = selectedMovie.videos.find(video => 
                          video.type === 'Trailer' && 
                          video.site === 'YouTube'
                        );
                      }
                      
                      // If still no trailer, get any YouTube video
                      if (!trailer) {
                        trailer = selectedMovie.videos.find(video => 
                          video.site === 'YouTube'
                        );
                      }
                      
                      return trailer ? (
                        <iframe 
                          className="trailer-iframe"
                          src={`https://www.youtube.com/embed/${trailer.key}`}
                          title={`${selectedMovie.title} Trailer`}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        ></iframe>
                      ) : (
                        <div className="no-trailer">No trailer available</div>
                      );
                    })()}
                  </div>
                </div>
              )}
              
              <div className="overview">
                <h3>Overview</h3>
                <p>{selectedMovie.overview || 'No overview available'}</p>
              </div>
              
              {/* Cast Section */}
              {selectedMovie.credits && selectedMovie.credits.cast && selectedMovie.credits.cast.length > 0 && (
                <div className="cast-section">
                  <h3>Cast</h3>
                  <div className="cast-list">
                    {selectedMovie.credits.cast.slice(0, 10).map(actor => (
                      <div key={actor.id} className="cast-member">
                        {actor.profile_path ? (
                          <img 
                            src={`https://image.tmdb.org/t/p/w200${actor.profile_path}`} 
                            alt={actor.name} 
                            className="cast-photo"
                          />
                        ) : (
                          <div className="cast-photo-placeholder">
                            <span>{actor.name.charAt(0)}</span>
                          </div>
                        )}
                        <div className="cast-info">
                          <h4>{actor.name}</h4>
                          <p className="character">{actor.character}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="reviews">
                <h3>User Reviews</h3>
                {selectedMovie.reviews && selectedMovie.reviews.length > 0 ? (
                  <div className="reviews-list">
                    {selectedMovie.reviews.slice(0, 3).map(review => (
                      <div key={review.id} className="review">
                        <div className="review-header">
                          <h4>{review.author}</h4>
                          <span className="review-date">
                            {new Date(review.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="review-content">{review.content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No reviews available.</p>
                )}
              </div>
              
              {/* Similar Content Section */}
              {selectedMovie.similar && selectedMovie.similar.length > 0 && (
                <div className="similar-movies-section">
                  <h3>{selectedMovie.media_type === 'tv' ? 'Similar TV Shows' : 'Similar Movies'}</h3>
                  <div className="similar-movies-grid">
                    {selectedMovie.similar.slice(0, 6).map(item => (
                      <div 
                        key={item.id} 
                        className="similar-movie-card" 
                        onClick={() => getContentDetails(item.id, item.media_type)}
                      >
                        {item.poster_path ? (
                          <img 
                            src={`https://image.tmdb.org/t/p/w200${item.poster_path}`} 
                            alt={item.title} 
                          />
                        ) : (
                          <div className="no-image-small">No Image</div>
                        )}
                        <h4>{item.title}</h4>
                        <div className="similar-movie-year">
                          {item.release_date ? new Date(item.release_date).getFullYear() : 'N/A'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
      
      <footer className="footer" id="footer">
        <div className="footer-content">
          <div className="footer-section">
            <h3>MoviesFlix</h3>
            <p>Your ultimate database for discovering and exploring movies and TV shows.</p>
          </div>
          
          <div className="footer-section">
            <h3>Quick Links</h3>
            <ul>
              <li><a href="#" onClick={(e) => {
                e.preventDefault();
                setSelectedMovie(null);
                fetchTrendingContent();
              }}>Home</a></li>
              <li><a href="#" onClick={(e) => {
                e.preventDefault();
                getMoviesByCollection('popular', 'Popular Movies');
              }}>Popular Movies</a></li>
              <li><a href="#" onClick={(e) => {
                e.preventDefault();
                getTvShowsByCollection('popular', 'Popular TV Shows');
              }}>Popular TV Shows</a></li>
              <li><a href="#" onClick={(e) => {
                e.preventDefault();
                getMoviesByCollection('top_rated', 'Top Rated Movies');
              }}>Top Rated Movies</a></li>
              <li><a href="#" onClick={(e) => {
                e.preventDefault();
                getTvShowsByCollection('top_rated', 'Top Rated TV Shows');
              }}>Top Rated TV Shows</a></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h3>Contact Us</h3>
            <a href="mailto:somyadipghosh@gmail.com" className="contact-button">
              Send Email
            </a>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>© 2025 MoviesFlix • Built using TMDB API</p>
          <p>All content data provided by <a href="https://www.themoviedb.org/" target="_blank" rel="noopener noreferrer">TMDB</a></p>
        </div>
      </footer>
    </div>
  )
}

export default App
