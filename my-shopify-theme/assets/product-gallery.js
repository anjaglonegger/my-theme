document.addEventListener('DOMContentLoaded', function() {
  // Find the product media wrapper
  const mediaWrapper = document.querySelector('.product__media-wrapper');
  if (!mediaWrapper) return;
  
  // Find the thumbnails and main image container
  const thumbnailSlider = mediaWrapper.querySelector('.thumbnail-slider');
  const galleryViewer = mediaWrapper.querySelector('.gallery-viewer');
  const mobileDots = document.querySelectorAll('.mobile-gallery-dots .mobile-gallery-dot');
  if (!thumbnailSlider) return;
  
  // Get all thumbnail slides and main image items
  const slides = thumbnailSlider.querySelectorAll('.slider__slide:not(.slider__slide-clone)');
  const mediaItems = galleryViewer ? galleryViewer.querySelectorAll('.product__media-item') : [];
  
  // Check if we're in mobile view
  let isMobileView = window.innerWidth < 750;
  
  // Force all slides to be display:block in mobile view
  function forceShowAllThumbnails() {
    slides.forEach(slide => {
      slide.style.display = 'inline-block'; // Changed to inline-block for better row layout
      slide.style.visibility = 'visible';
      slide.style.opacity = '1';
    });
  }
  
  // Function to update mobile gallery dots based on active slide index
  function updateMobileDots(activeIndex) {
    if (!mobileDots.length) return;
    
    // Convert to number if it's a string
    const index = typeof activeIndex === 'string' ? parseInt(activeIndex, 10) : activeIndex;
    
    // Handle wrapping for endless loop - normalize index to actual dot count
    const normalizedIndex = ((index % mobileDots.length) + mobileDots.length) % mobileDots.length;
    
    mobileDots.forEach(dot => {
      const dotIndex = parseInt(dot.getAttribute('data-index'), 10);
      if (dotIndex === normalizedIndex) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });
  }
  
  // Function to determine which slide is most visible in the viewport
  function getMostVisibleSlide() {
    // Get all slides including clones for proper infinite scrolling
    const allSlides = thumbnailSlider.querySelectorAll('.slider__slide');
    if (!allSlides.length) return null;
    
    let maxVisibleArea = 0;
    let mostVisibleSlide = null;
    const sliderRect = thumbnailSlider.getBoundingClientRect();
    
    allSlides.forEach(slide => {
      const slideRect = slide.getBoundingClientRect();
      
      // Calculate the intersection between the slide and the slider container
      const xOverlap = Math.max(0, Math.min(slideRect.right, sliderRect.right) - Math.max(slideRect.left, sliderRect.left));
      const yOverlap = Math.max(0, Math.min(slideRect.bottom, sliderRect.bottom) - Math.max(slideRect.top, sliderRect.top));
      const overlapArea = xOverlap * yOverlap;
      
      // If this slide has more visible area than previous max, update the most visible slide
      if (overlapArea > maxVisibleArea) {
        maxVisibleArea = overlapArea;
        mostVisibleSlide = slide;
      }
    });
    
    return mostVisibleSlide;
  }
  
  // Function to update UI based on the most visible slide
  function updateUIFromVisibleSlide() {
    if (!isMobileView) return;
    
    const visibleSlide = getMostVisibleSlide();
    if (!visibleSlide) return;
    
    // Get the index from data-index or data-original-index if it's a clone
    let index;
    if (visibleSlide.classList.contains('slider__slide-clone')) {
      // For cloned slides, use their original index
      index = visibleSlide.getAttribute('data-original-index');
    } else {
      index = visibleSlide.getAttribute('data-index');
    }
    
    if (index) {
      // Update dots based on the real slide index, not clone index
      const numericIndex = parseInt(index, 10);
      updateMobileDots(numericIndex);
      
      // Update active class on thumbnails - mark both original and clones of the same slide
      const allSlides = thumbnailSlider.querySelectorAll('.slider__slide');
      allSlides.forEach(s => {
        // Check if this is the matching original slide
        const isMatchingOriginal = s.getAttribute('data-index') === index && !s.classList.contains('slider__slide-clone');
        
        // Check if this is a clone of the matching slide
        const isMatchingClone = s.getAttribute('data-original-index') === index && s.classList.contains('slider__slide-clone');
        
        // Add or remove active class based on match
        if (isMatchingOriginal || isMatchingClone) {
          s.classList.add('active-mobile-thumbnail');
        } else {
          s.classList.remove('active-mobile-thumbnail');
        }
      });
    }
  }
  
  // Add scroll event to detect when thumbnails are scrolled in mobile view
  let isScrolling;
  thumbnailSlider.addEventListener('scroll', function() {
    // Clear the existing timeout
    window.clearTimeout(isScrolling);
    
    // Set a timeout to run after scrolling ends
    isScrolling = setTimeout(function() {
      if (isMobileView) {
        updateUIFromVisibleSlide();
        
        // Handle infinite loop scrolling
        handleInfiniteScroll();
      }
    }, 66); // Reduced for better responsiveness
  });

  // Function to handle infinite scroll behavior
  function handleInfiniteScroll() {
    if (!isMobileView || slides.length <= 1) return;
    
    const scrollPosition = thumbnailSlider.scrollLeft;
    const scrollWidth = thumbnailSlider.scrollWidth;
    const clientWidth = thumbnailSlider.clientWidth;
    const slideWidth = slides[0].offsetWidth;
    const gapWidth = parseInt(window.getComputedStyle(thumbnailSlider).gap || '0', 10);
    const totalWidth = slideWidth + gapWidth;
    
    // Get the cloned slides count
    const beginningClones = thumbnailSlider.querySelectorAll('.beginning-clone');
    const endClones = thumbnailSlider.querySelectorAll('.end-clone');
    const beginningClonesCount = beginningClones.length;
    const endClonesCount = endClones.length;
    
    // Calculate threshold for when to jump
    const realSlidesCount = slides.length;
    const realSlidesWidth = realSlidesCount * totalWidth;
    
    // Create more aggressive thresholds for smoother looping
    // We need to detect when user is closer to the end of clones and jump earlier
    const jumpBuffer = totalWidth; // Jump one whole slide width earlier
    const beginningThreshold = beginningClonesCount * totalWidth - jumpBuffer;
    const endThreshold = beginningClonesCount * totalWidth + realSlidesWidth + jumpBuffer;
    
    // Check if we're near the beginning (scrolled too far left)
    if (scrollPosition <= beginningThreshold) {
      // Use a more accurate jump calculation - jump exactly one set of real slides over
      const jumpToPosition = scrollPosition + realSlidesWidth;
      
      // Use a gentle transition with requestAnimationFrame for better performance
      requestAnimationFrame(() => {
        // Temporarily disable smooth scrolling for the jump
        thumbnailSlider.style.scrollBehavior = 'auto';
        thumbnailSlider.scrollTo({
          left: jumpToPosition,
          behavior: 'auto'
        });
        
        // Re-enable smooth scrolling after the jump
        setTimeout(() => {
          thumbnailSlider.style.scrollBehavior = 'smooth';
          // Make sure to update UI after the jump to ensure dots are in sync
          updateUIFromVisibleSlide();
        }, 10);
      });
    } 
    // Check if we're near the end (scrolled too far right)
    else if (scrollPosition >= endThreshold) {
      // Use a more accurate jump calculation - jump exactly one set of real slides back
      const jumpToPosition = scrollPosition - realSlidesWidth;
      
      // Use a gentle transition with requestAnimationFrame for better performance
      requestAnimationFrame(() => {
        // Temporarily disable smooth scrolling for the jump
        thumbnailSlider.style.scrollBehavior = 'auto';
        thumbnailSlider.scrollTo({
          left: jumpToPosition,
          behavior: 'auto'
        });
        
        // Re-enable smooth scrolling after the jump
        setTimeout(() => {
          thumbnailSlider.style.scrollBehavior = 'smooth';
          // Make sure to update UI after the jump to ensure dots are in sync
          updateUIFromVisibleSlide();
        }, 10);
      });
    }
  }

  // Detect touch events for swipe in mobile view
  let touchStartX = 0;
  let touchEndX = 0;
  
  thumbnailSlider.addEventListener('touchstart', function(e) {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });
  
  thumbnailSlider.addEventListener('touchend', function(e) {
    touchEndX = e.changedTouches[0].screenX;
    const distance = touchEndX - touchStartX;
    
    // Only update if there was a significant swipe
    if (Math.abs(distance) > 30) {
      setTimeout(() => {
        updateUIFromVisibleSlide();
        handleInfiniteScroll();
      }, 100); // Small delay to ensure scroll has settled
    }
  }, { passive: true });
  
  // Function to navigate to a specific slide (used for loop navigation)
  function goToSlide(index) {
    if (!slides.length) return;
    
    // Normalize the index to wrap around if needed
    const normalizedIndex = ((index % slides.length) + slides.length) % slides.length;
    const targetSlide = slides[normalizedIndex];
    
    if (targetSlide) {
      // Update visual state before scrolling
      slides.forEach(slide => slide.classList.remove('active-mobile-thumbnail'));
      targetSlide.classList.add('active-mobile-thumbnail');
      updateMobileDots(normalizedIndex);
      
      // Find the real slide (not clone) to ensure proper scrolling
      const realTargetSlide = thumbnailSlider.querySelector(`.slider__slide[data-index="${normalizedIndex}"]:not(.slider__slide-clone)`);
      if (realTargetSlide) {
        // Scroll the slide into view with smoother behavior
        realTargetSlide.scrollIntoView({ 
          behavior: 'smooth', 
          inline: 'center', 
          block: 'nearest' 
        });
      }
      
      // Trigger click to update the main image after scrolling completes
      setTimeout(() => {
        targetSlide.click();
      }, 300);
    }
  }
  
  // Function to navigate to next or previous slide with looping
  function navigateWithLoop(direction) {
    if (!isMobileView || !slides.length) return;
    
    const currentSlide = thumbnailSlider.querySelector('.active-mobile-thumbnail:not(.slider__slide-clone)') || 
                         slides[0];
    if (!currentSlide) return;
    
    const currentIndex = parseInt(currentSlide.getAttribute('data-index'), 10);
    let nextIndex;
    
    if (direction === 'next') {
      nextIndex = (currentIndex + 1) % slides.length;
    } else {
      nextIndex = (currentIndex - 1 + slides.length) % slides.length;
    }
    
    // Find the target slide among real slides (not clones)
    const targetSlide = slides[nextIndex];
    if (!targetSlide) return;
    
    // Check current scroll position to determine the best way to scroll
    const sliderRect = thumbnailSlider.getBoundingClientRect();
    const targetRect = targetSlide.getBoundingClientRect();
    
    // Temporarily disable smooth scrolling for immediate position change
    thumbnailSlider.style.scrollBehavior = 'auto';
    
    // Check if we should jump to maintain smooth appearance
    const scrollPosition = thumbnailSlider.scrollLeft;
    const slideWidth = targetSlide.offsetWidth;
    const gapWidth = parseInt(window.getComputedStyle(thumbnailSlider).gap || '0', 10);
    const totalWidth = slideWidth + gapWidth;
    
    // Find all versions of the target slide (including clones)
    const allTargetCandidates = thumbnailSlider.querySelectorAll(
      `.slider__slide[data-index="${nextIndex}"], .slider__slide[data-original-index="${nextIndex}"]`
    );
    
    // Find the best candidate to scroll to (closest to current view)
    let bestCandidate = targetSlide;
    let minDistance = Infinity;
    
    allTargetCandidates.forEach(candidate => {
      const candidateRect = candidate.getBoundingClientRect();
      const distance = Math.abs(candidateRect.left - sliderRect.left);
      if (distance < minDistance) {
        minDistance = distance;
        bestCandidate = candidate;
      }
    });
    
    // Scroll to the best candidate with smooth animation
    setTimeout(() => {
      thumbnailSlider.style.scrollBehavior = 'smooth';
      bestCandidate.scrollIntoView({ 
        behavior: 'smooth', 
        inline: 'center', 
        block: 'nearest' 
      });
    
      // Update the UI for immediate feedback
      slides.forEach(s => s.classList.remove('active-mobile-thumbnail'));
      targetSlide.classList.add('active-mobile-thumbnail');
      updateMobileDots(nextIndex);
      
      // Trigger the click event on the slide to update the main image
      setTimeout(() => {
        targetSlide.click();
      }, 300);
    }, 10);
  }
  
  // Initial setup
  function initializeGallery() {
    let activeMediaId = '';
    let activeIndex = 0;
    
    if (mediaItems.length > 0) {
      mediaItems.forEach((item, index) => {
        if (window.getComputedStyle(item).display !== 'none') {
          activeMediaId = item.dataset.mediaId;
          activeIndex = index;
        }
      });
      
      if (!activeMediaId && mediaItems.length > 0) {
        activeMediaId = mediaItems[0].dataset.mediaId;
        activeIndex = 0;
        mediaItems[0].style.display = 'block';
      }
      
      if (!isMobileView) {
        updateThumbnailsVisibility(activeMediaId);
      } else {
        forceShowAllThumbnails();
        updateMobileDots(activeIndex);
        
        const activeSlide = thumbnailSlider.querySelector(`[data-target="ProductMedia-${activeMediaId}"]`);
        if (activeSlide) {
          slides.forEach(s => s.classList.remove('active-mobile-thumbnail'));
          activeSlide.classList.add('active-mobile-thumbnail');
        }
      }
    }
    
    if (isMobileView) {
      const existingClones = thumbnailSlider.querySelectorAll('.slider__slide-clone');
      if (existingClones.length === 0) {
        setupInfiniteScrollPosition();
      }
      
      const activeSlide = thumbnailSlider.querySelector('.active-mobile-thumbnail');
      if (activeSlide) {
        setTimeout(() => {
          activeSlide.scrollIntoView({ 
            behavior: 'auto', 
            inline: 'center', 
            block: 'nearest' 
          });
        }, 50);
      }
    }
  }
  
  // Setup initial scroll position for infinite scrolling
  function setupInfiniteScrollPosition() {
    if (!isMobileView || slides.length <= 1) return;
    
    // Remove any existing clones to avoid duplication
    const existingClones = thumbnailSlider.querySelectorAll('.slider__slide-clone');
    existingClones.forEach(clone => clone.remove());
    
    // Calculate dimensions
    const slideWidth = slides[0].offsetWidth;
    const gapWidth = parseInt(window.getComputedStyle(thumbnailSlider).gap || '0', 10);
    const totalWidth = slideWidth + gapWidth;
    
    const viewportWidth = thumbnailSlider.clientWidth;
    // Increase number of clones for a more seamless experience
    const slidesToClone = Math.max(Math.ceil(viewportWidth / totalWidth) * 2, slides.length);
    
    // Clone slides and place them at the beginning
    for (let i = 0; i < slides.length; i++) {
      const originalIndex = slides.length - 1 - i;
      if (originalIndex < 0) break;
      
      const clone = slides[originalIndex].cloneNode(true);
      clone.classList.add('slider__slide-clone', 'beginning-clone');
      clone.setAttribute('aria-hidden', 'true');
      clone.setAttribute('data-original-index', originalIndex);
      
      clone.addEventListener('click', function() {
        if (slides[originalIndex]) {
          slides[originalIndex].click();
          updateMobileDots(originalIndex);
        }
      });
      
      thumbnailSlider.insertBefore(clone, thumbnailSlider.firstChild);
    }
    
    // Clone slides and place them at the end
    for (let i = 0; i < slides.length; i++) {
      const clone = slides[i].cloneNode(true);
      clone.classList.add('slider__slide-clone', 'end-clone');
      clone.setAttribute('aria-hidden', 'true');
      clone.setAttribute('data-original-index', i);
      
      clone.addEventListener('click', function() {
        if (slides[i]) {
          slides[i].click();
          updateMobileDots(i);
        }
      });
      
      thumbnailSlider.appendChild(clone);
    }
    
    // Position the scroll at the beginning of the real slides
    const beginningClonesCount = thumbnailSlider.querySelectorAll('.beginning-clone').length;
    const scrollToPosition = beginningClonesCount * totalWidth;
    
    // Use auto behavior for initial positioning
    thumbnailSlider.style.scrollBehavior = 'auto';
    setTimeout(() => {
      thumbnailSlider.scrollTo({
        left: scrollToPosition,
        behavior: 'auto'
      });
      
      // Switch to smooth scrolling after initial positioning
      setTimeout(() => {
        thumbnailSlider.style.scrollBehavior = 'smooth';
      }, 50);
    }, 10);
  }
  
  // Add click handlers to thumbnails
  slides.forEach(slide => {
    slide.addEventListener('click', function() {
      const targetId = this.getAttribute('data-target');
      if (!targetId) return;
      
      const mediaId = targetId.split('-')[1];
      const index = this.getAttribute('data-index');
      
      mediaItems.forEach(item => {
        if (item.dataset.mediaId === mediaId) {
          item.style.display = 'block';
        } else {
          item.style.display = 'none';
        }
      });
      
      if (!isMobileView) {
        updateThumbnailsVisibility(mediaId);
      } else {
        forceShowAllThumbnails();
        
        slides.forEach(s => {
          s.classList.remove('active-mobile-thumbnail');
        });
        slide.classList.add('active-mobile-thumbnail');
        
        const clones = thumbnailSlider.querySelectorAll('.slider__slide-clone');
        clones.forEach(clone => {
          if (clone.getAttribute('data-original-index') === index) {
            clone.classList.add('active-mobile-thumbnail');
          } else {
            clone.classList.remove('active-mobile-thumbnail');
          }
        });
        
        if (index !== null) {
          updateMobileDots(parseInt(index, 10));
          
          slides.forEach(s => {
            const fullsizeImage = s.querySelector('.mobile-fullsize-image');
            if (fullsizeImage) {
              if (s === slide) {
                fullsizeImage.style.display = 'block';
              } else {
                fullsizeImage.style.display = 'none';
              }
            }
          });
          
          clones.forEach(clone => {
            const fullsizeImage = clone.querySelector('.mobile-fullsize-image');
            if (fullsizeImage) {
              if (clone.getAttribute('data-original-index') === index) {
                fullsizeImage.style.display = 'block';
              } else {
                fullsizeImage.style.display = 'none';
              }
            }
          });
        }
        
        slide.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    });
  });
  
  // Add click handlers to mobile dots if they exist
  if (mobileDots.length > 0) {
    mobileDots.forEach(dot => {
      dot.addEventListener('click', function() {
        const index = this.getAttribute('data-index');
        if (index === null) return;
        
        updateMobileDots(parseInt(index, 10));
        
        const targetSlide = document.querySelector(`.slider__slide[data-index="${index}"]:not(.slider__slide-clone)`);
        if (targetSlide) {
          targetSlide.click();
          targetSlide.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
      });
    });
  }
  
  // Function to hide the thumbnail of the currently displayed image (desktop only)
  function updateThumbnailsVisibility(activeMediaId) {
    if (isMobileView) {
      forceShowAllThumbnails();
      return;
    }
    
    slides.forEach(slide => {
      slide.style.display = 'block';
    });
    
    const activeSlide = thumbnailSlider.querySelector(`[data-target="ProductMedia-${activeMediaId}"]`);
    if (activeSlide && !isMobileView) {
      activeSlide.style.display = 'none';
    }
  }
  
  window.addEventListener('resize', debounce(function() {
    const newIsMobileView = window.innerWidth < 750;
    
    if (newIsMobileView !== isMobileView) {
      isMobileView = newIsMobileView;
      
      let currentActiveMediaId = '';
      let currentActiveIndex = '0';
      
      mediaItems.forEach((item, index) => {
        if (window.getComputedStyle(item).display !== 'none') {
          currentActiveMediaId = item.dataset.mediaId;
          currentActiveIndex = index.toString();
        }
      });
      
      slides.forEach(slide => {
        const targetId = slide.getAttribute('data-target');
        if (targetId && targetId === `ProductMedia-${currentActiveMediaId}`) {
          currentActiveIndex = slide.getAttribute('data-index') || '0';
        }
      });
      
      if (newIsMobileView) {
        forceShowAllThumbnails();
        
        slides.forEach(slide => {
          slide.classList.remove('active-mobile-thumbnail');
          if (slide.getAttribute('data-target') === `ProductMedia-${currentActiveMediaId}`) {
            slide.classList.add('active-mobile-thumbnail');
          }
        });
        
        updateMobileDots(parseInt(currentActiveIndex, 10));
        
        const activeSlide = thumbnailSlider.querySelector(`[data-target="ProductMedia-${currentActiveMediaId}"]`);
        if (activeSlide) {
          thumbnailSlider.style.scrollBehavior = 'auto';
          
          setupInfiniteScrollPosition();
          
          setTimeout(() => {
            thumbnailSlider.style.scrollBehavior = 'smooth';
            activeSlide.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
          }, 100);
        }
        
        addMobileSwipeButtons();
      } else {
        slides.forEach(slide => {
          slide.classList.remove('active-mobile-thumbnail');
          slide.style.visibility = '';
          slide.style.opacity = '';
        });
        
        const clones = thumbnailSlider.querySelectorAll('.slider__slide-clone');
        clones.forEach(clone => clone.remove());
        
        updateThumbnailsVisibility(currentActiveMediaId); 
      }
    }
  }, 250));

  if (isMobileView && slides.length > 0) {
    slides[0].classList.add('active-mobile-thumbnail');
    forceShowAllThumbnails();
    updateMobileDots(0);
    setupInfiniteScrollPosition();
    addMobileSwipeButtons();
  }
  
  setTimeout(function() {
    initializeGallery();
    
    function checkGalleryStateAndUpdateUI() {
      if (isMobileView) {
        updateUIFromVisibleSlide();
      }
    }
    
    checkGalleryStateAndUpdateUI();
  }, 100);
  
  function debounce(func, wait) {
    let timeout;
    return function() {
      const context = this;
      const args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), wait);
    };
  }
});