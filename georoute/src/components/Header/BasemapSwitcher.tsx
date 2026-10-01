import React, { useState, useRef, useEffect } from 'react';
import { BasemapStyle } from '../../utils/routeColors';
import { useI18n } from '../../i18n/I18nContext';
import './BasemapSwitcher.css';

interface BasemapSwitcherProps {
  currentBasemap: BasemapStyle;
  onSelectBasemap: (basemap: BasemapStyle) => void;
}

export const BasemapSwitcher: React.FC<BasemapSwitcherProps> = ({
  currentBasemap,
  onSelectBasemap,
}) => {
  const { language } = useI18n();
  const isAr = language === 'ar';
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const stylesList: Array<{
    id: BasemapStyle;
    nameAr: string;
    nameEn: string;
    icon: string;
  }> = [
    { id: 'standardDark', nameAr: 'داكن قياسي', nameEn: 'Standard Dark', icon: '🌙' },
    { id: 'standardLight', nameAr: 'فاتح قياسي', nameEn: 'Standard Light', icon: '☀️' },
    { id: 'drivingDark', nameAr: 'وضع القيادة (ليلي)', nameEn: 'Driving Dark', icon: '🚗' },
    { id: 'drivingLight', nameAr: 'وضع القيادة (نهاري)', nameEn: 'Driving Light', icon: '🏎️' },
    { id: 'monoDark', nameAr: 'أحادي داكن (مبسّط)', nameEn: 'Mono Dark', icon: '🖤' },
    { id: 'monoLight', nameAr: 'أحادي فاتح (مبسّط)', nameEn: 'Mono Light', icon: '🤍' },
    { id: 'satellite', nameAr: 'قمر صناعي', nameEn: 'Satellite', icon: '🛰️' },
  ];

  const currentOption = stylesList.find((s) => s.id === currentBasemap) || stylesList[0];

  return (
    <div ref={dropdownRef} className="basemap-switcher-container">
      <button
        type="button"
        className={`basemap-switcher-btn ${isOpen ? 'is-open' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        title={isAr ? 'تغيير شكل الخريطة الأساسية' : 'Change Basemap Style'}
        aria-label="Change basemap style"
        aria-expanded={isOpen}
      >
        <span className="basemap-btn-icon">🗺️</span>
        <span className="basemap-btn-label">
          {isAr ? currentOption.nameAr : currentOption.nameEn}
        </span>
        <span className="basemap-chevron">▾</span>
      </button>

      {isOpen && (
        <div className="basemap-dropdown-menu" role="menu">
          <div className="basemap-menu-header">
            {isAr ? 'أنماط الخريطة' : 'Basemap Styles'}
          </div>
          {stylesList.map((item) => {
            const isSelected = item.id === currentBasemap;
            return (
              <button
                key={item.id}
                type="button"
                role="menuitem"
                className={`basemap-menu-item ${isSelected ? 'is-selected' : ''}`}
                onClick={() => {
                  onSelectBasemap(item.id);
                  setIsOpen(false);
                }}
              >
                <span className="item-icon">{item.icon}</span>
                <span className="item-label">
                  {isAr ? item.nameAr : item.nameEn}
                </span>
                {isSelected && <span className="item-check">✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
