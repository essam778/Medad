import { useState } from 'react'

export default function OptimizedImage({
  src,
  alt,
  className = '',
  width,
  height,
  loading = 'lazy',
  decoding = 'async',
  fetchpriority = 'auto',
}) {
  const [isLoaded, setIsLoaded] = useState(false)
  if (!src) return null

  return (
    <div 
      className={`relative overflow-hidden bg-white/5 ${className}`}
      style={{ 
        aspectRatio: width && height ? `${width}/${height}` : 'auto',
      }}
    >
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        decoding={decoding}
        fetchpriority={fetchpriority}
        onLoad={() => setIsLoaded(true)}
        className={`
          w-full h-full object-cover transition-opacity duration-500
          ${isLoaded ? 'opacity-100' : 'opacity-0'}
        `}
      />
    </div>
  )
}
