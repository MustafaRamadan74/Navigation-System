import React, { useState, useEffect, useRef } from 'react';
import { LocationPoint } from '../../types/location';
import { RecentSearch } from '../../types/storage';
import { searchLocation } from '../../services/tomtom/search';
import { getRecentSearches, addRecentSearch, clearRecentSearches } from '../../services/storage/storageService';
import { useI18n } from '../../i18n/I18nContext';
import './SearchBox.css';

export interface SearchBoxProps {
  id: string;
  placeholder: string;
  type: 'start' | 'destination' | 'waypoint';
  waypointIndex?: number;
  value: string;
  centerBias?: [number, number];
  onSelect: (location: LocationPoint) => void;
  onClear: () => void;
}

export const SearchBox: React.FC<SearchBoxProps> = ({
  id,
  placeholder,
  type,
  waypointIndex = 0,
  value,
  centerBias,
  onSelect,
  onClear,
}) => {
  const { t } = useI18n();
  const [inputValue, setInputValue] = useState<string>(value);
  const [suggestions, setSuggestions] = useState<LocationPoint[]>([]);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const debounceTimerRef = useRef<number | null>(null);

  // Sync internal input value if prop value changes externally
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Click outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setInputValue(text);
    setErrorMessage(null);

    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }

    if (!text.trim() || text.trim().length < 2) {
      setSuggestions([]);
      setIsLoading(false);
      setHasSearched(false);

      const recents = getRecentSearches();
      if (recents.length > 0) {
        setRecentSearches(recents);
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
      return;
    }

    setIsLoading(true);
    setIsOpen(true);
    setHasSearched(false);

    debounceTimerRef.current = window.setTimeout(async () => {
      try {
        const results = await searchLocation(text, centerBias);
        setSuggestions(results);
        setHasSearched(true);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : t('searchFailed');
        setErrorMessage(msg);
        setSuggestions([]);
        setHasSearched(true);
      } finally {
        setIsLoading(false);
      }
    }, 300);
  };

  const handleSelectSuggestion = (loc: LocationPoint) => {
    setInputValue(loc.name);
    setIsOpen(false);
    setSuggestions([]);
    addRecentSearch(loc);
    onSelect(loc);
  };

  const handleClear = () => {
    setInputValue('');
    setSuggestions([]);
    setErrorMessage(null);
    setHasSearched(false);

    const recents = getRecentSearches();
    if (recents.length > 0) {
      setRecentSearches(recents);
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
    onClear();
  };

  const handleClearHistory = (e: React.MouseEvent) => {
    e.stopPropagation();
    clearRecentSearches();
    setRecentSearches([]);
    setIsOpen(false);
  };

  const isShowingRecents = !inputValue.trim() && recentSearches.length > 0;

  return (
    <div ref={containerRef} className="searchbox-container" id={`${id}-container`}>
      <div className="searchbox-input-wrapper">
        <div className={`searchbox-icon-prefix ${type}-icon`}>
          {type === 'start' && (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="7" />
              <circle cx="12" cy="12" r="2" fill="currentColor" />
            </svg>
          )}
          {type === 'destination' && (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
              <circle cx="12" cy="9" r="2.5" fill="currentColor" />
            </svg>
          )}
          {type === 'waypoint' && (
            <div className="searchbox-waypoint-badge">
              {waypointIndex + 1}
            </div>
          )}
        </div>

        <input
          id={id}
          type="text"
          className="searchbox-input"
          placeholder={placeholder}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => {
            if (!inputValue.trim()) {
              const recents = getRecentSearches();
              if (recents.length > 0) {
                setRecentSearches(recents);
                setIsOpen(true);
              }
            } else if (suggestions.length > 0 || (hasSearched && !isLoading)) {
              setIsOpen(true);
            }
          }}
          autoComplete="off"
        />

        <div className="searchbox-actions">
          {isLoading && <div className="searchbox-spinner" aria-label={t('searchingLocations')} />}

          {inputValue && (
            <button
              type="button"
              className="searchbox-clear-btn"
              onClick={handleClear}
              aria-label="Clear location input"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {isOpen && (
        <ul className="searchbox-dropdown" role="listbox">
          {/* Recent Searches section */}
          {isShowingRecents && (
            <>
              <li className="searchbox-dropdown-header">
                <span>{t('recentSearches')}</span>
                <button
                  type="button"
                  className="searchbox-clear-history-btn"
                  onClick={handleClearHistory}
                  title={t('clearAll')}
                >
                  {t('clearAll')}
                </button>
              </li>
              {recentSearches.map((item) => (
                <li
                  key={item.id}
                  className="searchbox-dropdown-item"
                  role="option"
                  aria-selected="false"
                  onClick={() => handleSelectSuggestion(item.location)}
                >
                  <div className="searchbox-dropdown-icon recents-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </div>
                  <div className="searchbox-dropdown-text">
                    <span className="searchbox-dropdown-title">{item.location.name}</span>
                    <span className="searchbox-dropdown-subtitle">{item.location.address}</span>
                  </div>
                </li>
              ))}
            </>
          )}

          {/* Active Search Suggestions */}
          {!isShowingRecents && (
            <>
              {isLoading && (
                <li className="searchbox-dropdown-status">
                  <div className="searchbox-spinner" /> {t('searchingLocations')}
                </li>
              )}

              {!isLoading && errorMessage && (
                <li className="searchbox-dropdown-status searchbox-dropdown-error" role="alert">
                  ⚠️ {errorMessage}
                </li>
              )}

              {!isLoading && !errorMessage && hasSearched && suggestions.length === 0 && (
                <li className="searchbox-dropdown-status">
                  {t('noResultsFound')} &quot;{inputValue}&quot;
                </li>
              )}

              {!isLoading &&
                suggestions.map((loc) => (
                  <li
                    key={loc.id}
                    className="searchbox-dropdown-item"
                    role="option"
                    aria-selected="false"
                    onClick={() => handleSelectSuggestion(loc)}
                  >
                    <div className="searchbox-dropdown-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                        <circle cx="12" cy="9" r="2.5" />
                      </svg>
                    </div>
                    <div className="searchbox-dropdown-text">
                      <span className="searchbox-dropdown-title">{loc.name}</span>
                      <span className="searchbox-dropdown-subtitle">{loc.address}</span>
                    </div>
                  </li>
                ))}
            </>
          )}
        </ul>
      )}
    </div>
  );
};
