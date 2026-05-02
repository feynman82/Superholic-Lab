'use client';

import { motion, useReducedMotion, Variants } from 'framer-motion';
import { ReactNode, ComponentType } from 'react';

interface Props {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: 'div' | 'section' | 'li' | 'article';
}

export default function FadeUp({ children, delay = 0, className, as = 'div' }: Props) {
  const reduce = useReducedMotion();

  const variants: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: reduce ? 0 : 0.5,
        delay: reduce ? 0 : delay,
        ease: [0.25, 0.1, 0.25, 1],
      },
    },
  };

  const Comp = motion[as] as ComponentType<any>;

  return (
    <Comp
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-80px' }}
      variants={variants}
    >
      {children}
    </Comp>
  );
}
