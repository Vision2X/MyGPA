import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Frown } from 'lucide-react';
import { motion } from 'framer-motion';

const NotFoundPage = () => {
  return (
    <div className="min-h-[calc(100vh-200px)] flex flex-col items-center justify-center text-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          duration: 0.5,
          type: "spring",
          stiffness: 100,
        }}
        className="max-w-md mx-auto"
      >
        <Frown className="h-32 w-32 text-primary mx-auto mb-8" />
        <h1 className="text-6xl font-extrabold text-destructive mb-4">404</h1>
        <h2 className="text-3xl font-semibold mb-6">Oops! Page Not Found</h2>
        <p className="text-lg text-muted-foreground mb-10">
          The page you're looking for doesn't seem to exist. Maybe it was moved, or you mistyped the URL.
        </p>
        <Button asChild size="lg" className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity">
          <Link to="/">Go Back Home</Link>
        </Button>
      </motion.div>
    </div>
  );
};

export default NotFoundPage;