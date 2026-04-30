import React from 'react'
import './Card.css'

export default function Card({ children, className = '', glow = false, hover = false, ...props }) {
  return (
    <div
      className={`card ${glow ? 'card-glow' : ''} ${hover ? 'card-hover' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
