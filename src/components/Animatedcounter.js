// src/components/AnimatedCounter.jsx
import React, { useEffect, useState } from "react";

const AnimatedCounter = ({ value, duration = 800 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const increment = value / (duration / 16); // ~60fps
    const step = () => {
      start += increment;
      if (start < value) {
        setCount(Math.ceil(start));
        requestAnimationFrame(step);
      } else {
        setCount(value);
      }
    };
    step();
  }, [value, duration]);

  return <span>{count}</span>;
};

export default AnimatedCounter;
