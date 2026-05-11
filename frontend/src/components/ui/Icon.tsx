import React from 'react'

interface IconProps {
  name: string
  className?: string
  filled?: boolean
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  onClick?: () => void
}

const sizeMap = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-xl',
  lg: 'text-2xl',
  xl: 'text-3xl',
}

const Icon: React.FC<IconProps> = ({ name, className = '', filled = false, size = 'md', onClick }) => {
  const sizeClass = sizeMap[size]
  const fillStyle = filled ? { fontVariationSettings: "'FILL' 1" } : undefined

  return (
    <span
      className={`material-symbols-outlined ${sizeClass} ${className}`}
      style={fillStyle}
      onClick={onClick}
    >
      {name}
    </span>
  )
}

export default Icon
