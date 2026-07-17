import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface RevealProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  direction?: 'up' | 'left' | 'right' | 'none';
  distance?: number;
}

export default function Reveal({ children, delay = 0, className, direction = 'up', distance = 28 }: RevealProps) {
  const offset =
    direction === 'up'
      ? { y: distance }
      : direction === 'left'
        ? { x: -distance }
        : direction === 'right'
          ? { x: distance }
          : {};

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, ...offset }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
