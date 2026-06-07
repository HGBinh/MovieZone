import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <h1 className="text-9xl font-black text-primary mb-4 drop-shadow-2xl">404</h1>
      </motion.div>
      <h2 className="text-3xl font-bold mb-6 text-white">Lost in Space?</h2>
      <p className="text-neutral-400 max-w-md mb-10 text-lg">
        The page you are looking for doesn't exist or has been moved to another dimension.
      </p>
      <Link 
        to="/" 
        className="bg-primary text-white px-10 py-4 rounded-full font-bold hover:bg-red-700 transition-all hover:scale-105 shadow-xl"
      >
        Back to Earth
      </Link>
    </div>
  );
};

export default NotFound;
