'use client';

import { motion, useReducedMotion, MotionProps } from 'framer-motion';
import { SVGProps } from 'react';

type Props = SVGProps<SVGPathElement> & {
  duration?: number;
  delay?: number;
  inView?: boolean;
};

export default function DrawPath({ duration = 1.4, delay = 0, inView = false, ...rest }: Props) {
  const reduce = useReducedMotion();

  const motionProps: MotionProps = reduce
    ? { initial: { pathLength: 1 }, animate: { pathLength: 1 } }
    : inView
      ? {
          initial: { pathLength: 0 },
          whileInView: { pathLength: 1 },
          viewport: { once: true, margin: '-40px' },
          transition: { duration, delay, ease: [0.65, 0, 0.35, 1] },
        }
      : {
          initial: { pathLength: 0 },
          animate: { pathLength: 1 },
          transition: { duration, delay, ease: [0.65, 0, 0.35, 1] },
        };

  return <motion.path {...(rest as any)} {...motionProps} />;
}
