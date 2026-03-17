import React from 'react'

interface HtmlPageProps {
  html: string
  className?: string
}

const HtmlPage: React.FC<HtmlPageProps> = ({ html, className = '' }) => {
  return (
    <div 
      className={className}
      dangerouslySetInnerHTML={{ __html: html }} 
    />
  )
}

export default HtmlPage
