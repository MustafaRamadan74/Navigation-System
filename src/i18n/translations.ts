export type Language = 'ar' | 'en';

export interface Translations {
  appName: string;
  tabDirections: string;
  tabSaved: string;
  startPlaceholder: string;
  destPlaceholder: string;
  waypointPlaceholder: string;
  swapTooltip: string;
  useMyLocation: string;
  locating: string;
  addStop: string;
  removeStop: string;
  home: string;
  work: string;
  setHome: string;
  setWork: string;
  saveDest: string;
  fastestRoute: string;
  alternativeRoute: string;
  arrival: string;
  usualTraffic: string;
  trafficDelay: string;
  turnByTurn: string;
  stepsCount: string;
  geoJsonExport: string;
  gpxExport: string;
  share: string;
  copied: string;
  routeUnavailable: string;
  retry: string;
  quickPlaces: string;
  savedPlaces: string;
  noSavedPlaces: string;
  recentRoutes: string;
  noRecentRoutes: string;
  clear: string;
  clearAll: string;
  recentSearches: string;
  searchingLocations: string;
  noResultsFound: string;
  searchFailed: string;
  preferences: string;
  distanceUnits: string;
  kilometers: string;
  miles: string;
  defaultTraffic: string;
  trafficEnabled: string;
  trafficDisabled: string;
  language: string;
  theme: string;
  lightMode: string;
  darkMode: string;
  savePlaceModalTitle: string;
  placeNameLabel: string;
  placeNamePlaceholder: string;
  categoryLabel: string;
  favorite: string;
  cancel: string;
  save: string;
  rename: string;
  delete: string;
  routeTo: string;
  routeFrom: string;
  trafficToggle: string;
  trafficFlowLegend: string;
  trafficOn: string;
  trafficOff: string;
  flowFast: string;
  flowModerate: string;
  flowSlow: string;
  flowBlocked: string;
  liveIncidents: string;
  notSet: string;
  searchFirst: string;
  go: string;
  startDriving: string;
  exitDriving: string;
  navigating: string;
  modeGeneral: string;
  modeDelivery: string;
  modeEv: string;
  modePlanner: string;
  modeCar: string;
  modeMotorcycle: string;
  modePedestrian: string;
  optimizeDelivery: string;
  evStations: string;
  bestTime: string;
  reRouting: string;
  whereTo: string;
  editRoute: string;
  viewRoute: string;
  startNavigation: string;
  simulateRoute: string;
}

