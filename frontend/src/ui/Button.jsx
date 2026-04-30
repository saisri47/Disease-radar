import React from 'react'
import './Button.css'

export default function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  disabled = false, 
  glow = false,
  className = '',
  ...props 
}) {
  return (
    <button
      className={`btn btn-${variant} btn-${size} ${glow ? 'btn-glow' : ''} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}
