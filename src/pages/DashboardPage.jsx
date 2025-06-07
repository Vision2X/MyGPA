
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart3, BookCopy, FileText, UserCog, FolderKanban, ListChecks, CalendarDays } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserCircle as UserIconLucide } from 'lucide-react';


const DashboardPage = () => {
  const { user } = useAuth();

  const quickLinks = [
    { title: "GPA Calculator", icon: <BarChart3 className="h-8 w-8 text-primary" />, path: "/gpa-calculator", description: "Calculate and track your GPA." },
    { title: "My Profile", icon: <UserCog className="h-8 w-8 text-primary" />, path: "/profile", description: "Manage your personal information." },
    { title: "Documents", icon: <FolderKanban className="h-8 w-8 text-primary" />, path: "/documents", description: "Store important documents locally." },
    { title: "Tasks List", icon: <ListChecks className="h-8 w-8 text-primary" />, path: "/tasks", description: "Organize with Kanban board." },
    { title: "Credentials", icon: <BookCopy className="h-8 w-8 text-primary" />, path: "/credentials", description: "Manage usernames & passwords." },
    { title: "CV Builder", icon: <FileText className="h-8 w-8 text-primary" />, path: "/cv-builder", description: "Create an ATS-friendly CV." },
    { title: "Timetable & Reminders", icon: <CalendarDays className="h-8 w-8 text-primary" />, path: "/timetable", description: "Manage your schedule (Soon!)." },
  ];
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.4,
        ease: "easeOut"
      }
    })
  };


  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      <Card className="bg-gradient-to-r from-primary via-purple-600 to-accent text-primary-foreground p-6 sm:p-8 shadow-xl glassmorphism">
        <CardHeader className="p-0 flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
           <Avatar className="w-20 h-20 sm:w-24 sm:h-24 border-4 border-primary-foreground/50 shadow-lg">
              <AvatarImage src={user?.avatar_url} alt={user?.name || user?.email} />
              <AvatarFallback className="text-3xl bg-primary-foreground/20 text-primary-foreground">
                {user?.name ? user.name.charAt(0).toUpperCase() : <UserIconLucide />}
              </AvatarFallback>
            </Avatar>
          <div>
            <CardTitle className="text-3xl sm:text-4xl">Hello, {user?.name || user?.email}!</CardTitle>
            <CardDescription className="text-primary-foreground/80 text-lg mt-1">
              Welcome to your MyGPA Dashboard. Let's make today productive!
            </CardDescription>
          </div>
        </CardHeader>
      </Card>

      <section>
        <h2 className="text-2xl font-semibold mb-4 text-foreground">Quick Access</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {quickLinks.map((link, index) => (
            <motion.div key={link.title} custom={index} variants={itemVariants} initial="hidden" animate="visible">
              <Card className="hover:shadow-lg transition-shadow duration-300 h-full flex flex-col glassmorphism">
                <CardHeader className="flex-row items-center space-x-4 pb-4">
                  {link.icon}
                  <CardTitle className="text-xl text-foreground">{link.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-sm text-muted-foreground mb-4">{link.description}</p>
                </CardContent>
                <CardContent className="pt-0">
                   <Button asChild variant="outline" className="w-full border-primary text-primary hover:bg-primary/10">
                    <Link to={link.path}>Go to {link.title}</Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>
    </motion.div>
  );
};

export default DashboardPage;
