// web/src/components/common/PageTransition.jsx
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';

const pageVariants = {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
    exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
};

function PageTransition({ children, className }) {
    return (
        <motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className={className}
        >
            {children}
        </motion.div>
    );
}

const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

function AnimatedItem({ children, className, delay = 0 }) {
    return (
        <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

export { PageTransition, AnimatedItem };
export default PageTransition;