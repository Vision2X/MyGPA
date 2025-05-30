import React from 'react';
import { motion } from 'framer-motion';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  return (
    <motion.footer 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-muted/50 py-8 text-center text-muted-foreground mt-auto"
    >
      <div className="container mx-auto">
        <p className="text-sm">
          &copy; {currentYear} MyGPA. All rights reserved.
        </p>
        <p className="text-xs mt-1">
          Crafted with <span className="text-red-500">❤️</span> by Hostinger Horizons
        </p>
      </div>
    </motion.footer>
  );
};

export default Footer;