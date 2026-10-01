import React, { useState } from 'react';
import { SavedPlace, RecentRoute, UserPreferences, PlaceCategory } from '../../types/storage';
import { LocationPoint } from '../../types/location';
import { formatDistance, formatDuration } from '../../utils/formatters';
import { useI18n } from '../../i18n/I18nContext';
import './SavedPlacesTab.css';

export interface SavedPlacesTabProps {
  savedPlaces: SavedPlace[];
  recentRoutes: RecentRoute[];
  preferences: UserPreferences;
  currentStart?: LocationPoint | null;
  currentDestination?: LocationPoint | null;
  onBackToDirections?: () => void;
  onSelectPlaceAsStart: (location: LocationPoint) => void;
  onSelectPlaceAsDestination: (location: LocationPoint) => void;
  onSelectRecentRoute: (route: RecentRoute) => void;
  onSavePlace: (label: string, category: PlaceCategory, location: LocationPoint) => void;
  onUpdatePlace: (id: string, label: string) => void;
  onDeletePlace: (id: string) => void;
  onClearRecentRoutes: () => void;
  onUpdatePreferences: (prefs: Partial<UserPreferences>) => void;
}

export const SavedPlacesTab: React.FC<SavedPlacesTabProps> = ({
  savedPlaces,
  recentRoutes,
  preferences,
  currentStart,
  currentDestination,
  onBackToDirections,
  onSelectPlaceAsStart,
  onSelectPlaceAsDestination,
  onSelectRecentRoute,
  onSavePlace,
  onUpdatePlace,
  onDeletePlace,
  onClearRecentRoutes,
  onUpdatePreferences,
}) => {
  const { t } = useI18n();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState<string>('');
  const [showSaveModal, setShowSaveModal] = useState<boolean>(false);
  const [modalLocation, setModalLocation] = useState<LocationPoint | null>(null);
  const [modalLabel, setModalLabel] = useState<string>('');
  const [modalCategory, setModalCategory] = useState<PlaceCategory>('favorite');

  const homePlace = savedPlaces.find((p) => p.category === 'home');
  const workPlace = savedPlaces.find((p) => p.category === 'work');
  const otherFavorites = savedPlaces.filter((p) => p.category !== 'home' && p.category !== 'work');

  const handleStartEdit = (place: SavedPlace) => {
    setEditingId(place.id);
    setEditLabel(place.label);
  };

  const handleSaveEdit = (id: string) => {
    if (editLabel.trim()) {
      onUpdatePlace(id, editLabel.trim());
    }
    setEditingId(null);
  };

  const openSaveModalFor = (loc: LocationPoint, defaultCategory: PlaceCategory = 'favorite') => {
    setModalLocation(loc);
    setModalLabel(loc.name);
    setModalCategory(defaultCategory);
    setShowSaveModal(true);
  };

  const handleConfirmSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalLocation || !modalLabel.trim()) return;

    onSavePlace(modalLabel.trim(), modalCategory, modalLocation);
    setShowSaveModal(false);
    setModalLocation(null);
  };

  return (
    <div className="saved-places-container">
      {/* Return to Directions Action (Phase 20) */}
      {onBackToDirections && (
        <button
          type="button"
          className="saved-places-back-btn"
          onClick={onBackToDirections}
          title={t('tabDirections')}
        >
          <span className="back-arrow-icon">←</span>
          <span>{t('tabDirections')}</span>
        </button>
      )}

      {/* 1. Quick Home & Work Shortcuts */}
      <section className="saved-section">
        <h4 className="saved-section-title">{t('quickPlaces')}</h4>
        <div className="quick-places-grid">
          {/* Home Card */}
          <div className={`quick-place-card ${homePlace ? 'has-place' : 'is-empty'}`}>
            <div className="quick-place-icon home-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <div className="quick-place-info">
              <span className="quick-place-label">{t('home')}</span>
              <span className="quick-place-address">
                {homePlace ? homePlace.location.name : t('notSet')}
              </span>
            </div>

            {homePlace ? (
              <div className="quick-place-actions">
                <button
                  type="button"
                  className="quick-route-btn"
                  title={t('routeTo')}
                  onClick={() => onSelectPlaceAsDestination(homePlace.location)}
                >
                  {t('go')}
                </button>
                <button
                  type="button"
                  className="quick-delete-btn"
                  title={t('delete')}
                  onClick={() => onDeletePlace(homePlace.id)}
                >
                  ✕
                </button>
              </div>
            ) : currentDestination ? (
              <button
                type="button"
                className="quick-set-btn"
                onClick={() => openSaveModalFor(currentDestination, 'home')}
              >
                + {t('setHome')}
              </button>
            ) : currentStart ? (
              <button
                type="button"
                className="quick-set-btn"
                onClick={() => openSaveModalFor(currentStart, 'home')}
              >
                + {t('setHome')}
              </button>
            ) : (
              <span className="quick-place-hint">{t('searchFirst')}</span>
            )}
          </div>

          {/* Work Card */}
          <div className={`quick-place-card ${workPlace ? 'has-place' : 'is-empty'}`}>
            <div className="quick-place-icon work-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
            </div>
            <div className="quick-place-info">
              <span className="quick-place-label">{t('work')}</span>
              <span className="quick-place-address">
                {workPlace ? workPlace.location.name : t('notSet')}
              </span>
            </div>

            {workPlace ? (
              <div className="quick-place-actions">
                <button
                  type="button"
                  className="quick-route-btn"
                  title={t('routeTo')}
                  onClick={() => onSelectPlaceAsDestination(workPlace.location)}
                >
                  {t('go')}
                </button>
                <button
                  type="button"
                  className="quick-delete-btn"
                  title={t('delete')}
                  onClick={() => onDeletePlace(workPlace.id)}
                >
                  ✕
                </button>
              </div>
            ) : currentDestination ? (
              <button
                type="button"
                className="quick-set-btn"
                onClick={() => openSaveModalFor(currentDestination, 'work')}
              >
                + {t('setWork')}
              </button>
            ) : currentStart ? (
              <button
                type="button"
                className="quick-set-btn"
                onClick={() => openSaveModalFor(currentStart, 'work')}
              >
                + {t('setWork')}
              </button>
            ) : (
              <span className="quick-place-hint">{t('searchFirst')}</span>
            )}
          </div>
        </div>
      </section>

      {/* 2. Favorites List */}
      <section className="saved-section">
        <div className="saved-section-header">
          <h4 className="saved-section-title">{t('savedPlaces')} ({otherFavorites.length})</h4>
          {currentDestination && (
            <button
              type="button"
              className="save-current-btn"
              onClick={() => openSaveModalFor(currentDestination, 'favorite')}
            >
              + {t('saveDest')}
            </button>
          )}
        </div>

        {otherFavorites.length === 0 ? (
          <div className="saved-empty-state">
            <span>{t('noSavedPlaces')}</span>
          </div>
        ) : (
          <div className="saved-places-list">
            {otherFavorites.map((place) => (
              <div key={place.id} className="saved-place-item">
                <div className="saved-place-icon">⭐</div>

                <div className="saved-place-content">
                  {editingId === place.id ? (
                    <div className="saved-place-edit-row">
                      <input
                        type="text"
                        className="saved-place-edit-input"
                        value={editLabel}
                        onChange={(e) => setEditLabel(e.target.value)}
                        autoFocus
                      />
                      <button
                        type="button"
                        className="saved-place-save-edit-btn"
                        onClick={() => handleSaveEdit(place.id)}
                      >
                        {t('save')}
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="saved-place-title-row">
                        <span className="saved-place-label">{place.label}</span>
                        <button
                          type="button"
                          className="saved-place-rename-btn"
                          title={t('rename')}
                          onClick={() => handleStartEdit(place)}
                        >
                          ✎
                        </button>
                      </div>
                      <span className="saved-place-sub">{place.location.address || place.location.name}</span>
                    </>
                  )}
                </div>

                <div className="saved-place-item-actions">
                  <button
                    type="button"
                    className="action-pill-btn"
                    title={t('routeTo')}
                    onClick={() => onSelectPlaceAsDestination(place.location)}
                  >
                    {t('routeTo')}
                  </button>
                  <button
                    type="button"
                    className="action-pill-btn"
                    style={{ background: 'rgba(33, 94, 97, 0.25)', borderColor: 'rgba(33, 94, 97, 0.6)', color: '#a5e2e4' }}
                    title={t('routeFrom')}
                    onClick={() => onSelectPlaceAsStart(place.location)}
                  >
                    {t('routeFrom')}
                  </button>
                  <button
                    type="button"
                    className="action-icon-delete"
                    title={t('delete')}
                    onClick={() => onDeletePlace(place.id)}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 3. Recent Routes */}
      <section className="saved-section">
        <div className="saved-section-header">
          <h4 className="saved-section-title">{t('recentRoutes')} ({recentRoutes.length})</h4>
          {recentRoutes.length > 0 && (
            <button
              type="button"
              className="clear-recent-btn"
              onClick={onClearRecentRoutes}
            >
              {t('clear')}
            </button>
          )}
        </div>

        {recentRoutes.length === 0 ? (
          <div className="saved-empty-state">
            <span>{t('noRecentRoutes')}</span>
          </div>
        ) : (
          <div className="recent-routes-list">
            {recentRoutes.map((route) => {
              const stopsCount = route.waypoints ? route.waypoints.length : 0;
              return (
                <div
                  key={route.id}
                  className="recent-route-card"
                  onClick={() => onSelectRecentRoute(route)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="recent-route-path">
                    <div className="recent-route-node">
                      <span className="node-dot start-dot" />
                      <span className="node-text">{route.start.name}</span>
                    </div>
                    {stopsCount > 0 && (
                      <div className="recent-route-stops-tag">
                        +{stopsCount} {t('stepsCount')}
                      </div>
                    )}
                    <div className="recent-route-node">
                      <span className="node-dot dest-dot" />
                      <span className="node-text">{route.destination.name}</span>
                    </div>
                  </div>

                  <div className="recent-route-meta">
                    {route.travelTimeInSeconds && (
                      <span className="recent-route-time">
                        {formatDuration(route.travelTimeInSeconds)}
                      </span>
                    )}
                    {route.lengthInMeters && (
                      <span className="recent-route-dist">
                        ({formatDistance(route.lengthInMeters, preferences.distanceUnit)})
                      </span>
                    )}
                    <span className="recent-route-arrow">➔</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. User Preferences */}
      <section className="saved-section preferences-section">
        <h4 className="saved-section-title">{t('preferences')}</h4>
        <div className="preferences-grid">
          {/* Distance Units */}
          <div className="pref-row">
            <span className="pref-label">{t('distanceUnits')}</span>
            <div className="pref-toggle-group">
              <button
                type="button"
                className={`pref-toggle-btn ${preferences.distanceUnit === 'km' ? 'is-active' : ''}`}
                onClick={() => onUpdatePreferences({ distanceUnit: 'km' })}
              >
                {t('kilometers')}
              </button>
              <button
                type="button"
                className={`pref-toggle-btn ${preferences.distanceUnit === 'mi' ? 'is-active' : ''}`}
                onClick={() => onUpdatePreferences({ distanceUnit: 'mi' })}
              >
                {t('miles')}
              </button>
            </div>
          </div>

          {/* Traffic Default */}
          <div className="pref-row">
            <span className="pref-label">{t('defaultTraffic')}</span>
            <div className="pref-toggle-group">
              <button
                type="button"
                className={`pref-toggle-btn ${preferences.trafficDefault ? 'is-active' : ''}`}
                onClick={() => onUpdatePreferences({ trafficDefault: true })}
              >
                {t('trafficEnabled')}
              </button>
              <button
                type="button"
                className={`pref-toggle-btn ${!preferences.trafficDefault ? 'is-active' : ''}`}
                onClick={() => onUpdatePreferences({ trafficDefault: false })}
              >
                {t('trafficDisabled')}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Save Place Dialog Modal */}
      {showSaveModal && modalLocation && (
        <div className="save-modal-backdrop" onClick={() => setShowSaveModal(false)}>
          <div className="save-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="save-modal-header">
              <h3 className="save-modal-title">{t('savePlaceModalTitle')}</h3>
              <button
                type="button"
                className="save-modal-close"
                onClick={() => setShowSaveModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmSave} className="save-modal-form">
              <div className="save-modal-field">
                <label className="save-modal-label">{t('placeNameLabel')}</label>
                <input
                  type="text"
                  className="save-modal-input"
                  value={modalLabel}
                  onChange={(e) => setModalLabel(e.target.value)}
                  placeholder={t('placeNamePlaceholder')}
                  autoFocus
                  required
                />
              </div>

              <div className="save-modal-field">
                <label className="save-modal-label">{t('categoryLabel')}</label>
                <div className="save-modal-categories">
                  <button
                    type="button"
                    className={`category-pill ${modalCategory === 'home' ? 'is-active' : ''}`}
                    onClick={() => setModalCategory('home')}
                  >
                    🏠 {t('home')}
                  </button>
                  <button
                    type="button"
                    className={`category-pill ${modalCategory === 'work' ? 'is-active' : ''}`}
                    onClick={() => setModalCategory('work')}
                  >
                    💼 {t('work')}
                  </button>
                  <button
                    type="button"
                    className={`category-pill ${modalCategory === 'favorite' ? 'is-active' : ''}`}
                    onClick={() => setModalCategory('favorite')}
                  >
                    ⭐ {t('favorite')}
                  </button>
                </div>
              </div>

              <div className="save-modal-address-preview">
                <span className="preview-label">Location:</span>
                <span className="preview-text">{modalLocation.name}</span>
              </div>

              <div className="save-modal-actions">
                <button
                  type="button"
                  className="save-modal-cancel-btn"
                  onClick={() => setShowSaveModal(false)}
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="save-modal-confirm-btn"
                  disabled={!modalLabel.trim()}
                >
                  {t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
