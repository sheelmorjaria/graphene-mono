import { useState } from 'react';
import PropTypes from 'prop-types';

const ImageGallery = ({ images, alt }) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Handle empty images array
  if (!images || images.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
        <p className="text-gray-500">No images available</p>
      </div>
    );
  }

  const handleThumbnailClick = (index) => {
    setActiveImageIndex(index);
  };

  const handleKeyNavigation = (event, index) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      const nextIndex = (index + 1) % images.length;
      setActiveImageIndex(nextIndex);
      // Focus on next thumbnail
      const nextButton = event.target.parentElement.nextElementSibling?.querySelector('button');
      if (nextButton) {
        nextButton.focus();
      } else {
        // Wrap around to first thumbnail
        const firstButton = event.target.parentElement.parentElement.firstChild?.querySelector('button');
        if (firstButton) {
          firstButton.focus();
        }
      }
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      const prevIndex = index === 0 ? images.length - 1 : index - 1;
      setActiveImageIndex(prevIndex);
      // Focus on previous thumbnail
      const prevButton = event.target.parentElement.previousElementSibling?.querySelector('button');
      if (prevButton) {
        prevButton.focus();
      } else {
        // Wrap around to last thumbnail
        const lastButton = event.target.parentElement.parentElement.lastChild?.querySelector('button');
        if (lastButton) {
          lastButton.focus();
        }
      }
    }
  };

  const handleMainImageClick = () => {
    // Placeholder for zoom functionality
    console.log('Zoom functionality would be implemented here');
  };

  return (
    <div 
      className="flex flex-col space-y-4"
      role="region"
      aria-label="Image gallery"
    >
      {/* Main Image */}
      <div className="relative bg-gray-100 rounded-lg overflow-hidden aspect-square">
        <button
          onClick={handleMainImageClick}
          aria-label="Zoom image"
          className="w-full h-full focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <img
            src={images[activeImageIndex]}
            alt={`Main product image - ${alt}`}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </button>
      </div>

      {/* Thumbnail Gallery */}
      <div className="thumbnail-container flex space-x-2 overflow-x-auto pb-2">
        {images.map((image, index) => (
          <div key={index} className="flex-shrink-0">
            <button
              onClick={() => handleThumbnailClick(index)}
              onKeyDown={(e) => handleKeyNavigation(e, index)}
              aria-label={`View image ${index + 1}`}
              className={`
                relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                ${activeImageIndex === index 
                  ? 'ring-2 ring-blue-500 border-transparent' 
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}
            >
              <img
                src={image}
                alt={`Thumbnail ${index + 1} - ${alt}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

ImageGallery.propTypes = {
  images: PropTypes.arrayOf(PropTypes.string).isRequired,
  alt: PropTypes.string.isRequired
};

export default ImageGallery;