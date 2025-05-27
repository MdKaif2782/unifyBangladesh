"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, Play, Pause } from "lucide-react"

const slides = [
  { src: "/1.webp", alt: "Slide 1" },
  { src: "/2.webp", alt: "Slide 2" },
  { src: "/3.webp", alt: "Slide 3" },
]

const HeroSlideshow = () => {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)

  // Auto-play: Change slide every 5 seconds
  useEffect(() => {
    if (!isPlaying) return

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [isPlaying])

  // Handle dot navigation
  const goToSlide = (index) => {
    setCurrentSlide(index)
  }

  // Handle manual navigation
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
  }

  // Toggle autoplay
  const toggleAutoplay = () => {
    setIsPlaying(!isPlaying)
  }

  return (
    <div className="relative w-full h-64 sm:h-80 md:h-96 lg:h-[500px] overflow-hidden group">
      {/* Slides */}
      <div className="relative w-full h-full">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-transform duration-700 ease-in-out ${
              index === currentSlide ? "translate-x-0" : index < currentSlide ? "-translate-x-full" : "translate-x-full"
            }`}
          >
            <img
              src={slide.src || "/placeholder.svg"}
              alt={slide.alt}
              className="w-full h-full object-cover"
              loading={index === 0 ? "eager" : "lazy"}
            />
            {/* Gradient overlay for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-110"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-5 h-5 text-white" />
      </button>

      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-110"
        aria-label="Next slide"
      >
        <ChevronRight className="w-5 h-5 text-white" />
      </button>

      {/* Navigation Dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center space-x-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`relative transition-all duration-300 ${
              index === currentSlide
                ? "w-8 h-3 bg-white rounded-full"
                : "w-3 h-3 bg-white/50 hover:bg-white/70 rounded-full"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          >
            {/* Progress indicator for current slide */}
            {index === currentSlide && isPlaying && (
              <div
                className="absolute inset-0 bg-orange-500 rounded-full origin-left animate-progress"
                style={{
                  animation: "progress 5s linear infinite",
                }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Play/Pause Button */}
      <button
        onClick={toggleAutoplay}
        className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100"
        aria-label={isPlaying ? "Pause slideshow" : "Play slideshow"}
      >
        {isPlaying ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white ml-0.5" />}
      </button>

      {/* Slide Counter */}
      <div className="absolute top-4 left-4 bg-black/30 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        {currentSlide + 1} / {slides.length}
      </div>

      {/* Touch/Swipe indicators for mobile */}
      <div className="absolute bottom-2 right-4 text-white/60 text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300 md:hidden">
        Swipe to navigate
      </div>

      {/* Custom CSS for progress animation */}
      <style jsx>{`
                @keyframes progress {
                    from {
                        transform: scaleX(0);
                    }
                    to {
                        transform: scaleX(1);
                    }
                }
                .animate-progress {
                    transform-origin: left;
                }
            `}</style>
    </div>
  )
}

export default HeroSlideshow
