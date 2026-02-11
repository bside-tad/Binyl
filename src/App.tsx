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
  const [ratingSubSort, setRatingSubSort] = useState<'rating' | 'artist'>('rating');
  const [playCounts, setPlayCounts] = useState<{[key: string]: number}>({});
  const [ratings, setRatings] = useState<{[key: string]: number}>({});
  const [notes, setNotes] = useState<{[key: string]: string}>({});
  const exportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
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
  const [activeOverlayId, setActiveOverlayId] = useState<number | null>(null);
  const [leftUsedIds, setLeftUsedIds] = useState<Set<number>>(new Set());
  const [rightUsedIds, setRightUsedIds] = useState<Set<number>>(new Set());
  const [showRandomAlbumModal, setShowRandomAlbumModal] = useState(false);
  const [randomAlbum, setRandomAlbum] = useState<Record | null>(null);
  const [isPlayingAnimation, setIsPlayingAnimation] = useState(false);
  const [showFullscreenUI, setShowFullscreenUI] = useState(true);
  const [isFullscreenActive, setIsFullscreenActive] = useState(false);
  const [tilesMode, setTilesMode] = useState(false);
  const [tileRecords, setTileRecords] = useState<Record[]>([]);
  const [spinningTileIndices, setSpinningTileIndices] = useState<Set<number>>(new Set());
  const [flippingTileNewRecords, setFlippingTileNewRecords] = useState<Map<number, Record>>(new Map());
  const [tilesGridCols, setTilesGridCols] = useState<number>(0);
  const [tilesGridWidth, setTilesGridWidth] = useState<number>(0);
  const [tilesGridHeight, setTilesGridHeight] = useState<number>(0);

  // Left side screensaver animation
  useEffect(() => {
    if (records.length === 0) return;

    const createLeftScreensaverAlbum = () => {
      // Get available records (not currently used on left side)
      const availableRecords = records.filter(record => !leftUsedIds.has(record.id));
      if (availableRecords.length === 0) {
        // If all records are used, reset the used set
        setLeftUsedIds(new Set());
        const randomRecord = records[Math.floor(Math.random() * records.length)];
        return {
          id: randomRecord.id,
          x: Math.random() * 150,
          y: -100,
          rotation: (Math.random() - 0.5) * 60,
          scale: 0.3 + Math.random() * 0.4,
          speed: 0.8 + Math.random() * 1.2,
        };
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
        const randomRecord = records[Math.floor(Math.random() * records.length)];
        return {
          id: randomRecord.id,
          x: Math.random() * 150,
          y: -100,
          rotation: (Math.random() - 0.5) * 60,
          scale: 0.3 + Math.random() * 0.4,
          speed: 0.8 + Math.random() * 1.2,
        };
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
        sparkles: []
      };
    };

    const animateFullscreenScreensaver = () => {
      setFullscreenScreensaverAlbums(prev => {
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

        // Add new albums more frequently for full-screen effect
        if (Math.random() < 0.25 && updated.length < 50) {
          const newAlbum = createFullscreenScreensaverAlbum(newUsedIds);
          if (newAlbum) {
            updated.push(newAlbum);
          }
        }

        return updated;
      });
    };

    const interval = setInterval(animateFullscreenScreensaver, 40);
    return () => clearInterval(interval);
  }, [records, showFullscreenScreensaver]);

  // Track fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreenActive(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    handleFullscreenChange(); // Check initial state

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Hide UI after inactivity in fullscreen mode (only when actually in fullscreen)
  useEffect(() => {
    if (!showFullscreenScreensaver || !isFullscreenActive) {
      setShowFullscreenUI(true);
      return;
    }

    // Hide UI immediately when entering fullscreen
    setShowFullscreenUI(false);

    let inactivityTimer: number;

    const handleMouseMove = () => {
      setShowFullscreenUI(true);
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        setShowFullscreenUI(false);
      }, 3000); // Hide after 3 seconds of inactivity
    };

    const handleMouseEnter = () => {
      setShowFullscreenUI(true);
      clearTimeout(inactivityTimer);
    };

    // Add event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      clearTimeout(inactivityTimer);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [showFullscreenScreensaver, isFullscreenActive]);

  // Initialize tiles mode
  useEffect(() => {
    if (tilesMode && records.length > 0) {
      // Calculate grid dimensions based on viewport to fill entire screen
      const tileSize = 120; // Size of each tile
      const cols = Math.ceil(window.innerWidth / tileSize) + 2; // Add 2 to ensure full coverage including right edge
      const rows = Math.ceil(window.innerHeight / tileSize) + 2; // Add 2 to ensure full coverage including bottom edge
      const totalTiles = cols * rows;
      
      setTilesGridCols(cols);
      setTilesGridWidth(cols * tileSize); // Calculate exact grid width for centering
      setTilesGridHeight(rows * tileSize); // Calculate exact grid height for centering
      
      // Fill with unique records (no duplicates)
      const tiles: Record[] = [];
      const usedRecordIds = new Set<number>();
      const availableRecords = [...records];
      
      for (let i = 0; i < totalTiles; i++) {
        // Filter out records that are already used
        const available = availableRecords.filter(record => !usedRecordIds.has(record.id));
        
        // If we've used all records, reset and start over
        if (available.length === 0) {
          usedRecordIds.clear();
          const resetAvailable = availableRecords.filter(record => !usedRecordIds.has(record.id));
          if (resetAvailable.length > 0) {
            const randomRecord = resetAvailable[Math.floor(Math.random() * resetAvailable.length)];
            tiles.push(randomRecord);
            usedRecordIds.add(randomRecord.id);
          } else {
            // Fallback if somehow no records available
            const randomRecord = records[Math.floor(Math.random() * records.length)];
            tiles.push(randomRecord);
          }
        } else {
          const randomRecord = available[Math.floor(Math.random() * available.length)];
          tiles.push(randomRecord);
          usedRecordIds.add(randomRecord.id);
        }
      }
      setTileRecords(tiles);
    } else {
      setSpinningTileIndices(new Set());
      setFlippingTileNewRecords(new Map());
    }
  }, [tilesMode, records]);

  // Randomly flip tiles to new records (1-3 tiles at a time)
  useEffect(() => {
    if (!tilesMode || tileRecords.length === 0 || records.length === 0 || spinningTileIndices.size > 0) return;

    const flipRandomTiles = () => {
      // Randomly decide how many tiles to flip (1-3)
      const numTilesToFlip = Math.floor(Math.random() * 3) + 1; // 1, 2, or 3
      
      // Get currently displayed record IDs to avoid duplicates
      const currentRecordIds = new Set(tileRecords.map(r => r.id));
      
      // Filter out records that are already displayed
      const availableRecords = records.filter(record => !currentRecordIds.has(record.id));
      
      // Get available tile indices (not currently flipping)
      const availableIndices = tileRecords
        .map((_, index) => index)
        .filter(index => !spinningTileIndices.has(index));
      
      // Select random indices to flip (up to numTilesToFlip or available)
      const indicesToFlip: number[] = [];
      const shuffledIndices = [...availableIndices].sort(() => Math.random() - 0.5);
      
      for (let i = 0; i < Math.min(numTilesToFlip, shuffledIndices.length); i++) {
        indicesToFlip.push(shuffledIndices[i]);
      }
      
      if (indicesToFlip.length === 0) return;
      
      // Create new records map and indices set
      const newRecordsMap = new Map<number, Record>();
      const newIndicesSet = new Set<number>();
      
      indicesToFlip.forEach(index => {
        // If all records are displayed, allow any record (fallback)
        const randomRecord = availableRecords.length > 0 
          ? availableRecords[Math.floor(Math.random() * availableRecords.length)]
          : records[Math.floor(Math.random() * records.length)];
        
        newRecordsMap.set(index, randomRecord);
        newIndicesSet.add(index);
      });
      
      setFlippingTileNewRecords(newRecordsMap);
      setSpinningTileIndices(newIndicesSet);
      
      // Update the record state at the midpoint when back is fully visible
      setTimeout(() => {
        setTileRecords(prev => {
          const newTiles = [...prev];
          newRecordsMap.forEach((record, index) => {
            newTiles[index] = record;
          });
          return newTiles;
        });
      }, 750); // Update at midpoint (half of 1.5 seconds)
      
      // Reset rotation and clear flipping state after animation completes
      setTimeout(() => {
        setSpinningTileIndices(new Set());
        setFlippingTileNewRecords(new Map());
      }, 1500); // Wait for flip animation to complete (1.5 seconds)
    };

    // Flip random tiles every 0.8-1.5 seconds for higher frequency
    const interval = setInterval(() => {
      flipRandomTiles();
    }, 800 + Math.random() * 700);

    return () => clearInterval(interval);
  }, [tilesMode, tileRecords.length, records, spinningTileIndices]);


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

  const getRandomAlbum = () => {
    if (records.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * records.length);
    return records[randomIndex];
  };

  const handleRandomAlbumClick = () => {
    const album = getRandomAlbum();
    if (album) {
      setRandomAlbum(album);
      setShowRandomAlbumModal(true);
    }
  };

  const handleNextAlbum = () => {
    const album = getRandomAlbum();
    if (album) {
      setRandomAlbum(album);
    }
  };

  const handlePlayNow = () => {
    if (randomAlbum) {
      setIsPlayingAnimation(true);
      const newCount = (playCounts[randomAlbum.id.toString()] || 0) + 1;
      handlePlayCountUpdate(randomAlbum.id, newCount);
      
      // Wait for animation to complete before closing
      setTimeout(() => {
        setShowRandomAlbumModal(false);
        setRandomAlbum(null);
        setIsPlayingAnimation(false);
      }, 3000);
    }
  };




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
      const ratedRecords = filtered.filter(record => {
        const rating = ratings[record.id.toString()] || 0;
        return rating > 0;
      });
      
      if (ratingSubSort === 'rating') {
        return ratedRecords.sort((a, b) => {
          const aRating = ratings[a.id.toString()] || 0;
          const bRating = ratings[b.id.toString()] || 0;
          return bRating - aRating; // Descending order
        });
      } else {
        // Sort by artist
        return ratedRecords.sort((a, b) =>
          a.artist.localeCompare(b.artist, undefined, { sensitivity: 'base' })
        );
      }
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
  }, [records, searchTerm, sortBy, playCounts, genreFilter, ratings, ratingSubSort]);

  const handleExportImage = async () => {
    setIsExporting(true);
    // Wait for export mode to render
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
            cursor: (showFullscreenUI || !isFullscreenActive) ? 'default' : 'none',
          }}
        >
          {/* Control Buttons */}
          <div style={{ 
            position: 'fixed', 
            top: 32, 
            right: 32, 
            display: 'flex', 
            gap: '12px', 
            zIndex: 5100,
            opacity: (showFullscreenUI || !isFullscreenActive) ? 1 : 0,
            transition: 'opacity 0.5s ease',
            pointerEvents: (showFullscreenUI || !isFullscreenActive) ? 'auto' : 'none',
          }}>
            {/* Fullscreen Button */}
            <button
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                padding: '12px 20px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer',
                backdropFilter: 'blur(20px)',
                transition: 'all 0.2s ease',
              }}
              onClick={() => {
                if (!document.fullscreenElement) {
                  document.documentElement.requestFullscreen();
                } else {
                  document.exitFullscreen();
                }
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
              {document.fullscreenElement ? 'Windowed' : 'Fullscreen'}
            </button>

            {/* Tiles Button */}
            <button
              style={{
                background: tilesMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer',
                backdropFilter: 'blur(20px)',
                transition: 'all 0.2s ease',
              }}
              onClick={() => {
                setTilesMode(!tilesMode);
                if (!tilesMode) {
                  setFullscreenScreensaverAlbums([]);
                }
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = tilesMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {tilesMode ? 'Waterfall' : 'Tiles'}
            </button>
            
            {/* Exit Button */}
            <button
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer',
                backdropFilter: 'blur(20px)',
                transition: 'all 0.2s ease',
              }}
              onClick={() => {
                // Exit fullscreen if currently in fullscreen mode
                if (document.fullscreenElement) {
                  document.exitFullscreen();
                }
                setShowFullscreenScreensaver(false);
                setFullscreenScreensaverAlbums([]);
                setTilesMode(false);
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
              Close
            </button>
          </div>
          
          {/* Tiles Mode */}
          {tilesMode && (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: tilesGridWidth > 0 ? `${tilesGridWidth}px` : '100vw',
                height: tilesGridHeight > 0 ? `${tilesGridHeight}px` : '100vh',
                display: 'grid',
                gridTemplateColumns: tilesGridCols > 0 ? `repeat(${tilesGridCols}, 120px)` : `repeat(auto-fill, 120px)`,
                gridAutoRows: '120px',
                gap: 0,
                overflow: 'hidden',
              }}
            >
              {tileRecords.map((record, index) => {
                const isFlipping = spinningTileIndices.has(index);
                const newRecord = flippingTileNewRecords.get(index);
                const showNewRecord = isFlipping && newRecord;
                
                return (
                  <div
                    key={`tile-${index}-${record.id}`}
                    data-tile-index={index}
                    style={{
                      width: '120px',
                      height: '120px',
                      overflow: 'hidden',
                      position: 'relative',
                      transformStyle: 'preserve-3d',
                      perspective: '1000px',
                    }}
                  >
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        position: 'relative',
                        transformStyle: 'preserve-3d',
                        transform: isFlipping ? 'rotateY(180deg)' : 'rotateY(0deg)',
                        transition: isFlipping ? 'transform 1.5s ease-in-out' : 'none',
                      }}
                    >
                      {/* Front side - shows current album when at 0deg, new album when at 180deg */}
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          position: 'absolute',
                          backfaceVisibility: 'hidden',
                          WebkitBackfaceVisibility: 'hidden',
                          transform: 'rotateY(0deg)',
                          top: 0,
                          left: 0,
                        }}
                      >
                        <img
                          src={record.coverImage || '/placeholder-album.jpg'}
                          alt={`${record.title} by ${record.artist}`}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            display: 'block',
                          }}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEyMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjAiIGhlaWdodD0iMTIwIiBmaWxsPSIjRjVGNUY1Ii8+Cjx0ZXh0IHg9IjYwIiB5PSI2MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEwIiBmaWxsPSIjOTk5OTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Tm8gQ292ZXI8L3RleHQ+Cjwvc3ZnPg==';
                          }}
                        />
                      </div>
                      {/* Back side - shows new album when at 180deg, current album when at 0deg */}
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          position: 'absolute',
                          backfaceVisibility: 'hidden',
                          WebkitBackfaceVisibility: 'hidden',
                          transform: 'rotateY(180deg)',
                          top: 0,
                          left: 0,
                        }}
                      >
                        <img
                          src={showNewRecord && newRecord ? newRecord.coverImage : record.coverImage || '/placeholder-album.jpg'}
                          alt={showNewRecord && newRecord ? `${newRecord.title} by ${newRecord.artist}` : `${record.title} by ${record.artist}`}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            display: 'block',
                            animation: isFlipping && showNewRecord ? 'albumFlipIn 0.4s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
                          }}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEyMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjAiIGhlaWdodD0iMTIwIiBmaWxsPSIjRjVGNUY1Ii8+Cjx0ZXh0IHg9IjYwIiB5PSI2MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEwIiBmaWxsPSIjOTk5OTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Tm8gQ292ZXI8L3RleHQ+Cjwvc3ZnPg==';
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Full-screen Falling Albums */}
          {!tilesMode && fullscreenScreensaverAlbums.map((album, index) => {
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
                  
                  
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <>
          {/* Random Album Button */}
          {records.length > 0 && (
            <button
              onClick={handleRandomAlbumClick}
              style={{
                position: 'fixed',
                top: 24,
                left: 24,
                zIndex: 3000,
                background: '#007aff',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                padding: '12px',
                fontSize: '20px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0, 122, 255, 0.3)',
                transition: 'all 0.2s ease',
                width: '48px',
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.background = '#0056b3';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 122, 255, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.background = '#007aff';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 122, 255, 0.3)';
              }}
            >
              🎲
            </button>
          )}

          {/* Header */}
          <div className="header">
            <h1>{username}'s Collection</h1>
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
              totalRecords={records.length}
              filteredCount={filteredAndSortedRecords.length}
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
              Rated Albums
            </button>
          </div>

          {/* Rating Sub-Sort Options */}
          {sortBy === 'rating' && (
            <div style={{ 
              display: 'flex', 
              gap: '8px', 
              marginBottom: '20px',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={() => setRatingSubSort('rating')}
                style={{
                  padding: '8px 16px',
                  background: ratingSubSort === 'rating' ? '#007aff' : '#f2f2f7',
                  color: ratingSubSort === 'rating' ? '#ffffff' : '#1d1d1f',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s ease'
                }}
              >
                Sort by Rating
              </button>
              <button
                onClick={() => setRatingSubSort('artist')}
                style={{
                  padding: '8px 16px',
                  background: ratingSubSort === 'artist' ? '#007aff' : '#f2f2f7',
                  color: ratingSubSort === 'artist' ? '#ffffff' : '#1d1d1f',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s ease'
                }}
              >
                Sort by Artist
              </button>
            </div>
          )}

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
                  background: isExporting ? '#8e8e93' : '#007aff',
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
                playCount={playCounts[record.id.toString()] || 0}
                onPlayCountUpdate={handlePlayCountUpdate}
                currentRating={ratings[record.id.toString()] || 0}
                onRatingUpdate={handleRatingUpdate}
                currentNote={notes[record.id.toString()] || ''}
                onNoteUpdate={handleNoteUpdate}
                activeOverlayId={activeOverlayId}
                onOverlayToggle={(id) => setActiveOverlayId(activeOverlayId === id ? null : id)}
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
              {sortBy === 'plays' ? 'You haven\'t played any albums yet' : sortBy === 'rating' ? 'You haven\'t rated any albums yet' : (searchTerm ? 'No albums found matching your search.' : 'No albums found for the selected genre.')}
            </div>
          )}

          {/* Random Album Modal */}
          {showRandomAlbumModal && randomAlbum && (
            <div 
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 4000,
                backdropFilter: 'blur(10px)',
              }}
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setShowRandomAlbumModal(false);
                  setRandomAlbum(null);
                }
              }}
            >
              <div 
                style={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  borderRadius: '20px',
                  padding: '32px',
                  maxWidth: '400px',
                  width: '90%',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                  textAlign: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                  transform: isPlayingAnimation ? 'scale(0.95)' : 'scale(1)',
                  opacity: isPlayingAnimation ? 0.8 : 1,
                  transition: 'all 0.3s ease',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {isPlayingAnimation && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'linear-gradient(135deg, rgba(0, 122, 255, 0.95) 0%, rgba(0, 86, 179, 0.95) 100%)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '20px',
                      zIndex: 10,
                      animation: 'playNowFadeIn 0.8s ease',
                    }}
                  >
                    <div
                      style={{
                        width: '100px',
                        height: '100px',
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '20px',
                        position: 'relative',
                        animation: 'playNowPulse 1.5s ease infinite',
                      }}
                    >
                      <div
                        style={{
                          width: '60px',
                          height: '60px',
                          borderRadius: '50%',
                          background: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          animation: 'playNowScaleIn 1s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                        }}
                      >
                        <svg
                          width="40"
                          height="40"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#007aff"
                          strokeWidth="4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{
                            animation: 'playNowCheckmark 1s ease 0.5s both',
                          }}
                        >
                          <path
                            d="M5 13l4 4L19 7"
                            strokeDasharray="24"
                            strokeDashoffset="24"
                            style={{
                              animation: 'playNowDrawCheck 0.9s ease 0.6s forwards',
                            }}
                          />
                        </svg>
                      </div>
                    </div>
                    <div
                      style={{
                        color: '#ffffff',
                        fontSize: '28px',
                        fontWeight: '700',
                        animation: 'playNowSlideUp 1s ease 0.9s both',
                        textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                      }}
                    >
                      Now Playing!
                    </div>
                  </div>
                )}
                <img
                  src={randomAlbum.coverImage || '/placeholder-album.jpg'}
                  alt={`${randomAlbum.title} by ${randomAlbum.artist}`}
                  style={{
                    width: '100%',
                    maxWidth: '300px',
                    height: 'auto',
                    borderRadius: '12px',
                    marginBottom: '20px',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
                    transform: isPlayingAnimation ? 'scale(0.9)' : 'scale(1)',
                    transition: 'transform 0.3s ease',
                  }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjVGNUY1Ii8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTUwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBDb3ZlciBJbWFnZTwvdGV4dD4KPC9zdmc+';
                  }}
                />
                <h2 style={{ 
                  margin: '0 0 8px 0', 
                  fontSize: '24px', 
                  fontWeight: '600',
                  color: '#1d1d1f'
                }}>
                  {randomAlbum.title}
                </h2>
                <p style={{ 
                  margin: '0 0 8px 0', 
                  fontSize: '18px', 
                  color: '#666',
                  fontWeight: '500'
                }}>
                  {randomAlbum.artist}
                </p>
                {randomAlbum.year > 0 && (
                  <p style={{ 
                    margin: '0 0 24px 0', 
                    fontSize: '14px', 
                    color: '#999'
                  }}>
                    {randomAlbum.year}
                  </p>
                )}
                <div style={{ 
                  display: 'flex', 
                  gap: '12px', 
                  justifyContent: 'center',
                  flexWrap: 'wrap'
                }}>
                  <button
                    onClick={handlePlayNow}
                    disabled={isPlayingAnimation}
                    style={{
                      padding: '12px 24px',
                      background: isPlayingAnimation ? '#8e8e93' : '#007aff',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: isPlayingAnimation ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 4px 12px rgba(0, 122, 255, 0.3)',
                      transform: isPlayingAnimation ? 'scale(0.95)' : 'scale(1)',
                    }}
                    onMouseEnter={(e) => {
                      if (!isPlayingAnimation) {
                        e.currentTarget.style.background = '#0056b3';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isPlayingAnimation) {
                        e.currentTarget.style.background = '#007aff';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }
                    }}
                  >
                    {isPlayingAnimation ? 'Playing...' : 'Play Now'}
                  </button>
                  <button
                    onClick={handleNextAlbum}
                    style={{
                      padding: '12px 24px',
                      background: '#f2f2f7',
                      color: '#1d1d1f',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#e5e5ea';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#f2f2f7';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    Next Album
                  </button>
                  <button
                    onClick={() => {
                      setShowRandomAlbumModal(false);
                      setRandomAlbum(null);
                    }}
                    style={{
                      padding: '12px 24px',
                      background: 'transparent',
                      color: '#666',
                      border: '1px solid #d1d1d6',
                      borderRadius: '12px',
                      fontSize: '16px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#f2f2f7';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
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
              background: '#007aff',
              color: '#ffffff',
              border: 'none',
              borderRadius: '50%',
              width: '56px',
              height: '56px',
              fontSize: '24px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0, 122, 255, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
            }}
            title="Full-screen Screensaver"
            onClick={() => setShowFullscreenScreensaver(true)}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px) scale(1.1)';
              e.currentTarget.style.background = '#0056b3';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 122, 255, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.background = '#007aff';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 122, 255, 0.3)';
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