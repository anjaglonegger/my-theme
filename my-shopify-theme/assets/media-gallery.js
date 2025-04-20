if (!customElements.get('media-gallery')) {
  customElements.define('media-gallery', class MediaGallery extends HTMLElement {
    constructor() {
      super();
      
      // Initialize core elements
      this.elements = {
        viewer: this.querySelector('.gallery-viewer'),
        thumbnails: this.querySelector('.thumbnail-slider')
      };
      
      if (!this.elements.viewer || !this.elements.thumbnails) return;
      
      // Get media items and thumbnail buttons
      this.mediaItems = this.elements.viewer.querySelectorAll('.product__media-item');
      this.thumbnailSlides = this.elements.thumbnails.querySelectorAll('.slider__slide');
      
      // Add click handlers to thumbnail slides
      this.thumbnailSlides.forEach(slide => {
        slide.addEventListener('click', this.onThumbnailClick.bind(this));
      });
      
      // Set initial state
      this.initializeGallery();
    }
    
    initializeGallery() {
      // Find the active media item
      let activeMediaId = '';
      this.mediaItems.forEach(item => {
        if (window.getComputedStyle(item).display !== 'none') {
          activeMediaId = item.dataset.mediaId;
        }
      });
      
      // If no active media found, use the first one
      if (!activeMediaId && this.mediaItems.length > 0) {
        activeMediaId = this.mediaItems[0].dataset.mediaId;
        this.mediaItems[0].style.display = 'block';
      }
      
      // Update thumbnails visibility based on active media
      this.updateThumbnailsVisibility(activeMediaId);
    }
    
    onThumbnailClick(event) {
      const slide = event.currentTarget;
      const targetId = slide.getAttribute('data-target');
      if (!targetId) return;
      
      const mediaId = targetId.split('-')[1];
      
      // Update main image
      this.mediaItems.forEach(item => {
        if (item.dataset.mediaId === mediaId) {
          item.style.display = 'block';
        } else {
          item.style.display = 'none';
        }
      });
      
      // Update thumbnails visibility
      this.updateThumbnailsVisibility(mediaId);
    }
    
    updateThumbnailsVisibility(activeMediaId) {
      // Check if we're in mobile view
      const isMobileView = window.innerWidth < 750;
      
      if (isMobileView) {
        // In mobile view, show all thumbnails and don't hide any
        this.thumbnailSlides.forEach(slide => {
          slide.style.display = 'inline-block';
          slide.style.visibility = 'visible';
          slide.style.opacity = '1';
        });
        return;
      }
      
      // Desktop behavior - show all thumbnails first
      this.thumbnailSlides.forEach(slide => {
        slide.style.display = 'block';
      });
      
      // Hide the thumbnail that matches the active media (desktop only)
      const activeSlide = this.elements.thumbnails.querySelector(`[data-target="ProductMedia-${activeMediaId}"]`);
      if (activeSlide) {
        activeSlide.style.display = 'none';
      }
    }
  });
}
