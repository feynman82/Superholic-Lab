'use client';

import { useRef, useState, useEffect, ReactNode } from 'react';
import { useScroll, useTransform, useReducedMotion, MotionValue } from 'framer-motion';

interface Props {
  children: (progress: number) => ReactNode;
  heightVh?: number;
}

/** Wrap children in a tall section; child is sticky and receives 0→1 scroll progress. */
export default function ScrollPin({ children, heightVh = 200 }: Props) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end end'],
  });
  const progress = useTransform(scrollYProgress, [0, 1], [0, 1]);

  if (reduce) {
    return <div>{children(1)}</div>;
  }

  return (
    <div ref={ref} style={{ height: `${heightVh}vh`, position: 'relative' }}>
      <div style={{ position: 'sticky', top: 0, height: '100vh', display: 'flex', alignItems: 'center' }}>
        <ProgressConsumer progress={progress}>{children}</ProgressConsumer>
      </div>
    </div>
  );
}

function ProgressConsumer({ progress, children }: { progress: MotionValue<number>; children: (p: number) => ReactNode }) {
  const [val, setVal] = useState(0);
  useEffect(() => progress.on('change', setVal), [progress]);
  return <>{children(val)}</>;
}
