import React, { useState } from 'react'

interface AvatarProps {
  src?: string | null
  alt?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  ring?: boolean
  grayscale?: boolean
  fallback?: string
}

const sizeMap = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-[12px]',
  md: 'w-10 h-10 text-[14px]',
  lg: 'w-12 h-12 text-[16px]',
  xl: 'w-24 h-24 text-[32px]',
}

const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = 'Avatar',
  size = 'md',
  className = '',
  ring = false,
  grayscale = false,
  fallback,
}) => {
  const [error, setError] = useState(false)
  
  const hasImage = src && src.trim() !== '' && !error

  if (!hasImage) {
    return (
      <div className={`${sizeMap[size]} rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-black uppercase border border-slate-200 ${className}`}>
        {fallback || alt.substring(0, 1)}
      </div>
    )
  }

  return (
    <img
      src={src!}
      alt={alt}
      onError={() => setError(true)}
      className={`${sizeMap[size]} rounded-full object-cover ${ring ? 'ring-2 ring-white shadow-sm' : ''} ${grayscale ? 'grayscale opacity-60' : ''} ${className}`}
    />
  )
}

export default Avatar
