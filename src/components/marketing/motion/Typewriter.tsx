'use client';

import { motion, useReducedMotion } from 'framer-motion';

interface Props {
  text: string;
  delay?: number;
  charDuration?: number;
  className?: string;
}

export default function Typewriter({ text, delay = 0, charDuration = 0.025, className }: Props) {
  const reduce = useReducedMotion();
  if (reduce) return <span className={className}>{text}</span>;

  return (
    <motion.span className={className}>
      {text.split('').map((char, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0, delay: delay + i * charDuration }}
          aria-hidden={i > 0 ? 'true' : undefined}
        >
          {char}
        </motion.span>
      ))}
    </motion.span>
  );
}
