import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { ArrowRight, GraduationCap, CheckCircle, TrendingUp, FileText, ListChecks } from 'lucide-react';

const HomePage = () => {
  const featureVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.2,
        duration: 0.5,
        ease: "easeOut"
      }
    })
  };

  const features = [
    { icon: <TrendingUp className="h-10 w-10 text-accent" />, title: "GPA Tracking", description: "Effortlessly calculate and monitor your GPA semester by semester and year over year." },
    { icon: <ListChecks className="h-10 w-10 text-accent" />, title: "Task Management", description: "Organize your academic and personal tasks with our intuitive Kanban board." },
    { icon: <FileText className="h-10 w-10 text-accent" />, title: "Portfolio & CV Builder", description: "Showcase achievements and build an ATS-friendly CV (Coming Soon!)." },
  ];

  return (
    <div className="min-h-[calc(100vh-200px)] flex flex-col items-center justify-center text-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: -50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.7, type: "spring", stiffness: 120 }}
        className="max-w-3xl mx-auto"
      >
        <GraduationCap className="h-24 w-24 text-primary mx-auto mb-6" />
        <h1 className="text-5xl md:text-6xl font-extrabold mb-6">
          Welcome to <span className="gradient-text">MyGPA</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground mb-10">
          Your ultimate platform to manage university life, track academic progress, organize tasks, and achieve your dreams.
        </p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <Button asChild size="lg" className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity duration-300 transform hover:scale-105">
            <Link to="/auth">
              Get Started <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </motion.div>
      </motion.div>

      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto w-full">
        {features.map((feature, index) => (
          <motion.div
            key={index}
            custom={index}
            variants={featureVariants}
            initial="hidden"
            animate="visible"
            className="p-6 bg-card rounded-xl shadow-lg glassmorphism"
          >
            <div className="flex justify-center mb-4">{feature.icon}</div>
            <h3 className="text-xl font-semibold mb-2 text-foreground">{feature.title}</h3>
            <p className="text-sm text-muted-foreground">{feature.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default HomePage;