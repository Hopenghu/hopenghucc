import { LocationCard } from './LocationCard.js';

export class LocationCardGrid {
  constructor(locations, options = {}) {
    this.locations = locations || [];
    this.options = {
      columns: {
        mobile: 2,
        tablet: 3,
        desktop: 4
      },
      cardSize: 'default',
      showStatusButtons: true,
      showInteractionCounts: false,
      onCardClick: 'handleLocationCardClick',
      onStatusUpdate: 'updateLocationStatus',
      ...options
    };
  }

  render() {
    if (this.locations.length === 0) {
      return this.renderEmptyState();
    }

    const gridClasses = this.getGridClasses();
    
    return `
      <div class="${gridClasses}">
        ${this.locations.map(location => {
          const locationCard = new LocationCard(location, {
            size: this.options.cardSize,
            showStatusButtons: this.options.showStatusButtons,
            showInteractionCounts: this.options.showInteractionCounts,
            onCardClick: this.options.onCardClick,
            onStatusUpdate: this.options.onStatusUpdate
          });
          return locationCard.render();
        }).join('')}
      </div>
    `;
  }

  getGridClasses() {
    const { mobile, tablet, desktop } = this.options.columns;
    return `grid grid-cols-${mobile} md:grid-cols-${tablet} lg:grid-cols-${desktop} gap-4 md:gap-6`;
  }

  renderEmptyState() {
    return `
      <div class="text-center py-12">
        <div class="text-gray-400 mb-4">
          <svg class="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">還沒有地點</h3>
        <p class="text-gray-500 mb-6">開始探索並記錄您的地點吧！</p>
        <a href="/" class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
          <svg class="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          瀏覽地點
        </a>
      </div>
    `;
  }
} 