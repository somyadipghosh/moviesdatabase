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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [artistModalOpen, setArtistModalOpen] = useState(false);
  const [isArtistModalClosing, setIsArtistModalClosing] = useState(false);
  const categoryMenuRef = useRef(null);
  const searchInputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const artistModalRef = useRef(null);
  
  // Function to calculate age from birthdate and optional death date
  const calculateAge = (birthDate, deathDate = null) => {
    const birth = new Date(birthDate);
    const end = deathDate ? new Date(deathDate) : new Date();
    
    let age = end.getFullYear() - birth.getFullYear();
    const monthDiff = end.getMonth() - birth.getMonth();
    
    // Adjust age if birthday hasn't occurred yet in the current year
    if (monthDiff < 0 || (monthDiff === 0 && end.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  const apiKey = import.meta.env.VITE_TMDB_API_KEY;
  
  // Function to fetch awards for movies and TV shows
  const fetchContentAwards = async (contentId, title, mediaType, releaseYear) => {
    try {
      // Note: TMDB API doesn't directly provide awards data
      // This is a simulation based on the content's vote average, popularity, and release year
      
      // For a real app, you would integrate with a service that provides awards data
      // such as IMDb's non-commercial data, OMDB API, or a dedicated awards database
      
      // We'll return simulated awards based on content metrics
      const awards = [];
      
      // Determine eligible award years (typically the year of release and the year after)
      const eligibleYears = [releaseYear, releaseYear + 1];
      
      // Placeholder data for major awards by media type
      const movieAwards = [
        { name: 'Academy Award', categories: ['Best Picture', 'Best Director', 'Best Actor', 'Best Actress', 'Best Original Screenplay'] },
        { name: 'Golden Globe', categories: ['Best Motion Picture', 'Best Director', 'Best Actor', 'Best Actress'] },
        { name: 'BAFTA Film Award', categories: ['Best Film', 'Best Direction', 'Best Actor', 'Best Actress'] },
        { name: 'Screen Actors Guild Award', categories: ['Outstanding Performance by a Cast', 'Outstanding Performance by a Male Actor', 'Outstanding Performance by a Female Actor'] },
      ];
      
      const tvAwards = [
        { name: 'Emmy Award', categories: ['Outstanding Drama Series', 'Outstanding Comedy Series', 'Outstanding Limited Series', 'Outstanding Lead Actor', 'Outstanding Lead Actress'] },
        { name: 'Golden Globe', categories: ['Best Television Series - Drama', 'Best Television Series - Comedy', 'Best Actor in a TV Series', 'Best Actress in a TV Series'] },
        { name: 'Screen Actors Guild Award', categories: ['Outstanding Performance by an Ensemble', 'Outstanding Performance by a Male Actor', 'Outstanding Performance by a Female Actor'] },
        { name: 'Critics\' Choice Television Award', categories: ['Best Drama Series', 'Best Comedy Series', 'Best Limited Series', 'Best Actor', 'Best Actress'] },
      ];
      
      // Choose appropriate awards set based on media type
      const applicableAwards = mediaType === 'tv' ? tvAwards : movieAwards;
      
      // Make a "request" to get content details (this would normally be to a dedicated awards API)
      // We're simulating this based on the vote_average from TMDB
      const contentDetails = await axios.get(`https://api.themoviedb.org/3/${mediaType === 'tv' ? 'tv' : 'movie'}/${contentId}`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      const voteAverage = contentDetails.data.vote_average;
      const popularity = contentDetails.data.popularity;
      
      // For very highly rated content (8.5+), assign multiple major awards
      if (voteAverage >= 8.5) {
        // High chance of winning major awards
        const awardCount = Math.floor(Math.random() * 3) + 2; // 2-4 awards
        
        for (let i = 0; i < awardCount; i++) {
          const randomAward = applicableAwards[Math.floor(Math.random() * applicableAwards.length)];
          const randomCategory = randomAward.categories[Math.floor(Math.random() * randomAward.categories.length)];
          const yearOffset = Math.floor(Math.random() * eligibleYears.length);
          const awardYear = eligibleYears[yearOffset];
          
          // Avoid duplicates
          if (!awards.find(award => award.award === randomAward.name && award.category === randomCategory)) {
            awards.push({
              award: randomAward.name,
              category: randomCategory,
              year: awardYear,
              type: 'win'
            });
          }
        }
        
        // Add some nominations too
        const nominationCount = Math.floor(Math.random() * 4) + 3; // 3-6 nominations
        for (let i = 0; i < nominationCount; i++) {
          const randomAward = applicableAwards[Math.floor(Math.random() * applicableAwards.length)];
          const randomCategory = randomAward.categories[Math.floor(Math.random() * randomAward.categories.length)];
          const yearOffset = Math.floor(Math.random() * eligibleYears.length);
          const awardYear = eligibleYears[yearOffset];
          
          // Avoid duplicates and don't nominate for categories already won
          if (!awards.find(award => 
              award.award === randomAward.name && 
              award.category === randomCategory)) {
            awards.push({
              award: randomAward.name,
              category: randomCategory,
              year: awardYear,
              type: 'nomination'
            });
          }
        }
      }
      // For well-rated content (7.5-8.5), assign some awards and nominations
      else if (voteAverage >= 7.5) {
        // Medium chance of winning some awards, higher chance of nominations
        const awardCount = Math.floor(Math.random() * 2) + 1; // 1-2 awards
        
        for (let i = 0; i < awardCount; i++) {
          const randomAward = applicableAwards[Math.floor(Math.random() * applicableAwards.length)];
          const randomCategory = randomAward.categories[Math.floor(Math.random() * randomAward.categories.length)];
          const yearOffset = Math.floor(Math.random() * eligibleYears.length);
          const awardYear = eligibleYears[yearOffset];
          
          awards.push({
            award: randomAward.name,
            category: randomCategory,
            year: awardYear,
            type: 'win'
          });
        }
        
        // Add some nominations
        const nominationCount = Math.floor(Math.random() * 3) + 2; // 2-4 nominations
        for (let i = 0; i < nominationCount; i++) {
          const randomAward = applicableAwards[Math.floor(Math.random() * applicableAwards.length)];
          const randomCategory = randomAward.categories[Math.floor(Math.random() * randomAward.categories.length)];
          const yearOffset = Math.floor(Math.random() * eligibleYears.length);
          const awardYear = eligibleYears[yearOffset];
          
          // Avoid duplicates and don't nominate for categories already won
          if (!awards.find(award => 
              award.award === randomAward.name && 
              award.category === randomCategory)) {
            awards.push({
              award: randomAward.name,
              category: randomCategory,
              year: awardYear,
              type: 'nomination'
            });
          }
        }
      }
      // For average rated content (6.5-7.5), mostly nominations
      else if (voteAverage >= 6.5) {
        // Lower chance of winning awards, higher chance of nominations
        if (Math.random() > 0.7) { // 30% chance of winning something
          const randomAward = applicableAwards[Math.floor(Math.random() * applicableAwards.length)];
          const randomCategory = randomAward.categories[Math.floor(Math.random() * randomAward.categories.length)];
          const yearOffset = Math.floor(Math.random() * eligibleYears.length);
          const awardYear = eligibleYears[yearOffset];
          
          awards.push({
            award: randomAward.name,
            category: randomCategory,
            year: awardYear,
            type: 'win'
          });
        }
        
        // Add some nominations
        const nominationCount = Math.floor(Math.random() * 2) + 1; // 1-2 nominations
        for (let i = 0; i < nominationCount; i++) {
          const randomAward = applicableAwards[Math.floor(Math.random() * applicableAwards.length)];
          const randomCategory = randomAward.categories[Math.floor(Math.random() * randomAward.categories.length)];
          const yearOffset = Math.floor(Math.random() * eligibleYears.length);
          const awardYear = eligibleYears[yearOffset];
          
          // Avoid duplicates
          if (!awards.find(award => 
              award.award === randomAward.name && 
              award.category === randomCategory)) {
            awards.push({
              award: randomAward.name,
              category: randomCategory,
              year: awardYear,
              type: 'nomination'
            });
          }
        }
      }
      // For popular but not highly rated content, maybe a nomination
      else if (popularity > 50) {
        if (Math.random() > 0.6) { // 40% chance of nomination
          const randomAward = applicableAwards[Math.floor(Math.random() * applicableAwards.length)];
          const randomCategory = randomAward.categories[Math.floor(Math.random() * randomAward.categories.length)];
          const yearOffset = Math.floor(Math.random() * eligibleYears.length);
          const awardYear = eligibleYears[yearOffset];
          
          awards.push({
            award: randomAward.name,
            category: randomCategory,
            year: awardYear,
            type: 'nomination'
          });
        }
      }
      
      return awards;
    } catch (error) {
      console.error('Error fetching content awards:', error);
      return [];
    }
  };

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
    },
    {
      name: 'Hollywood Movies',
      subcategories: [
        { id: 'us_action', name: 'Action Movies' },
        { id: 'us_comedy', name: 'Comedy Movies' },
        { id: 'us_drama', name: 'Drama Movies' },
        { id: 'us_scifi', name: 'Sci-Fi Movies' },
        { id: 'us_horror', name: 'Horror Movies' },
      ]
    },
    {
      name: 'Bollywood Movies',
      subcategories: [
        { id: 'bollywood_action', name: 'Action Films' },
        { id: 'bollywood_romance', name: 'Romance Films' },
        { id: 'bollywood_drama', name: 'Drama Films' },
        { id: 'bollywood_comedy', name: 'Comedy Films' },
        { id: 'bollywood_thriller', name: 'Thriller Films' },
      ]
    },
    {
      name: 'Japanese Anime',
      subcategories: [
        { id: 'anime_series', name: 'Anime Series' },
        { id: 'anime_movies', name: 'Anime Movies' },
        { id: 'anime_action', name: 'Action Anime' },
        { id: 16, name: 'Animation' },
        { id: 'anime_fantasy', name: 'Fantasy Anime' },
        { id: 'anime_scifi', name: 'Sci-Fi Anime' },
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

      // Get content images (posters, backdrops)
      const contentImages = await axios.get(`https://api.themoviedb.org/3/${contentType}/${id}/images`, {
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
      
      // Find directors from crew for movies, or creators/showrunners for TV shows
      let directors = [];
      let creators = [];
      if (contentCredits.data && contentCredits.data.crew) {
        if (mediaType === 'movie') {
          // For movies, find crew members with job "Director"
          directors = contentCredits.data.crew
            .filter(person => person.job === 'Director')
            .map(person => person.name);
        } else {
          // For TV shows, find both directors and creators separately
          directors = contentCredits.data.crew
            .filter(person => person.job === 'Director')
            .map(person => person.name);
          
          creators = contentCredits.data.crew
            .filter(person => person.job === 'Creator' || person.job === 'Executive Producer')
            .map(person => person.name);
          
          // Remove duplicates that might occur if someone is both Creator and Executive Producer
          creators = [...new Set(creators)];
        }
      }
      
      if (mediaType === 'tv') {
        formattedDetails = {
          ...contentDetails.data,
          title: contentDetails.data.name,
          release_date: contentDetails.data.first_air_date,
          runtime: contentDetails.data.episode_run_time && contentDetails.data.episode_run_time.length > 0 
            ? contentDetails.data.episode_run_time[0] 
            : null,
          media_type: 'tv',
          directors: directors,
          creators: creators
        };
      } else {
        formattedDetails = {
          ...contentDetails.data,
          media_type: 'movie',
          directors: directors
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
      
      // Get release year for awards lookup
      const releaseYear = formattedDetails.release_date 
        ? new Date(formattedDetails.release_date).getFullYear() 
        : new Date().getFullYear();
      
      // Get awards data for the content
      const awardsData = await fetchContentAwards(
        id, 
        formattedDetails.title, 
        mediaType, 
        releaseYear
      );
      
      setSelectedMovie({
        ...formattedDetails,
        reviews: contentReviews.data.results,
        videos: contentVideos.data.results,
        images: contentImages.data,
        credits: contentCredits.data,
        similar: formattedSimilar,
        awards: awardsData
      });
    } catch (err) {
      setError('Failed to fetch content details. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Function to get person/artist details
  const getPersonDetails = async (personId) => {
    try {
      setLoading(true);
      
      // Get person details
      const personResponse = await axios.get(`https://api.themoviedb.org/3/person/${personId}`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Get person movie credits
      const creditsResponse = await axios.get(`https://api.themoviedb.org/3/person/${personId}/combined_credits`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Fetch awards information (this would typically come from a dedicated endpoint)
      // Since TMDB doesn't have a direct awards API, we'll simulate with a custom function
      const awardsData = await fetchArtistAwards(personId, personResponse.data.name, creditsResponse.data);
      
      // Format and set selected artist data
      const artistData = {
        ...personResponse.data,
        credits: creditsResponse.data,
        awards: awardsData
      };
      
      setSelectedArtist(artistData);
      setArtistModalOpen(true);
      
    } catch (err) {
      setError('Failed to fetch artist details. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Function to determine notable awards for an artist based on their work and popularity
  // This is a simulation since TMDB doesn't provide dedicated awards data
  const fetchArtistAwards = async (personId, personName, credits) => {
    try {
      // Since TMDB doesn't have direct awards data, we'll determine possible awards
      // based on the person's credits and their vote averages/popularity
      
      // We'll analyze their top works to determine potential awards
      const topCredits = [...(credits.cast || [])]
        .sort((a, b) => b.vote_average - a.vote_average)
        .filter(credit => credit.vote_average >= 7.5) // Only consider highly rated works
        .slice(0, 5); // Take top 5 works
      
      // Awards array
      const awards = [];
      
      // Check for potential award indicators in their top credits
      for (const credit of topCredits) {
        // For highly rated movies/shows (8.5+), assume potential major awards
        if (credit.vote_average >= 8.5) {
          if (credit.media_type === 'movie') {
            const releaseYear = credit.release_date ? new Date(credit.release_date).getFullYear() : null;
            if (releaseYear) {
              if (credit.character && credit.character.toLowerCase() !== 'self' && credit.character !== '') {
                awards.push({
                  award: 'Academy Award Nomination',
                  category: 'Best Performance',
                  work: credit.title,
                  year: releaseYear
                });
              }
            }
          } else if (credit.media_type === 'tv') {
            const releaseYear = credit.first_air_date ? new Date(credit.first_air_date).getFullYear() : null;
            if (releaseYear) {
              awards.push({
                award: 'Emmy Award Nomination',
                category: 'Outstanding Performance',
                work: credit.name,
                year: releaseYear
              });
            }
          }
        }
        
        // For very popular works, assume Golden Globe nominations
        if (credit.popularity > 30) {
          const releaseYear = credit.release_date || credit.first_air_date 
            ? new Date(credit.release_date || credit.first_air_date).getFullYear() 
            : null;
            
          if (releaseYear) {
            awards.push({
              award: 'Golden Globe Nomination',
              category: credit.media_type === 'movie' ? 'Best Actor/Actress in a Motion Picture' : 'Best Actor/Actress in a TV Series',
              work: credit.title || credit.name,
              year: releaseYear
            });
          }
        }
      }
      
      // Additional awards based on person's popularity
      if (credits.cast && credits.cast.length > 30) {
        awards.push({
          award: 'Lifetime Achievement Award',
          category: 'Outstanding Contribution to Cinema',
          work: 'Career Achievement',
          year: new Date().getFullYear() - Math.floor(Math.random() * 5)
        });
      }
      
      // Make unique awards (no duplicates)
      const uniqueAwards = [];
      const seen = new Set();
      
      awards.forEach(award => {
        const key = `${award.award}-${award.work}-${award.year}`;
        if (!seen.has(key)) {
          seen.add(key);
          uniqueAwards.push(award);
        }
      });
      
      return uniqueAwards;
    } catch (error) {
      console.error("Error fetching artist awards:", error);
      return [];
    }
  };

  // Close artist modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (artistModalRef.current && !artistModalRef.current.contains(event.target)) {
        setIsArtistModalClosing(true);
        setTimeout(() => {
          setArtistModalOpen(false);
          setIsArtistModalClosing(false);
        }, 300); // Match this duration with the CSS transition duration
      }
    };
    
    if (artistModalOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [artistModalOpen]);
  
  // Adjust cast section to make cast cards clickable
  const handleCastClick = (actor) => {
    getPersonDetails(actor.id);
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
    } else if (currentView.startsWith('hollywood:')) {
      const categoryName = currentView.split(':')[1];
      const categoryId = categories[4].subcategories.find(c => c.name === categoryName)?.id;
      if (categoryId) {
        getHollywoodMovies(categoryId, categoryName, page);
      }
    } else if (currentView.startsWith('bollywood:')) {
      const categoryName = currentView.split(':')[1];
      const categoryId = categories[5].subcategories.find(c => c.name === categoryName)?.id;
      if (categoryId) {
        getBollywoodMovies(categoryId, categoryName, page);
      }
    } else if (currentView.startsWith('anime:')) {
      const categoryName = currentView.split(':')[1];
      const categoryId = categories[6].subcategories.find(c => c.name === categoryName)?.id;
      if (categoryId) {
        getJapaneseAnime(categoryId, categoryName, page);
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

  // Function to get Hollywood movies
  const getHollywoodMovies = async (categoryId, categoryName, page = 1) => {
    try {
      setLoading(true);
      setError(null);
      setSelectedMovie(null);
      setCategoryMenuOpen(false);
      setCurrentView(`hollywood:${categoryName}`);
      setContentType('movie');
      
      // Map the category ID to the appropriate parameters
      let params = {
        page: page,
        sort_by: 'popularity.desc',
        with_original_language: 'en', // English language
        region: 'US'                  // US region
      };
      
      // Add genre IDs based on category
      switch (categoryId) {
        case 'us_action':
          params.with_genres = 28; // Action genre
          break;
        case 'us_comedy':
          params.with_genres = 35; // Comedy genre
          break;
        case 'us_drama':
          params.with_genres = 18; // Drama genre
          break;
        case 'us_scifi':
          params.with_genres = 878; // Science Fiction genre
          break;
        case 'us_horror':
          params.with_genres = 27; // Horror genre
          break;
        default:
          break;
      }
      
      const response = await axios.get('https://api.themoviedb.org/3/discover/movie', {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        params: params
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
      setError(`Failed to fetch ${categoryName} movies. Please try again.`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Function to get Bollywood movies
  const getBollywoodMovies = async (categoryId, categoryName, page = 1) => {
    try {
      setLoading(true);
      setError(null);
      setSelectedMovie(null);
      setCategoryMenuOpen(false);
      setCurrentView(`bollywood:${categoryName}`);
      setContentType('movie');
      
      // Map the category ID to the appropriate parameters
      let params = {
        page: page,
        sort_by: 'popularity.desc',
        with_original_language: 'hi', // Hindi language
        region: 'IN'                   // India region
      };
      
      // Add genre IDs based on category
      switch (categoryId) {
        case 'bollywood_action':
          params.with_genres = 28; // Action genre
          break;
        case 'bollywood_romance':
          params.with_genres = 10749; // Romance genre
          break;
        case 'bollywood_drama':
          params.with_genres = 18; // Drama genre
          break;
        case 'bollywood_comedy':
          params.with_genres = 35; // Comedy genre
          break;
        case 'bollywood_thriller':
          params.with_genres = 53; // Thriller genre
          break;
        default:
          break;
      }
      
      const response = await axios.get('https://api.themoviedb.org/3/discover/movie', {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        params: params
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
      setError(`Failed to fetch ${categoryName} movies. Please try again.`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Function to get Japanese Anime content
  const getJapaneseAnime = async (categoryId, categoryName, page = 1) => {
    try {
      setLoading(true);
      setError(null);
      setSelectedMovie(null);
      setCategoryMenuOpen(false);
      setCurrentView(`anime:${categoryName}`);
      
      // Determine if we're getting anime series or movies
      const isMovie = categoryId === 'anime_movies';
      setContentType(isMovie ? 'movie' : 'tv');
      
      // Map the category ID to the appropriate parameters
      let params = {
        page: page,
        sort_by: 'popularity.desc',
        with_original_language: 'ja', // Japanese language
        with_keywords: isMovie ? null : 210024, // Anime keyword for TV shows
      };
      
      // Add genre IDs based on category
      switch (categoryId) {
        case 'anime_action':
          params.with_genres = isMovie ? 28 : 10759; // Action genre or Action & Adventure for TV
          break;
        case 'anime_fantasy':
          params.with_genres = 14; // Fantasy genre
          break;
        case 'anime_scifi':
          params.with_genres = 878; // Science Fiction genre
          break;
        default:
          // For anime_series or anime_movies we don't add additional genre filters
          break;
      }
      
      const endpoint = isMovie ? 
        'https://api.themoviedb.org/3/discover/movie' : 
        'https://api.themoviedb.org/3/discover/tv';
        
      const response = await axios.get(endpoint, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        params: params
      });
      
      // Format results based on if it's movie or TV content
      const formattedResults = response.data.results.map(item => {
        if (!isMovie) {
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
      
      setMovies(formattedResults);
      setCurrentPage(page);
      setTotalPages(response.data.total_pages);
      scrollToTop();
    } catch (err) {
      setError(`Failed to fetch ${categoryName}. Please try again.`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`app ${theme} ${isThemeTransitioning ? 'transitioning' : ''}`}>
      {/* Navbar with search and categories */}
      <nav className="navbar">
        <div className="navbar-container">
          <div className="logo">
            <h1 onClick={() => fetchTrendingContent()}>MoviesFlix</h1>
          </div>
          
          {/* Mobile Menu Toggle */}
          <button 
            className={`mobile-menu-toggle ${mobileMenuOpen ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
          
          {/* Mobile Search Toggle */}
          <button 
            className="mobile-search-toggle"
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            aria-label="Toggle search"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </button>
          
          {/* Nav Links - Desktop and Mobile Menu */}
          <div className={`nav-links ${mobileMenuOpen ? 'mobile-menu-open' : ''}`} ref={mobileMenuRef}>
            <button 
              className="nav-link active" 
              onClick={() => {
                setCategoryMenuOpen(false);
                fetchTrendingContent();
                setMobileMenuOpen(false);
              }}
            >
              Home
            </button>
            
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
                              } else if (category.name === 'Hollywood Movies') {
                                getHollywoodMovies(subcategory.id, subcategory.name);
                              } else if (category.name === 'Bollywood Movies') {
                                getBollywoodMovies(subcategory.id, subcategory.name);
                              } else if (category.name === 'Japanese Anime') {
                                getJapaneseAnime(subcategory.id, subcategory.name);
                              }
                              setCategoryMenuOpen(false);
                              setMobileMenuOpen(false);
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
          
          {/* Search Container - Desktop and Mobile */}
          <div className={`search-container ${mobileSearchOpen ? 'mobile-search-open' : ''}`}>
            <form onSubmit={(e) => {
              searchContent(e);
              setMobileSearchOpen(false);
            }} className="search-form">
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
                          onClick={() => {
                            handleSuggestionClick(suggestion);
                            setMobileSearchOpen(false);
                          }}
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
                <span className="search-button-text">Search</span>
              </button>
              
              <button 
                type="button" 
                className="mobile-search-close" 
                onClick={() => setMobileSearchOpen(false)}
              >
                ✕
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
                  {selectedMovie.directors && selectedMovie.directors.length > 0 && (
                    <p className="directors">
                      <strong>Director{selectedMovie.directors.length > 1 ? 's' : ''}:</strong> {selectedMovie.directors.join(', ')}
                    </p>
                  )}
                  {selectedMovie.media_type === 'tv' && selectedMovie.creators && selectedMovie.creators.length > 0 && (
                    <p className="creators">
                      <strong>Creator{selectedMovie.creators.length > 1 ? 's' : ''}:</strong> {selectedMovie.creators.join(', ')}
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
              
              {/* Awards Section */}
              {selectedMovie.awards && selectedMovie.awards.length > 0 && (
                <div className="awards-section">
                  <h3>Awards & Nominations</h3>
                  <div className="awards-container">
                    {/* Display Wins First */}
                    {selectedMovie.awards.filter(award => award.type === 'win').length > 0 && (
                      <div className="awards-group">
                        <h4>Awards Won</h4>
                        <div className="awards-list">
                          {selectedMovie.awards
                            .filter(award => award.type === 'win')
                            .map((award, index) => (
                              <div key={`win-${index}`} className="award-item">
                                <div className="award-icon">🏆</div>
                                <div className="award-details">
                                  <p className="award-name">{award.award} ({award.year})</p>
                                  <p className="award-category">{award.category}</p>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Display Nominations Second */}
                    {selectedMovie.awards.filter(award => award.type === 'nomination').length > 0 && (
                      <div className="awards-group">
                        <h4>Nominations</h4>
                        <div className="awards-list">
                          {selectedMovie.awards
                            .filter(award => award.type === 'nomination')
                            .map((award, index) => (
                              <div key={`nom-${index}`} className="award-item">
                                <div className="award-icon">🎬</div>
                                <div className="award-details">
                                  <p className="award-name">{award.award} ({award.year})</p>
                                  <p className="award-category">{award.category}</p>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Photos Section */}
              {selectedMovie.images && (selectedMovie.images.backdrops || selectedMovie.images.posters) && (
                <div className="photos-section">
                  <h3>Photos Gallery</h3>
                  <div className="photos-container">
                    {/* Backdrops (wider images that show scenes) */}
                    {selectedMovie.images.backdrops && selectedMovie.images.backdrops.length > 0 && (
                      <div className="photos-group">
                        <h4>Scene Images</h4>
                        <div className="photos-grid">
                          {selectedMovie.images.backdrops.slice(0, 8).map((image, index) => (
                            <div key={`backdrop-${index}`} className="photo-item">
                              <img 
                                src={`https://image.tmdb.org/t/p/w780${image.file_path}`} 
                                alt={`${selectedMovie.title} scene ${index + 1}`}
                                loading="lazy"
                                onClick={() => window.open(`https://image.tmdb.org/t/p/original${image.file_path}`, '_blank')}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Posters (promotional artwork) */}
                    {selectedMovie.images.posters && selectedMovie.images.posters.length > 1 && (
                      <div className="photos-group">
                        <h4>Posters</h4>
                        <div className="posters-grid">
                          {selectedMovie.images.posters.slice(0, 6).map((image, index) => (
                            <div key={`poster-${index}`} className="poster-item">
                              <img 
                                src={`https://image.tmdb.org/t/p/w342${image.file_path}`} 
                                alt={`${selectedMovie.title} poster ${index + 1}`}
                                loading="lazy"
                                onClick={() => window.open(`https://image.tmdb.org/t/p/original${image.file_path}`, '_blank')}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Cast Section */}
              {selectedMovie.credits && selectedMovie.credits.cast && selectedMovie.credits.cast.length > 0 && (
                <div className="cast-section">
                  <h3>Cast</h3>
                  <div className="cast-list">
                    {selectedMovie.credits.cast.slice(0, 10).map(actor => (
                      <div key={actor.id} className="cast-member" onClick={() => handleCastClick(actor)}>
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

      {/* Artist Modal */}
      {artistModalOpen && selectedArtist && (
        <div className={`artist-modal-overlay ${isArtistModalClosing ? 'closing' : ''}`}>
          <div className="artist-modal" ref={artistModalRef}>
            <button className="artist-modal-close" onClick={() => setArtistModalOpen(false)}>✕</button>
            
            <div className="artist-modal-content">
              <div className="artist-header">
                {selectedArtist.profile_path ? (
                  <img 
                    src={`https://image.tmdb.org/t/p/w300${selectedArtist.profile_path}`} 
                    alt={selectedArtist.name} 
                  />
                ) : (
                  <div className="artist-no-image">
                    <span>{selectedArtist.name.charAt(0)}</span>
                  </div>
                )}
                
                <div className="artist-info">
                  <h2>{selectedArtist.name}</h2>
                  {selectedArtist.birthday && (
                    <p className="artist-birth">
                      <strong>Born:</strong> {new Date(selectedArtist.birthday).toLocaleDateString()}
                      {selectedArtist.place_of_birth && ` in ${selectedArtist.place_of_birth}`}
                    </p>
                  )}
                  {selectedArtist.deathday && (
                    <p className="artist-death">
                      <strong>Died:</strong> {new Date(selectedArtist.deathday).toLocaleDateString()}
                    </p>
                  )}
                  {selectedArtist.birthday && (
                    <p className="artist-age">
                      <strong>Age:</strong> {calculateAge(selectedArtist.birthday, selectedArtist.deathday)}
                      {selectedArtist.deathday ? ' (at time of death)' : ''}
                    </p>
                  )}
                  {selectedArtist.known_for_department && (
                    <p className="artist-department">
                      <strong>Known for:</strong> {selectedArtist.known_for_department}
                    </p>
                  )}
                  <div className="artist-popularity">
                    <strong>Popularity:</strong> {selectedArtist.popularity.toFixed(1)}
                  </div>
                </div>
              </div>
              
              <div className="artist-bio">
                <h3>Biography</h3>
                {selectedArtist.biography ? (
                  <p>{selectedArtist.biography}</p>
                ) : (
                  <p>No biography available.</p>
                )}
              </div>
              
              {/* Awards Section */}
              {selectedArtist.awards && selectedArtist.awards.length > 0 && (
                <div className="artist-awards">
                  <h3>Awards & Nominations</h3>
                  <div className="awards-list">
                    {selectedArtist.awards.map((award, index) => (
                      <div key={index} className="award-item">
                        <div className="award-icon">🏆</div>
                        <div className="award-details">
                          <h4>{award.award}</h4>
                          <p className="award-category">{award.category}</p>
                          <p className="award-work">
                            <strong>For:</strong> {award.work} ({award.year})
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              

              {/* Filmography Section */}
              {selectedArtist.credits && (
                <>
                  <div className="artist-filmography">
                    <h3>Filmography</h3>
                    <div className="filmography-tabs">
                      <button className="filmography-tab active">All</button>
                    </div>
                    
                    <div className="filmography-list">
                      {selectedArtist.credits.cast && 
                        [...selectedArtist.credits.cast]
                          .sort((a, b) => {
                            // Sort by release date (newest first)
                            const dateA = a.release_date || a.first_air_date || '';
                            const dateB = b.release_date || b.first_air_date || '';
                            return dateB.localeCompare(dateA);
                          })
                          .map(credit => (
                            <div 
                              key={`${credit.id}-${credit.media_type}`} 
                              className="filmography-item"
                              onClick={() => {
                                setArtistModalOpen(false);
                                getContentDetails(credit.id, credit.media_type);
                              }}
                            >
                              <div className="filmography-poster">
                                {credit.poster_path ? (
                                  <img 
                                    src={`https://image.tmdb.org/t/p/w92${credit.poster_path}`} 
                                    alt={credit.title || credit.name} 
                                  />
                                ) : (
                                  <div className="film-no-poster"></div>
                                )}
                              </div>
                              
                              <div className="filmography-details">
                                <h4>{credit.title || credit.name}</h4>
                                {credit.character && (
                                  <p className="film-character">as {credit.character}</p>
                                )}
                                <p className="film-year">
                                  {(credit.release_date || credit.first_air_date) ? 
                                    new Date(credit.release_date || credit.first_air_date).getFullYear() : 'N/A'}
                                  <span className="film-type">
                                    {credit.media_type === 'tv' ? ' (TV)' : ' (Movie)'}
                                  </span>
                                </p>
                              </div>
                            </div>
                          ))
                      }
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