export const translations: Record<Language, Translations> = {
  ar: {
    appName: 'جيو روت',
    tabDirections: 'الاتجاهات',
    tabSaved: 'المحفوظات والسجل',
    startPlaceholder: 'اختر نقطة الانطلاق...',
    destPlaceholder: 'اختر الوجهة...',
    waypointPlaceholder: 'إضافة نقطة توقف...',
    swapTooltip: 'تبديل نقطة الانطلاق والوجهة',
    useMyLocation: 'استخدم موقعي',
    locating: 'جارٍ التحديد...',
    addStop: '+ إضافة توقف',
    removeStop: 'إزالة هذه المحطة',
    home: 'المنزل',
    work: 'العمل',
    setHome: 'تحديد المنزل',
    setWork: 'تحديد العمل',
    saveDest: 'حفظ الوجهة',
    fastestRoute: 'المسار الأسرع',
    alternativeRoute: 'مسار بديل',
    arrival: 'الوصول',
    usualTraffic: 'حركة المرور عادية',
    trafficDelay: 'تأخير',
    turnByTurn: 'الإرشادات خطوة بخطوة',
    stepsCount: 'خطوة',
    geoJsonExport: 'GeoJSON',
    gpxExport: 'GPX',
    share: 'مشاركة',
    copied: 'تم النسخ! ✓',
    routeUnavailable: 'تعذر حساب المسار',
    retry: 'إعادة المحاولة',
    quickPlaces: 'أماكن سريعة',
    savedPlaces: 'الأماكن المحفوظة',
    noSavedPlaces: 'لا توجد أماكن محفوظة بعد. احفظ وجهاتك المفضلة للوصول السريع.',
    recentRoutes: 'المسارات السابقة',
    noRecentRoutes: 'ستظهر المسارات المحسوبة هنا لسرعة اختيارها.',
    clear: 'مسح',
    clearAll: 'مسح الكل',
    recentSearches: 'عمليات البحث الأخيرة',
    searchingLocations: 'جارٍ البحث عن الأماكن...',
    noResultsFound: 'لم يتم العثور على نتائج لـ',
    searchFailed: 'تعذر البحث، يرجى المحاولة مرة أخرى.',
    preferences: 'الإعدادات الشخصية',
    distanceUnits: 'وحدة قياس المسافة',
    kilometers: 'كيلومتر (كم)',
    miles: 'ميل (mi)',
    defaultTraffic: 'حالة المرور التلقائية',
    trafficEnabled: 'مفعّلة',
    trafficDisabled: 'معطّلة',
    language: 'اللغة',
    theme: 'المظهر',
    lightMode: 'فاتح',
    darkMode: 'داكن',
    savePlaceModalTitle: 'حفظ المكان',
    placeNameLabel: 'اسم المكان',
    placeNamePlaceholder: 'مثال: منزلي، النادي، العمل',
    categoryLabel: 'التصنيف',
    favorite: 'مفضلة',
    cancel: 'إلغاء',
    save: 'حفظ',
    rename: 'إعادة تسمية',
    delete: 'حذف',
    routeTo: 'إلى',
    routeFrom: 'من',
    trafficToggle: 'المرور',
    trafficFlowLegend: 'دليل حركة السيارات',
    trafficOn: 'يعمل',
    trafficOff: 'متوقف',
    flowFast: 'سريع / سالك',
    flowModerate: 'متوسط',
    flowSlow: 'بطيء جداً',
    flowBlocked: 'مغلق / متوقف',
    liveIncidents: 'حوادث معطلة حية (انقر للمعاينة)',
    notSet: 'غير محدد',
    searchFirst: 'ابحث للمعاينة',
    go: 'انطلق',
    startDriving: 'بدء القيادة والملاحة',
    exitDriving: 'إنهاء الملاحة',
    navigating: 'جارِ الملاحة الحية',
    modeGeneral: 'تنقل عام',
    modeDelivery: 'توصيل',
    modeEv: 'شحن EV',
    modePlanner: 'مخطط الوقت',
    modeCar: 'سيارة',
    modeMotorcycle: 'موتوسيكل',
    modePedestrian: 'مشي',
    optimizeDelivery: 'ترتيب محطات التوصيل تلقائياً',
    evStations: 'محطات الشحن (EV)',
    bestTime: 'أفضل وقت للانطلاق',
    reRouting: 'تم رصد خروج عن المسار، جارِ إعادة الحساب...',
    whereTo: 'إلى أين تريد الذهاب؟',
    editRoute: 'تعديل المسار',
    viewRoute: 'عرض المسار',
    startNavigation: 'ابدأ القيادة',
    simulateRoute: 'محاكاة',
  },
  en: {
    appName: 'GeoRoute',
    tabDirections: 'Directions',
    tabSaved: 'Saved & History',
    startPlaceholder: 'Choose start point...',
    destPlaceholder: 'Choose destination...',
    waypointPlaceholder: 'Add stop...',
    swapTooltip: 'Swap start and destination',
    useMyLocation: 'Use my location',
    locating: 'Locating...',
    addStop: '+ Add stop',
    removeStop: 'Remove this stop',
    home: 'Home',
    work: 'Work',
    setHome: 'Set Home',
    setWork: 'Set Work',
    saveDest: 'Save Dest',
    fastestRoute: 'Fastest Route',
    alternativeRoute: 'Alternative Route',
    arrival: 'Arrival',
    usualTraffic: 'Usual traffic',
    trafficDelay: 'delay',
    turnByTurn: 'Turn-by-turn directions',
    stepsCount: 'steps',
    geoJsonExport: 'GeoJSON',
    gpxExport: 'GPX',
    share: 'Share',
    copied: 'Copied! ✓',
    routeUnavailable: 'Route Unavailable',
    retry: 'Retry Route Calculation',
    quickPlaces: 'Quick Places',
    savedPlaces: 'Saved Places',
    noSavedPlaces: 'No saved places yet. Save your favorite destinations for quick access.',
    recentRoutes: 'Recent Routes',
    noRecentRoutes: 'Calculated routes will appear here for fast re-selection.',
    clear: 'Clear',
    clearAll: 'Clear all',
    recentSearches: 'Recent Searches',
    searchingLocations: 'Searching locations...',
    noResultsFound: 'No results found for',
    searchFailed: 'Search failed. Please try again.',
    preferences: 'Preferences',
    distanceUnits: 'Distance Units',
    kilometers: 'Kilometers (km)',
    miles: 'Miles (mi)',
    defaultTraffic: 'Default Live Traffic',
    trafficEnabled: 'Enabled',
    trafficDisabled: 'Disabled',
    language: 'Language',
    theme: 'Theme',
    lightMode: 'Light',
    darkMode: 'Dark',
    savePlaceModalTitle: 'Save Place',
    placeNameLabel: 'Place Name',
    placeNamePlaceholder: 'e.g. My Apartment, Gym, Office',
    categoryLabel: 'Category',
    favorite: 'Favorite',
    cancel: 'Cancel',
    save: 'Save Place',
    rename: 'Rename',
    delete: 'Delete',
    routeTo: 'To',
    routeFrom: 'From',
    trafficToggle: 'Traffic',
    trafficFlowLegend: 'Live Traffic Flow',
    trafficOn: 'ON',
    trafficOff: 'OFF',
    flowFast: 'Fast / Free flow',
    flowModerate: 'Moderate',
    flowSlow: 'Heavy delay',
    flowBlocked: 'Blocked / Closed',
    liveIncidents: 'Live Incidents (clickable)',
    notSet: 'Not set',
    searchFirst: 'Search first',
    go: 'Go',
    startDriving: 'Start Navigation',
    exitDriving: 'Exit Navigation',
    navigating: 'Navigating',
    modeGeneral: 'General',
    modeDelivery: 'Delivery',
    modeEv: 'EV Trip',
    modePlanner: 'Planner',
    modeCar: 'Car',
    modeMotorcycle: 'Motorcycle',
    modePedestrian: 'Walking',
    optimizeDelivery: 'Optimize Delivery Stops',
    evStations: 'EV Chargers',
    bestTime: 'Best Time to Leave',
    reRouting: 'Deviation detected, recalculating route...',
    whereTo: 'Where to?',
    editRoute: 'Edit Route',
    viewRoute: 'View Map',
    startNavigation: 'Start Navigation',
    simulateRoute: 'Simulate',
  },
};
