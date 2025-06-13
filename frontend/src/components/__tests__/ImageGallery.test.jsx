import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import userEvent from '@testing-library/user-event';
import ImageGallery from '../ImageGallery';

describe('ImageGallery', () => {
  const mockImages = [
    'https://example.com/image1.jpg',
    'https://example.com/image2.jpg',
    'https://example.com/image3.jpg',
    'https://example.com/image4.jpg'
  ];

  const defaultProps = {
    images: mockImages,
    alt: 'Product images'
  };

  it('should render main image and thumbnails', () => {
    render(<ImageGallery {...defaultProps} />);
    
    // Should render main image
    const mainImage = screen.getByRole('img', { name: /main product image/i });
    expect(mainImage).toBeInTheDocument();
    expect(mainImage).toHaveAttribute('src', mockImages[0]);
    
    // Should render thumbnail images
    const thumbnails = screen.getAllByRole('img', { name: /thumbnail/i });
    expect(thumbnails).toHaveLength(4);
  });

  it('should display first image as main image by default', () => {
    render(<ImageGallery {...defaultProps} />);
    
    const mainImage = screen.getByRole('img', { name: /main product image/i });
    expect(mainImage).toHaveAttribute('src', mockImages[0]);
  });

  it('should change main image when thumbnail is clicked', async () => {
    const user = userEvent.setup();
    render(<ImageGallery {...defaultProps} />);
    
    const mainImage = screen.getByRole('img', { name: /main product image/i });
    const secondThumbnail = screen.getByRole('img', { name: /thumbnail 2/i });
    
    await user.click(secondThumbnail);
    
    expect(mainImage).toHaveAttribute('src', mockImages[1]);
  });

  it('should highlight active thumbnail', () => {
    render(<ImageGallery {...defaultProps} />);
    
    const firstThumbnail = screen.getByRole('img', { name: /thumbnail 1/i });
    const thumbnailButton = firstThumbnail.closest('button');
    
    expect(thumbnailButton).toHaveClass('ring-2', 'ring-blue-500');
  });

  it('should update active thumbnail when different thumbnail is selected', async () => {
    const user = userEvent.setup();
    render(<ImageGallery {...defaultProps} />);
    
    const firstThumbnail = screen.getByRole('img', { name: /thumbnail 1/i });
    const secondThumbnail = screen.getByRole('img', { name: /thumbnail 2/i });
    
    const firstButton = firstThumbnail.closest('button');
    const secondButton = secondThumbnail.closest('button');
    
    // Initially first should be active
    expect(firstButton).toHaveClass('ring-blue-500');
    expect(secondButton).not.toHaveClass('ring-blue-500');
    
    // Click second thumbnail
    await user.click(secondThumbnail);
    
    // Now second should be active
    expect(firstButton).not.toHaveClass('ring-blue-500');
    expect(secondButton).toHaveClass('ring-blue-500');
  });

  it('should handle keyboard navigation', async () => {
    const user = userEvent.setup();
    render(<ImageGallery {...defaultProps} />);
    
    const firstThumbnail = screen.getByRole('img', { name: /thumbnail 1/i });
    const thumbnailButton = firstThumbnail.closest('button');
    
    // Focus on first thumbnail
    thumbnailButton.focus();
    expect(thumbnailButton).toHaveFocus();
    
    // Press arrow key to navigate
    await user.keyboard('{ArrowRight}');
    
    const secondThumbnail = screen.getByRole('img', { name: /thumbnail 2/i });
    const secondButton = secondThumbnail.closest('button');
    expect(secondButton).toHaveFocus();
  });

  it('should handle single image correctly', () => {
    const singleImageProps = {
      images: ['https://example.com/single-image.jpg'],
      alt: 'Single product image'
    };
    
    render(<ImageGallery {...singleImageProps} />);
    
    const mainImage = screen.getByRole('img', { name: /main product image/i });
    expect(mainImage).toBeInTheDocument();
    
    // Should only have one thumbnail
    const thumbnails = screen.getAllByRole('img', { name: /thumbnail/i });
    expect(thumbnails).toHaveLength(1);
  });

  it('should handle empty images array gracefully', () => {
    const emptyProps = {
      images: [],
      alt: 'No images'
    };
    
    render(<ImageGallery {...emptyProps} />);
    
    // Should show placeholder or no images message
    expect(screen.getByText(/no images available/i)).toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    render(<ImageGallery {...defaultProps} />);
    
    const mainImage = screen.getByRole('img', { name: /main product image/i });
    expect(mainImage).toHaveAttribute('alt');
    
    // Gallery should have proper aria labels
    const gallery = screen.getByRole('region', { name: /image gallery/i });
    expect(gallery).toBeInTheDocument();
    
    // Thumbnails should be properly labeled
    const thumbnailButtons = screen.getAllByLabelText(/View image \d+/);
    expect(thumbnailButtons).toHaveLength(mockImages.length);
    thumbnailButtons.forEach((button, index) => {
      expect(button).toHaveAttribute('aria-label', `View image ${index + 1}`);
    });
  });

  it('should be responsive with proper styling', () => {
    const { container } = render(<ImageGallery {...defaultProps} />);
    
    const galleryContainer = container.firstChild;
    expect(galleryContainer).toHaveClass('flex', 'flex-col', 'space-y-4');
    
    const thumbnailContainer = container.querySelector('.thumbnail-container');
    expect(thumbnailContainer).toHaveClass('flex', 'space-x-2', 'overflow-x-auto');
  });

  it('should handle image loading errors gracefully', () => {
    render(<ImageGallery {...defaultProps} />);
    
    const mainImage = screen.getByRole('img', { name: /main product image/i });
    
    // Simulate image load error
    fireEvent.error(mainImage);
    
    // Should still be visible (browser handles broken images)
    expect(mainImage).toBeInTheDocument();
  });

  it('should support zoom functionality on main image', async () => {
    const user = userEvent.setup();
    render(<ImageGallery {...defaultProps} />);
    
    const mainImage = screen.getByRole('img', { name: /main product image/i });
    
    // Should be clickable for zoom
    expect(mainImage.closest('button')).toBeInTheDocument();
    
    await user.click(mainImage);
    
    // Could trigger a zoom modal (implementation dependent)
    // For now, just ensure it's clickable
    expect(mainImage.closest('button')).toHaveAttribute('aria-label', 'Zoom image');
  });

  it('should maintain aspect ratio for images', () => {
    render(<ImageGallery {...defaultProps} />);
    
    const mainImage = screen.getByRole('img', { name: /main product image/i });
    expect(mainImage).toHaveClass('object-cover');
    
    const thumbnails = screen.getAllByRole('img', { name: /thumbnail/i });
    thumbnails.forEach(thumbnail => {
      expect(thumbnail).toHaveClass('object-cover');
    });
  });

  it('should handle very long image arrays', () => {
    const manyImages = Array.from({ length: 20 }, (_, i) => 
      `https://example.com/image${i + 1}.jpg`
    );
    
    render(<ImageGallery images={manyImages} alt="Many images" />);
    
    const thumbnails = screen.getAllByRole('img', { name: /thumbnail/i });
    expect(thumbnails).toHaveLength(20);
    
    // Thumbnail container should be scrollable
    const thumbnailContainer = screen.getByRole('region', { name: /image gallery/i })
      .querySelector('.thumbnail-container');
    expect(thumbnailContainer).toHaveClass('overflow-x-auto');
  });
});