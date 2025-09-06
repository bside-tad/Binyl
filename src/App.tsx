import React, { useState, useMemo, useRef, useEffect } from 'react';
import UsernameForm from './components/UsernameForm';
import SearchBar from './components/SearchBar';
import RecordCard from './components/RecordCard';
import { fetchUserCollection } from './services/discogsApi';
import { Record } from './types';
import html2canvas from 'html2canvas';

const App: React.FC = () => {
  const [username, setUsername] = useState<string>('');
  const [records, setRecords] = useState<Record[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<'artist' | 'plays' | 'no-plays' | 'rating'>('artist');
  const [playCounts, setPlayCounts] = useState<{[key: string]: number}>({});
  const [ratings, setRatings] = useState<{[key: string]: number}>({});
  const [notes, setNotes] = useState<{[key: string]: string}>({});
  const exportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [imageDataUrls, setImageDataUrls] = useState<{[key: string]: string}>({});
  const [gridOverlayId, setGridOverlayId] = useState<number | null>(null);
  const [genreFilter, setGenreFilter] = useState<string>('All Genres');
  const [showFullscreenScreensaver, setShowFullscreenScreensaver] = useState(false);
  const [screensaverAlbums, setScreensaverAlbums] = useState<Array<{
    id: number;
    x: number;
    y: number;
    rotation: number;
    scale: number;
    speed: number;
  }>>([]);
  const [rightScreensaverAlbums, setRightScreensaverAlbums] = useState<Array<{
    id: number;
    x: number;
    y: number;
    rotation: number;
    scale: number;
    speed: number;
  }>>([]);
  const [fullscreenScreensaverAlbums, setFullscreenScreensaverAlbums] = useState<Array<{
    id: number;
    x: number;
    y: number;
    rotation: number;
    scale: number;
    speed: number;
    sparkles: Array<{ x: number; y: number; opacity: number; size: number }>;
  }>>([]);
  const [usedAlbumIds, setUsedAlbumIds] = useState<Set<number>>(new Set());
  const [leftUsedIds, setLeftUsedIds] = useState<Set<number>>(new Set());
  const [rightUsedIds, setRightUsedIds] = useState<Set<number>>(new Set());

  // Left side screensaver animation
  useEffect(() => {
    if (records.length === 0) return;

    const createLeftScreensaverAlbum = () => {
      // Get available records (not currently used on left side)
      const availableRecords = records.filter(record => !leftUsedIds.has(record.id));
      if (availableRecords.length === 0) {
        // If all records are used, reset the used set
        setLeftUsedIds(new Set());
        return records[Math.floor(Math.random() * records.length)];
      }
      
      const randomRecord = availableRecords[Math.floor(Math.random() * availableRecords.length)];
      setLeftUsedIds(prev => new Set([...prev, randomRecord.id]));
      
      return {
        id: randomRecord.id,
        x: Math.random() * 150, // Reduced from 200 to 150 to avoid cropping
        y: -100, // Start above viewport
        rotation: (Math.random() - 0.5) * 60, // Random rotation between -30 and 30 degrees
        scale: 0.3 + Math.random() * 0.4, // Scale between 0.3 and 0.7
        speed: 0.8 + Math.random() * 1.2, // Slower speed: between 0.8 and 2.0
      };
    };

    const animateLeftScreensaver = () => {
      setScreensaverAlbums(prev => {
        // Remove used IDs from current albums when they fall off screen
        const updated = prev.map(album => ({
          ...album,
          y: album.y + album.speed,
        })).filter(album => {
          const isOffScreen = album.y > window.innerHeight + 100;
          if (isOffScreen) {
            setLeftUsedIds(prev => {
              const newSet = new Set(prev);
              newSet.delete(album.id);
              return newSet;
            });
          }
          return !isOffScreen;
        });

        // Add new albums more frequently
        if (Math.random() < 0.08 && updated.length < 12) {
          const newAlbum = createLeftScreensaverAlbum();
          if (newAlbum) {
            updated.push(newAlbum);
          }
        }

        return updated;
      });
    };

    const interval = setInterval(animateLeftScreensaver, 40); // Faster animation
    return () => clearInterval(interval);
  }, [records, leftUsedIds]);

  // Right side screensaver animation
  useEffect(() => {
    if (records.length === 0) return;

    const createRightScreensaverAlbum = () => {
      // Get available records (not currently used on right side)
      const availableRecords = records.filter(record => !rightUsedIds.has(record.id));
      if (availableRecords.length === 0) {
        // If all records are used, reset the used set
        setRightUsedIds(new Set());
        return records[Math.floor(Math.random() * records.length)];
      }
      
      const randomRecord = availableRecords[Math.floor(Math.random() * availableRecords.length)];
      setRightUsedIds(prev => new Set([...prev, randomRecord.id]));
      
      return {
        id: randomRecord.id,
        x: Math.random() * 150, // Reduced from 200 to 150 to avoid cropping
        y: -100, // Start above viewport
        rotation: (Math.random() - 0.5) * 60, // Random rotation between -30 and 30 degrees
        scale: 0.3 + Math.random() * 0.4, // Scale between 0.3 and 0.7
        speed: 0.8 + Math.random() * 1.2, // Slower speed: between 0.8 and 2.0
      };
    };

    const animateRightScreensaver = () => {
      setRightScreensaverAlbums(prev => {
        // Remove used IDs from current albums when they fall off screen
        const updated = prev.map(album => ({
          ...album,
          y: album.y + album.speed,
        })).filter(album => {
          const isOffScreen = album.y > window.innerHeight + 100;
          if (isOffScreen) {
            setRightUsedIds(prev => {
              const newSet = new Set(prev);
              newSet.delete(album.id);
              return newSet;
            });
          }
          return !isOffScreen;
        });

        // Add new albums more frequently
        if (Math.random() < 0.08 && updated.length < 12) {
          const newAlbum = createRightScreensaverAlbum();
          if (newAlbum) {
            updated.push(newAlbum);
          }
        }

        return updated;
      });
    };

    const interval = setInterval(animateRightScreensaver, 40); // Faster animation
    return () => clearInterval(interval);
  }, [records, rightUsedIds]);

  // Full-screen screensaver animation
  useEffect(() => {
    if (records.length === 0 || !showFullscreenScreensaver) return;

    const createFullscreenScreensaverAlbum = (currentUsedIds: Set<number>) => {
      // Get available records (not currently on screen)
      const availableRecords = records.filter(record => !currentUsedIds.has(record.id));
      if (availableRecords.length === 0) {
        // If all records are used, reset the used set
        setUsedAlbumIds(new Set());
        return null;
      }
      
      const randomRecord = availableRecords[Math.floor(Math.random() * availableRecords.length)];
      
      return {
        id: randomRecord.id,
        x: Math.random() * (window.innerWidth - 120), // Spread across full width, account for larger size
        y: -120, // Start above viewport
        rotation: (Math.random() - 0.5) * 60, // Random rotation between -30 and 30 degrees
        scale: 0.6 + Math.random() * 0.8, // Scale between 0.6 and 1.4 (larger)
        speed: 0.8 + Math.random() * 2.2, // Speed between 0.8 and 3.0
        sparkles: Array.from({ length: 4 + Math.floor(Math.random() * 6) }, () => ({
          x: Math.random() * 100 - 50,
          y: Math.random() * 100 - 50,
          opacity: Math.random(),
          size: 3 + Math.random() * 6
        }))
      };
    };

    const animateFullscreenScreensaver = () => {
      setFullscreenScreensaverAlbums(prev => {
        // Get currently used IDs from existing albums
        const currentUsedIds = new Set(prev.map(album => album.id));
        
        const updated = prev.map(album => ({
          ...album,
          y: album.y + album.speed,
          sparkles: album.sparkles.map(sparkle => ({
            ...sparkle,
            opacity: Math.max(0, sparkle.opacity - 0.015),
            x: sparkle.x + (Math.random() - 0.5) * 3,
            y: sparkle.y + (Math.random() - 0.5) * 3
          })).filter(sparkle => sparkle.opacity > 0)
        })).filter(album => {
          // Remove album when it goes off screen
          return album.y <= window.innerHeight + 100;
        });

        // Update used IDs set with current albums
        const newUsedIds = new Set(updated.map(album => album.id));
        setUsedAlbumIds(newUsedIds);

        // Add new albums more frequently for full-screen effect
        if (Math.random() < 0.08 && updated.length < 12) {
          const newAlbum = createFullscreenScreensaverAlbum(newUsedIds);
          if (newAlbum) {
            updated.push(newAlbum);
            // Add the new album's ID to the used set
            setUsedAlbumIds(prev => new Set([...prev, newAlbum.id]));
          }
        }

        return updated;
      });
    };

    const interval = setInterval(animateFullscreenScreensaver, 40);
    return () => clearInterval(interval);
  }, [records, showFullscreenScreensaver]);



  const handleUsernameSubmit = async (submittedUsername: string) => {
    setIsLoading(true);
    setError('');
    setUsername(submittedUsername);

    try {
      let userRecords = await fetchUserCollection(submittedUsername);
      // Sort records by artist name alphabetically
      userRecords = userRecords.sort((a, b) =>
        a.artist.localeCompare(b.artist, undefined, { sensitivity: 'base' })
      );
      setRecords(userRecords);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayCountUpdate = (recordId: number, newCount: number) => {
    setPlayCounts((prev: {[key: string]: number}) => ({
      ...prev,
      [recordId.toString()]: newCount
    }));
  };

  const handleRatingUpdate = (recordId: number, newRating: number) => {
    setRatings((prev: {[key: string]: number}) => ({
      ...prev,
      [recordId.toString()]: newRating
    }));
  };

  const handleNoteUpdate = (recordId: number, note: string) => {
    setNotes((prev: {[key: string]: string}) => ({
      ...prev,
      [recordId.toString()]: note
    }));
  };



  // Get all unique genres from records
  const allGenres = useMemo(() => {
    const genreSet = new Set<string>();
    records.forEach(record => {
      record.genres?.forEach(genre => genreSet.add(genre));
    });
    return Array.from(genreSet).sort();
  }, [records]);

  const filteredAndSortedRecords = useMemo(() => {
    let filtered = records;
    
    // Apply genre filter (includes both genres and styles)
    if (genreFilter !== 'All Genres') {
      filtered = filtered.filter(record => 
        record.genres?.includes(genreFilter) || 
        record.styles?.includes(genreFilter)
      );
    }
    // Apply search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(record =>
        record.artist.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply sorting
    if (sortBy === 'artist') {
      return filtered.sort((a, b) =>
        a.artist.localeCompare(b.artist, undefined, { sensitivity: 'base' })
      );
    } else if (sortBy === 'plays') {
      // Sort by actual play count (click count) - higher numbers first
      // Also filter out records with no play counts
      return filtered
        .filter(record => {
          const playCount = playCounts[record.id.toString()] || 0;
          return playCount > 0;
        })
        .sort((a, b) => {
          const aPlays = playCounts[a.id.toString()] || 0;
          const bPlays = playCounts[b.id.toString()] || 0;
          return bPlays - aPlays;
        });
    } else if (sortBy === 'rating') {
      // Sort by rating - descending order (highest to lowest)
      // Also filter out records with no ratings
      return filtered
        .filter(record => {
          const rating = ratings[record.id.toString()] || 0;
          return rating > 0;
        })
        .sort((a, b) => {
          const aRating = ratings[a.id.toString()] || 0;
          const bRating = ratings[b.id.toString()] || 0;
          return bRating - aRating; // Descending order
        });
    } else { // sortBy === 'no-plays'
      // Show only records with no play counts, sorted alphabetically
      return filtered
        .filter(record => {
          const playCount = playCounts[record.id.toString()] || 0;
          return playCount === 0;
        })
        .sort((a, b) =>
          a.artist.localeCompare(b.artist, undefined, { sensitivity: 'base' })
        );
    }
  }, [records, searchTerm, sortBy, playCounts, genreFilter]);

  const resetApp = () => {
    setUsername('');
    setRecords([]);
    setError('');
    setSearchTerm('');
    setSortBy('artist');
    setPlayCounts({});
    setRatings({});
    setNotes({});
  };

  // Helper to fetch image as data URL
  const fetchImageAsDataUrl = async (url: string) => {
    try {
      const response = await fetch(url, { mode: 'cors' });
      const blob = await response.blob();
      return await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    } catch {
      // Use a local placeholder image as a fallback
      return '/placeholder-album.jpg';
    }
  };

  const handleExportImage = async () => {
    setIsExporting(true);
    // Prefetch all images as data URLs for export
    const exportRecords = filteredAndSortedRecords;
    const newImageDataUrls: {[key: string]: string} = {};
    await Promise.all(exportRecords.map(async (record) => {
      const url = record.coverImage;
      if (url) {
        newImageDataUrls[record.id.toString()] = await fetchImageAsDataUrl(url);
      }
    }));
    setImageDataUrls(newImageDataUrls);
    // Wait for export mode to render overlays and data URLs
    setTimeout(async () => {
      if (exportRef.current) {
        const canvas = await html2canvas(exportRef.current, {
          width: 1080,
          height: 1920,
          windowWidth: 1080,
          windowHeight: 1920,
          backgroundColor: '#0a0a0a',
          scale: 2
        });
        const link = document.createElement('a');
        link.download = 'discogs-collection.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
      }
      setIsExporting(false);
      setImageDataUrls({});
    }, 200);
  };

  if (!username) {
    return (
      <div className="container">
        <div className="header">
          <h1>Discogs Collection Viewer</h1>
          <p>Discover and explore your vinyl collection</p>
        </div>
        <UsernameForm onSubmit={handleUsernameSubmit} isLoading={isLoading} />
        {error && <div className="error">{error}</div>}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading your collection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Fullscreen Screensaver UI */}
      {showFullscreenScreensaver ? (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 50%, #1e1e1e 100%)',
            zIndex: 5000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {/* Exit Button */}
          <button
            style={{
              position: 'fixed',
              top: 32,
              right: 32,
              background: 'rgba(255, 255, 255, 0.1)',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: 'pointer',
              zIndex: 5100,
              backdropFilter: 'blur(20px)',
              transition: 'all 0.2s ease',
            }}
            onClick={() => {
              setShowFullscreenScreensaver(false);
              setUsedAlbumIds(new Set());
              setFullscreenScreensaverAlbums([]);
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Exit Screensaver
          </button>
          
          {/* Title */}
          <div
            style={{
              position: 'fixed',
              top: 32,
              left: 32,
              color: '#ffffff',
              fontSize: '24px',
              fontWeight: '600',
              zIndex: 5100,
              textShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
            }}
          >
            {username}'s Collection Screensaver
          </div>
          
          {/* Full-screen Falling Albums */}
          {fullscreenScreensaverAlbums.map((album, index) => {
            const record = records.find(r => r.id === album.id);
            if (!record) return null;
            
            return (
              <div
                key={`fullscreen-${album.id}-${index}`}
                style={{
                  position: 'absolute',
                  left: album.x,
                  top: album.y,
                  transform: `rotate(${album.rotation}deg) scale(${album.scale})`,
                  transition: 'none',
                  zIndex: 2
                }}
              >
                <div
                  style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    boxShadow: '0 12px 32px rgba(0, 0, 0, 0.5)',
                    position: 'relative',
                    border: '2px solid rgba(255, 255, 255, 0.2)',
                    zIndex: 2
                  }}
                >
                  <img
                    src={record.coverImage || '/placeholder-album.jpg'}
                    alt={`${record.title} by ${record.artist}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjVGNUY1Ii8+Cjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSIjOTk5OTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Tm8gQ292ZXI8L3RleHQ+Cjwvc3ZnPg==';
                    }}
                  />
                  
                  {/* Enhanced Sparkle Trail */}
                  {album.sparkles.map((sparkle, sparkleIndex) => (
                    <div
                      key={sparkleIndex}
                      style={{
                        position: 'absolute',
                        left: `50%`,
                        top: `50%`,
                        transform: `translate(${sparkle.x}px, ${sparkle.y}px)`,
                        width: `${sparkle.size}px`,
                        height: `${sparkle.size}px`,
                        background: `radial-gradient(circle, rgba(255, 255, 255, ${sparkle.opacity}) 0%, rgba(255, 255, 255, 0) 70%)`,
                        borderRadius: '50%',
                        pointerEvents: 'none',
                        zIndex: 3,
                        animation: `sparkle-twinkle ${1 + Math.random() * 2}s ease-in-out infinite`,
                        animationDelay: `${Math.random() * 2}s`
                      }}
                    />
                  ))}
                  
                  {/* Blue Sparkles */}
                  {album.sparkles.map((sparkle, sparkleIndex) => (
                    <div
                      key={`blue-${sparkleIndex}`}
                      style={{
                        position: 'absolute',
                        left: `50%`,
                        top: `50%`,
                        transform: `translate(${sparkle.x + 30}px, ${sparkle.y + 30}px)`,
                        width: `${sparkle.size * 0.7}px`,
                        height: `${sparkle.size * 0.7}px`,
                        background: `radial-gradient(circle, rgba(0, 122, 255, ${sparkle.opacity * 0.8}) 0%, rgba(0, 122, 255, 0) 70%)`,
                        borderRadius: '50%',
                        pointerEvents: 'none',
                        zIndex: 3,
                        animation: `sparkle-twinkle ${1.5 + Math.random() * 1.5}s ease-in-out infinite`,
                        animationDelay: `${Math.random() * 1.5}s`
                      }}
                    />
                  ))}
                  
                  {/* Golden Sparkles */}
                  {Array.from({ length: 4 }).map((_, extraSparkleIndex) => (
                    <div
                      key={`gold-${extraSparkleIndex}`}
                      style={{
                        position: 'absolute',
                        left: `${15 + extraSparkleIndex * 20}%`,
                        top: `${15 + extraSparkleIndex * 15}%`,
                        width: `${4 + Math.random() * 5}px`,
                        height: `${4 + Math.random() * 5}px`,
                        background: `radial-gradient(circle, rgba(255, 215, 0, 0.9) 0%, rgba(255, 215, 0, 0) 70%)`,
                        borderRadius: '50%',
                        pointerEvents: 'none',
                        zIndex: 3,
                        animation: `sparkle-twinkle ${0.8 + Math.random() * 1.2}s ease-in-out infinite`,
                        animationDelay: `${Math.random() * 1}s`
                      }}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="header">
            <h1>{username}'s Collection</h1>
            <p>{records.length} albums in your collection</p>
          </div>

          {error && (
            <div className="error">
              {error}
            </div>
          )}

          {/* Search Bar - Full Width */}
          <div style={{ 
            width: '100%',
            marginBottom: '20px'
          }}>
            <SearchBar 
              searchTerm={searchTerm} 
              onSearchChange={setSearchTerm}
              onClear={() => setSearchTerm('')}
            />
          </div>

          {/* Sort Buttons */}
          <div style={{ 
            display: 'flex', 
            gap: '8px', 
            marginBottom: '20px',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={() => setSortBy('artist')}
              style={{
                padding: '8px 16px',
                background: sortBy === 'artist' ? '#007aff' : '#f2f2f7',
                color: sortBy === 'artist' ? '#ffffff' : '#1d1d1f',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s ease'
              }}
            >
              Artist
            </button>
            <button
              onClick={() => setSortBy('plays')}
              style={{
                padding: '8px 16px',
                background: sortBy === 'plays' ? '#007aff' : '#f2f2f7',
                color: sortBy === 'plays' ? '#ffffff' : '#1d1d1f',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s ease'
              }}
            >
              Most Played
            </button>
            <button
              onClick={() => setSortBy('no-plays')}
              style={{
                padding: '8px 16px',
                background: sortBy === 'no-plays' ? '#007aff' : '#f2f2f7',
                color: sortBy === 'no-plays' ? '#ffffff' : '#1d1d1f',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s ease'
              }}
            >
              Never Played
            </button>
            <button
              onClick={() => setSortBy('rating')}
              style={{
                padding: '8px 16px',
                background: sortBy === 'rating' ? '#007aff' : '#f2f2f7',
                color: sortBy === 'rating' ? '#ffffff' : '#1d1d1f',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s ease'
              }}
            >
              Highest Rated
            </button>
          </div>

          {/* Genre Filter and Action Buttons */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '20px',
            gap: '12px',
            flexWrap: 'wrap'
          }}>
            <select
              value={genreFilter}
              onChange={(e) => setGenreFilter(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #d1d1d6',
                background: '#ffffff',
                fontSize: '14px',
                cursor: 'pointer',
                minWidth: '150px'
              }}
            >
              <option value="All Genres">All Genres & Styles</option>
              {Array.from(new Set([
                ...records.flatMap(record => record.genres || []),
                ...records.flatMap(record => record.styles || [])
              ])).sort().map(genre => (
                <option key={genre} value={genre}>{genre}</option>
              ))}
            </select>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleExportImage}
                disabled={isExporting}
                style={{
                  padding: '8px 16px',
                  background: isExporting ? '#8e8e93' : '#34c759',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: isExporting ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s ease'
                }}
              >
                {isExporting ? 'Exporting...' : 'Export Collection'}
              </button>

              <button
                onClick={resetApp}
                style={{
                  padding: '8px 16px',
                  background: '#ff3b30',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s ease'
                }}
              >
                Reset
              </button>
            </div>
          </div>
          
          <div 
            ref={exportRef}
            style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
              gap: '20px',
              padding: '20px 0'
            }}
          >
            {filteredAndSortedRecords.map((record) => (
              <RecordCard 
                key={record.id} 
                record={record}
                imageDataUrl={imageDataUrls[record.id]}
                onImageLoad={(id, dataUrl) => setImageDataUrls(prev => ({ ...prev, [id]: dataUrl }))}
              />
            ))}
          </div>
          
          {filteredAndSortedRecords.length === 0 && (
            <div style={{ 
              textAlign: 'center', 
              color: '#8e8e93', 
              fontSize: '18px',
              marginTop: '40px'
            }}>
              {searchTerm ? 'No albums found matching your search.' : 'No albums found for the selected genre.'}
            </div>
          )}
        </>
      )}

      
      {/* Floating Action Buttons */}
      {records.length > 0 && (
        <>
          
          {/* Full-screen Screensaver Button */}
          <button
            style={{
              position: 'fixed',
              top: 24,
              right: 24,
              zIndex: 3000,
              background: '#34c759',
              color: '#ffffff',
              border: 'none',
              borderRadius: '50%',
              width: '56px',
              height: '56px',
              fontSize: '24px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(52, 199, 89, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
            }}
            title="Full-screen Screensaver"
            onClick={() => setShowFullscreenScreensaver(true)}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px) scale(1.1)';
              e.currentTarget.style.background = '#30b04f';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(52, 199, 89, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.background = '#34c759';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(52, 199, 89, 0.3)';
            }}
          >
            <span role="img" aria-label="Screensaver">✨</span>
          </button>
        </>
      )}
      
      {/* Screensaver Display */}
      {records.length > 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            width: '200px',
            height: '100vh',
            pointerEvents: 'none',
            zIndex: 1000,
            overflow: 'hidden'
          }}
        >
          {screensaverAlbums.map((album, index) => {
            const record = records.find(r => r.id === album.id);
            if (!record) return null;
            
            return (
              <div
                key={`left-${album.id}-${index}`}
                style={{
                  position: 'absolute',
                  left: album.x,
                  top: album.y,
                  transform: `rotate(${album.rotation}deg) scale(${album.scale})`,
                  transition: 'none',
                  zIndex: 2
                }}
              >
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                    position: 'relative'
                  }}
                >
                  <img
                    src={record.coverImage || '/placeholder-album.jpg'}
                    alt={`${record.title} by ${record.artist}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjRjVGNUY1Ii8+Cjx0ZXh0IHg9IjMwIiB5PSIzMCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjgiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBDb3ZlcjwvdGV4dD4KPC9zdmc+';
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Right Side Screensaver Display */}
      {records.length > 0 && !showFullscreenScreensaver && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            right: 0,
            width: '200px',
            height: '100vh',
            pointerEvents: 'none',
            zIndex: 1000,
            overflow: 'hidden'
          }}
        >
          {rightScreensaverAlbums.map((album, index) => {
            const record = records.find(r => r.id === album.id);
            if (!record) return null;
            
            return (
              <div
                key={`right-${album.id}-${index}`}
                style={{
                  position: 'absolute',
                  left: album.x,
                  top: album.y,
                  transform: `rotate(${album.rotation}deg) scale(${album.scale})`,
                  transition: 'none',
                  zIndex: 2
                }}
              >
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                    position: 'relative'
                  }}
                >
                  <img
                    src={record.coverImage || '/placeholder-album.jpg'}
                    alt={`${record.title} by ${record.artist}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjRjVGNUY1Ii8+Cjx0ZXh0IHg9IjMwIiB5PSIzMCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjgiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBDb3ZlcjwvdGV4dD4KPC9zdmc+';
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default App;