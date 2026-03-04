import { useEffect, useRef, useState } from 'react';

export function useCountUp(target, duration = 900) {
  const [value, setValue] = useState(0);
  const animRef = useRef(null);

  useEffect(() => {
    if (typeof target !== 'number') return;
    const start = 0;
    const startTime = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setValue(Math.round(start + (target - start) * eased));
      if (progress < 1) animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [target, duration]);

  return value;
}
