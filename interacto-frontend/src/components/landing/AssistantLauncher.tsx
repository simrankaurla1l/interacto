import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatBubbleIcon, Cross2Icon } from '@radix-ui/react-icons';
import ChatWidget from './ChatWidget.js';

export default function AssistantLauncher() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        {!open ? (
          <motion.span
            animate={{ scale: [1, 1.6, 1.6], opacity: [0.6, 0, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
            className="pointer-events-none absolute inset-0 rounded-full bg-orange-400"
          />
        ) : null}

        <motion.button
          onClick={() => setOpen((value) => !value)}
          animate={open ? { y: 0 } : { y: [0, -10, 0] }}
          transition={open ? { duration: 0.2 } : { duration: 1.4, repeat: Infinity, repeatDelay: 1, ease: 'easeInOut' }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-amber-400 text-white shadow-lg shadow-orange-500/40 transition hover:shadow-xl"
          aria-label={open ? 'Close Interacto Assistant' : 'Open Interacto Assistant'}
        >
          {open ? <Cross2Icon className="h-5 w-5" /> : <ChatBubbleIcon className="h-5 w-5" />}
        </motion.button>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-24 right-6 z-50 w-[calc(100%-3rem)] max-w-md"
          >
            <ChatWidget className="relative w-full" />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
