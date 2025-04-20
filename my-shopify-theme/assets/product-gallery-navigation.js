document.addEventListener('DOMContentLoaded', function() {
  // Initialize product gallery navigation
  function initProductGalleryNavigation() {
    // Check if we're in mobile view (skip initialization)
    if (window.innerWidth < 750) {
      return;
    }
    
    // Find the navigation container
    const navContainer = document.querySelector('.product-gallery-nav');
    if (!navContainer) return;

    // Get navigation elements
    const prevButton = navContainer.querySelector('.slider-button--prev');
    const nextButton = navContainer.querySelector('.slider-button--next');
    const counter = navContainer.querySelector('.gallery-counter');
    
    // Find media items
    const galleryViewer = document.querySelector('.gallery-viewer');
    if (!galleryViewer) return;
    
    const mediaItems = Array.from(galleryViewer.querySelectorAll('.product__media-item'));
    const totalSlides = mediaItems.length;
    
    // Get thumbnail slides
    const thumbnailSlider = document.querySelector('.thumbnail-slider');
    const thumbnailSlides = thumbnailSlider ? 
      Array.from(thumbnailSlider.querySelectorAll('.slider__slide')) : [];
    
    // Set initial state
    let currentIndex = getCurrentIndex();
    updateCounter(currentIndex + 1, totalSlides);
    updateButtonState(currentIndex, totalSlides);
    
    // Add event listeners
    if (prevButton) {
      prevButton.addEventListener('click', goToPrevSlide);
    }
    
    if (nextButton) {
      nextButton.addEventListener('click', goToNextSlide);
    }
    
    function getCurrentIndex() {
      const activeItem = mediaItems.find(item => 
        window.getComputedStyle(item).display !== 'none');
      return activeItem ? mediaItems.indexOf(activeItem) : 0;
    }
    
    function goToPrevSlide() {
      const currentIndex = getCurrentIndex();
      if (currentIndex > 0) {
        showSlide(currentIndex);
      }
    }
    
    function goToNextSlide() {
      const currentIndex = getCurrentIndex();
      if (currentIndex < totalSlides - 1) {
        showSlide(currentIndex);
      }
    }
    
    function showSlide(index) {
      // Update media items - using display: block to ensure correct visibility
      mediaItems.forEach((item, i) => {
        if (i === index) {
          item.style.display = 'block';
        } else {
          item.style.display = 'none';
        }
      });
      
      // Update thumbnails visibility by matching media-id with data-target
      if (thumbnailSlides.length > 0) {
        const activeMediaId = mediaItems[index].dataset.mediaId;
        thumbnailSlides.forEach((slide) => {
          const slideTarget = slide.getAttribute('data-target');
          const slideMediaId = slideTarget ? slideTarget.split('-')[1] : null;
          
          if (slideMediaId === activeMediaId) {
            slide.style.display = 'none';
          } else {
            slide.style.display = 'block';
          }
        });
      }
      
      // Update counter and button states
      updateCounter(index + 1, totalSlides);
      updateButtonState(index, totalSlides);
    }
    
    function updateCounter(current, total) {
      if (counter) {
        counter.textContent = `${current} / ${total}`;
      }
    }
    
    function updateButtonState(index, total) {
      if (prevButton) {
        prevButton.disabled = index === 0;
      }
      
      if (nextButton) {
        nextButton.disabled = index === total - 1;
      }
    }
  }
  
  // Run initialization
  initProductGalleryNavigation();
  
  // Re-initialize on window resize
  let resizeTimeout;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      initProductGalleryNavigation();
    }, 250);
  });
});