import React, { useState, useEffect } from 'react';
import { Record } from '../types';

interface RecordCardProps {
  record: Record;
  onPlayCountUpdate: (recordId: number, newCount: number) => void;
  playCount: number;
  onRatingUpdate?: (recordId: number, newRating: number) => void;
  currentRating?: number;
  onNoteUpdate?: (recordId: number, note: string) => void;
  currentNote?: string;
  exportMode?: boolean;
  exportImageSrc?: string;
  showOverlay?: boolean;
  onShowOverlay?: () => void;
  onHideOverlay?: () => void;
  showRatingOverlay?: boolean;
}

const RecordCard: React.FC<RecordCardProps> = ({ record, onPlayCountUpdate, playCount, onRatingUpdate, currentRating, onNoteUpdate, currentNote, exportMode, exportImageSrc, showOverlay, onShowOverlay, onHideOverlay, showRatingOverlay }) => {
  const [clickCount, setClickCount] = useState(playCount);
  const [isNeedleDropping, setIsNeedleDropping] = useState(false);
  const [localShowOverlay, setLocalShowOverlay] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState(currentNote || '');

  // Update local clickCount when global playCount changes
  useEffect(() => {
    setClickCount(playCount);
  }, [playCount]);

  const handleCardClick = () => {
    if (exportMode) return;
    if (onShowOverlay) {
      onShowOverlay();
    } else {
      setLocalShowOverlay(true);
    }
  };

  const handleNeedleDropped = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);
    setIsNeedleDropping(true);
    if (onHideOverlay) {
      onHideOverlay();
    } else {
      setLocalShowOverlay(false);
    }
    
    // Update the parent component with the new play count
    onPlayCountUpdate(record.id, newCount);
    
    // Stop needle dropping animation after it completes
    setTimeout(() => {
      setIsNeedleDropping(false);
    }, 2000);
  };

  const handleCancel = () => {
    if (onHideOverlay) {
      onHideOverlay();
    } else {
      setLocalShowOverlay(false);
    }
  };

  const handleRateClick = () => {
    setShowRatingModal(true);
  };

  const handleRatingSubmit = (rating: number) => {
    if (onRatingUpdate) {
      onRatingUpdate(record.id, rating);
    }
    setShowRatingModal(false);
    
    // Prompt user to add a note after rating
    setNoteText('');
    setShowNoteModal(true);
  };

  const handleNoteClick = () => {
    setNoteText(currentNote || '');
    setShowNoteModal(true);
  };

  const handleNoteSubmit = () => {
    if (onNoteUpdate) {
      onNoteUpdate(record.id, noteText);
    }
    setShowNoteModal(false);
    if (onHideOverlay) {
      onHideOverlay();
    } else {
      setLocalShowOverlay(false);
    }
  };

  const handleNoteCancel = () => {
    setShowNoteModal(false);
    // If note was prompted after rating, close the overlay
    if (onHideOverlay) {
      onHideOverlay();
    } else {
      setLocalShowOverlay(false);
    }
  };

  // Use exportImageSrc in export mode, otherwise use coverImage
  const imageSrc = exportMode && exportImageSrc ? exportImageSrc : (record.coverImage || '/placeholder-album.jpg');

  const overlayVisible = typeof showOverlay === 'boolean' ? showOverlay : localShowOverlay;
  return (
    <div className={`record-card${exportMode ? ' export-tile' : ''}`} onClick={handleCardClick}>
      {clickCount > 0 && !exportMode && (
        <div className="click-counter">
          {clickCount}
        </div>
      )}
      
      {showRatingOverlay && currentRating && currentRating > 0 && !exportMode && (
        <div className="rating-overlay">
          <div className="rating-stars-display">
            {Array.from({ length: currentRating }, (_, i) => (
              <span key={i} className="rating-star-display">★</span>
            ))}
          </div>
          <div className="rating-value-display">{currentRating}</div>
        </div>
      )}
      
      {isNeedleDropping && (
        <div className="record-player">
          <div className="record-player-base"></div>
          <div className="vinyl-record spinning"></div>
          <div className="tonearm dropping"></div>
        </div>
      )}
      
      {overlayVisible && !exportMode && (
        <div className="record-overlay" onClick={(e) => e.stopPropagation()}>
          <div className="overlay-buttons">
            <button 
              className="overlay-btn needle-dropped"
              onClick={handleNeedleDropped}
            >
              Just Played
            </button>
            <button 
              className={`overlay-btn rate-btn ${currentRating && currentRating > 0 ? 'rated' : ''}`}
              onClick={handleRateClick}
            >
              {currentRating && currentRating > 0 ? 'Rerate Album' : 'Rate Album'}
            </button>
            <button 
              className="overlay-btn note-btn"
              onClick={handleNoteClick}
            >
              {currentNote ? 'Edit Note' : 'Record Note'}
            </button>
            <button
              className="overlay-btn discogs-info"
              onClick={() => {
                const url = `https://www.discogs.com/release/${record.id}`;
                window.open(url, '_blank', 'noopener,noreferrer');
              }}
            >
              Discogs Info
            </button>
            <button 
              className="overlay-btn cancel"
              onClick={handleCancel}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {showNoteModal && !exportMode && (
        <div className="note-modal-overlay" onClick={(e) => e.stopPropagation()}>
          <div className="note-modal">
            <h3>{currentNote ? 'Edit Note' : 'Add Note'} for "{record.title}"</h3>
            <textarea
              className="note-textarea"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Enter your note here (max 168 characters)..."
              maxLength={168}
              rows={4}
            />
            <div className="note-character-count">
              {noteText.length}/168 characters
            </div>
            <div className="note-modal-buttons">
              <button 
                className="overlay-btn note-submit-btn"
                onClick={handleNoteSubmit}
                disabled={noteText.trim().length === 0}
              >
                {currentNote ? 'Update Note' : 'Save Note'}
              </button>
              <button 
                className="overlay-btn cancel"
                onClick={handleNoteCancel}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showRatingModal && !exportMode && (
        <div className="rating-modal-overlay" onClick={(e) => e.stopPropagation()}>
          <div className="rating-modal">
            <h3>{currentRating && currentRating > 0 ? 'Rerate' : 'Rate'} "{record.title}"</h3>
            {currentRating && currentRating > 0 && (
              <div className="current-rating">
                <span>Current Rating: </span>
                <div className="current-rating-stars">
                  {Array.from({ length: currentRating }, (_, i) => (
                    <span key={i} className="current-rating-star">★</span>
                  ))}
                </div>
                <span className="current-rating-value">{currentRating}</span>
              </div>
            )}
            <div className="rating-stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  className="rating-star-btn"
                  onClick={() => handleRatingSubmit(star)}
                >
                  ★ {star}
                </button>
              ))}
            </div>
            <button 
              className="overlay-btn cancel"
              onClick={() => setShowRatingModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      
      <img
        src={imageSrc}
        alt={`${record.title} by ${record.artist}`}
        className="record-image"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjgwIiBoZWlnaHQ9IjI4MCIgdmlld0JveD0iMCAwIDI4MCAyODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyODAiIGhlaWdodD0iMjgwIiBmaWxsPSIjRjVGNUY1Ii8+Cjx0ZXh0IHg9IjE0MCIgeT0iMTQwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBDb3ZlciBJbWFnZTwvdGV4dD4KPC9zdmc+';
        }}
      />
      <div className="record-info">
        <div className="record-title">{record.title}</div>
        <div className="record-artist">{record.artist}</div>
        {record.year > 0 && <div className="record-year">{record.year}</div>}
        {currentNote && !exportMode && (
          <div className="record-note">
            <div className="note-text">{currentNote}</div>
          </div>
        )}
      </div>
      {exportMode && (
        <div className="playcount-export-overlay">
          Total Plays: {clickCount}
        </div>
      )}
    </div>
  );
};

export default RecordCard; 