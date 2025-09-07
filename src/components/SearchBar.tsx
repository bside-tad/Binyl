import React from 'react';

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  totalRecords: number;
  filteredCount: number;
}

const SearchBar: React.FC<SearchBarProps> = ({
  searchTerm,
  onSearchChange,
  totalRecords,
  filteredCount,
}) => {
  return (
    <div className="search-container">
      <input
        type="text"
        className="search-input"
        placeholder="Search by artist name..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
      />
    </div>
  );
};

export default SearchBar; 