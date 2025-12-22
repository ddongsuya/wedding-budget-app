
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { VenueImage } from '../../types';

interface GalleryViewerProps {
  images: VenueImage[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
}

export const GalleryViewer: React.FC<GalleryViewerProps> = ({ images, initialIndex = 0, isOpen, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [direction, setDirection] = useState(0);

  // Keyboard navigation & body scroll lock
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      document.body.style.overflow = 'hidden';

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
        if (e.key === 'ArrowLeft') paginate(-1);
        if (e.key === 'ArrowRight') paginate(1);
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'unset';
      };
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen, initialIndex]);

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  const paginate = (newDirection: number) => {
    setDirection(newDirection);
    let newIndex = currentIndex + newDirection;
    if (newIndex < 0) newIndex = images.length - 1;
    if (newIndex >= images.length) newIndex = 0;
    setCurrentIndex(newIndex);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center touch-none"
        >
          {/* Header Controls */}
          <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-50 text-white" onClick={e => e.stopPropagation()}>
            <div className="text-sm font-medium">
               {currentIndex + 1} / {images.length}
            </div>
            <button 
              onClick={onClose} 
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Main Image */}
          <div className="relative w-full h-full flex items-center justify-center overflow-hidden" onClick={e => e.stopPropagation()}>
             {/* Navigation Buttons (Desktop) */}
             <button 
                className="absolute left-4 z-20 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 hidden md:block"
                onClick={() => paginate(-1)}
             >
                <ChevronLeft size={32} />
             </button>
             <button 
                className="absolute right-4 z-20 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 hidden md:block"
                onClick={() => paginate(1)}
             >
                <ChevronRight size={32} />
             </button>

             <AnimatePresence initial={false} custom={direction} mode="popLayout">
                <motion.div
                  key={currentIndex}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{
                    x: { type: "spring", stiffness: 300, damping: 30 },
                    opacity: { duration: 0.2 }
                  }}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={1}
                  onDragEnd={(e, { offset, velocity }) => {
                    const swipe = Math.abs(offset.x) * velocity.x;
                    if (swipe < -10000) {
                      paginate(1);
                    } else if (swipe > 10000) {
                      paginate(-1);
                    }
                  }}
                  className="absolute w-full h-full flex items-center justify-center p-4"
                >
                  <img
                    src={images[currentIndex].url}
                    alt={images[currentIndex].caption || `Image ${currentIndex + 1}`}
                    className="max-h-full max-w-full object-contain rounded-lg shadow-2xl touch-pinch-zoom"
                    style={{ pointerEvents: 'auto' }}
                  />
                  {/* Caption Overlay */}
                  {images[currentIndex].caption && (
                    <div className="absolute bottom-20 left-0 right-0 text-center pointer-events-none z-10">
                       <div className="inline-block bg-black/60 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm">
                         {images[currentIndex].caption}
                       </div>
                    </div>
                  )}
                </motion.div>
             </AnimatePresence>
          </div>

          {/* Thumbnail Strip */}
          <div className="h-24 w-full bg-black/50 backdrop-blur-sm flex items-center gap-2 px-4 overflow-x-auto z-50 snap-x" onClick={e => e.stopPropagation()}>
             {images.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => {
                     setDirection(idx > currentIndex ? 1 : -1);
                     setCurrentIndex(idx);
                  }}
                  className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden transition-all snap-center ${currentIndex === idx ? 'ring-2 ring-rose-500 scale-110 opacity-100' : 'opacity-50 hover:opacity-100'}`}
                >
                   <img src={img.url} alt={img.caption || '갤러리 이미지'} loading="lazy" className="w-full h-full object-cover" />
                </button>
             ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
