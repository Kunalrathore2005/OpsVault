import { useState, useEffect, useRef } from 'react';

export function useInView(options = {}) {
  const [inView, setInView] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const target = ref.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (options.triggerOnce !== false) {
            observer.unobserve(target);
          }
        } else if (options.triggerOnce === false) {
          setInView(false);
        }
      },
      {
        threshold: options.threshold || 0.15,
        rootMargin: options.rootMargin || '0px 0px -40px 0px',
        ...options
      }
    );

    observer.observe(target);
    return () => {
      if (target) observer.unobserve(target);
    };
  }, [options.threshold, options.rootMargin, options.triggerOnce]);

  return [ref, inView];
}
