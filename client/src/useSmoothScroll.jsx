import React from 'react';
import { useEffect } from 'react';

const useSmoothScroll = () => {
  useEffect(() => {
    const handleAnchorClick = (event) => {
      if (event.target.tagName === 'A' && event.target.getAttribute('href')?.startsWith('#')) {
        event.preventDefault();
        const targetId = event.target.getAttribute('href');
        const element = document.querySelector(targetId);
        
        if (element) {
          window.scrollTo({
            top: element.offsetTop,
            behavior: 'smooth'
          });
        }
      }
    };

    document.addEventListener('click', handleAnchorClick);
    
    return () => {
      document.removeEventListener('click', handleAnchorClick);
    };
  }, []);
};

export default useSmoothScroll;