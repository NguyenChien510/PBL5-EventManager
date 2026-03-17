import React from 'react'

interface AvatarProps {
  src: string
  alt?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  ring?: boolean
  grayscale?: boolean
}

const sizeMap = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-24 h-24',
}

const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = 'Avatar',
  size = 'md',
  className = '',
  ring = false,
  grayscale = false,
}) => {
  return (
    <img
      src={src}
      alt={alt}
      className={`${sizeMap[size]} rounded-full object-cover ${ring ? 'ring-2 ring-white shadow-sm' : ''} ${grayscale ? 'grayscale opacity-60' : ''} ${className}`}
    />
  )
}

export default Avatar
