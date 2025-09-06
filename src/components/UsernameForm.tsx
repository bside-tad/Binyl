import React, { useState } from 'react';

interface UsernameFormProps {
  onSubmit: (username: string) => void;
  isLoading: boolean;
}

const UsernameForm: React.FC<UsernameFormProps> = ({ onSubmit, isLoading }) => {
  const [username, setUsername] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      onSubmit(username.trim());
    }
  };

  return (
    <div className="username-form">
      <h2>Enter Your Discogs Username</h2>
      <p style={{ marginBottom: '20px', color: '#666' }}>
        View and search through your vinyl collection
      </p>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">Discogs Username</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your Discogs username"
            disabled={isLoading}
            required
          />
        </div>
        <button
          type="submit"
          className="btn"
          disabled={isLoading || !username.trim()}
        >
          {isLoading ? 'Loading...' : 'View Collection'}
        </button>
      </form>
    </div>
  );
};

export default UsernameForm; 