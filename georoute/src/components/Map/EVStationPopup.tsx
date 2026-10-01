import React from 'react';
import { EVStation } from '../../services/tomtom/evStations';
import { useI18n } from '../../i18n/I18nContext';
import './EVStationPopup.css';

interface EVStationPopupProps {
  station: EVStation;
  onClose: () => void;
  onSetAsWaypoint?: (station: EVStation) => void;
}

export const EVStationPopup: React.FC<EVStationPopupProps> = ({
  station,
  onClose,
  onSetAsWaypoint,
}) => {
  const { language } = useI18n();
  const isAr = language === 'ar';

  const statusLabel =
    station.status === 'available'
      ? (isAr ? 'شواحن متاحة الآن' : 'Available Now')
      : station.status === 'occupied'
      ? (isAr ? 'جميع الشواحن مشغولة' : 'All Occupied')
      : station.status === 'outOfService'
      ? (isAr ? 'خارج الخدمة' : 'Out of Service')
      : (isAr ? 'الحالة غير محددة' : 'Status Unknown');

  const statusColorClass =
    station.status === 'available'
      ? 'status-available'
      : station.status === 'occupied'
      ? 'status-occupied'
      : station.status === 'outOfService'
      ? 'status-out'
      : 'status-unknown';

  return (
    <div className="ev-popup-card">
      <div className="ev-popup-header">
        <div className="ev-popup-title-group">
          <div className="ev-popup-icon-badge">⚡</div>
          <div>
            <h4 className="ev-popup-title">{station.name}</h4>
            <p className="ev-popup-address">{station.address}</p>
          </div>
        </div>
        <button
          type="button"
          className="ev-popup-close"
          onClick={onClose}
          aria-label="Close EV details"
        >
          ×
        </button>
      </div>

      <div className={`ev-popup-status-badge ${statusColorClass}`}>
        <span className="ev-status-dot" />
        <span>{statusLabel}</span>
      </div>

      <div className="ev-connectors-section">
        <div className="ev-connectors-title">
          {isAr ? 'المنافذ والقدرة الكهربائية:' : 'Connectors & Charging Power:'}
        </div>

        {station.connectors && station.connectors.length > 0 ? (
          <div className="ev-connectors-list">
            {station.connectors.map((c, i) => (
              <div key={i} className="ev-connector-row">
                <div className="ev-connector-info">
                  <span className="ev-connector-type">{c.type}</span>
                  {c.powerKW && (
                    <span className="ev-connector-power">{c.powerKW} kW</span>
                  )}
                </div>
                <div className="ev-connector-counts">
                  <span className="ev-avail-count">
                    {isAr
                      ? `متاح ${c.available} من ${c.total}`
                      : `${c.available} / ${c.total} free`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="ev-no-connectors">
            {isAr
              ? 'تتوافر محطة الشحن، لكن بيانات التوافر الحية غير منشورة لهذه النقطة.'
              : 'Station exists, but live connector telemetry is currently unlisted.'}
          </div>
        )}
      </div>

      {onSetAsWaypoint && (
        <button
          type="button"
          className="ev-add-stop-btn"
          onClick={() => onSetAsWaypoint(station)}
        >
          {isAr ? '+ إضافة كمحطة توقف بالمسار' : '+ Add as Stop on Route'}
        </button>
      )}
    </div>
  );
};
