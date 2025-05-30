import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, UserCircle, Save, UploadCloud } from 'lucide-react';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from '@/lib/supabaseClient';

const AVATARS_BUCKET = 'avatars';

const ProfilePage = () => {
  const { user, loading: authLoading, updateUserProfileContext, fetchUserProfile } = useAuth();
  const { toast } = useToast();
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    university_name: '',
    degree_program: '',
    student_id_number: '',
    linkedin_url: '',
    portfolio_url: '',
    avatar_url: '',
  });
  const [pageLoading, setPageLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        university_name: user.university_name || '',
        degree_program: user.degree_program || '',
        student_id_number: user.student_id_number || '',
        linkedin_url: user.linkedin_url || '',
        portfolio_url: user.portfolio_url || '',
        avatar_url: user.avatar_url || '',
      });
      if (user.avatar_url) {
        setAvatarPreview(user.avatar_url);
      }
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result); 
      };
      reader.readAsDataURL(file);
    } else {
      setAvatarFile(null);
      setAvatarPreview(user?.avatar_url || null);
      if (file) toast({ title: "Invalid File", description: "Please select an image file.", variant: "destructive"});
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    setPageLoading(true);
    
    let newAvatarUrl = profileData.avatar_url;

    if (avatarFile) {
      const fileName = `${user.id}/${Date.now()}_${avatarFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(AVATARS_BUCKET)
        .upload(fileName, avatarFile, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        toast({ title: "Avatar Upload Error", description: uploadError.message, variant: "destructive" });
        setPageLoading(false);
        return;
      }
      
      const { data: urlData } = supabase.storage.from(AVATARS_BUCKET).getPublicUrl(uploadData.path);
      newAvatarUrl = urlData.publicUrl;
    }
    
    const updatedProfileFields = {
        name: profileData.name,
        university_name: profileData.university_name,
        degree_program: profileData.degree_program,
        student_id_number: profileData.student_id_number,
        linkedin_url: profileData.linkedin_url,
        portfolio_url: profileData.portfolio_url,
        avatar_url: newAvatarUrl,
    };

    try {
      await updateUserProfileContext(updatedProfileFields);
      await fetchUserProfile(user.id); // Re-fetch to ensure context is up-to-date
      toast({ title: "Profile Updated", description: "Your profile information has been saved successfully." });
    } catch (error) {
      toast({ title: "Profile Update Error", description: error.message || "Could not update profile.", variant: "destructive" });
    } finally {
      setPageLoading(false);
      setAvatarFile(null); 
    }
  };

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-2xl mx-auto"
    >
      <Card className="glassmorphism">
        <CardHeader>
          <div className="flex flex-col items-center sm:flex-row sm:items-start space-y-4 sm:space-y-0 sm:space-x-6 mb-4">
            <div className="relative group">
              <Avatar className="w-24 h-24 sm:w-32 sm:h-32 border-4 border-primary shadow-lg">
                <AvatarImage src={avatarPreview || user.avatar_url} alt={user.name || user.email} />
                <AvatarFallback className="text-4xl bg-accent/20">
                  {user.name ? user.name.charAt(0).toUpperCase() : <UserCircle />}
                </AvatarFallback>
              </Avatar>
              <label htmlFor="avatarUpload" className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 rounded-full cursor-pointer transition-opacity">
                <UploadCloud className="h-8 w-8 text-white" />
              </label>
              <Input id="avatarUpload" type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </div>
            <div>
              <CardTitle className="text-3xl gradient-text text-center sm:text-left">{profileData.name || 'Your Profile'}</CardTitle>
              <CardDescription className="text-center sm:text-left">View and update your personal information and avatar.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" name="name" value={profileData.name} onChange={handleChange} placeholder="Your full name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" name="email" type="email" value={profileData.email} disabled placeholder="your.email@example.com" />
                <p className="text-xs text-muted-foreground">Email cannot be changed here.</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="university_name">University Name</Label>
              <Input id="university_name" name="university_name" value={profileData.university_name} onChange={handleChange} placeholder="e.g., University of Colombo" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="degree_program">Degree Program</Label>
                <Input id="degree_program" name="degree_program" value={profileData.degree_program} onChange={handleChange} placeholder="e.g., BSc in Computer Science" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="student_id_number">Student ID Number</Label>
                <Input id="student_id_number" name="student_id_number" value={profileData.student_id_number} onChange={handleChange} placeholder="Your student ID" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkedin_url">LinkedIn Profile URL</Label>
              <Input id="linkedin_url" name="linkedin_url" type="url" value={profileData.linkedin_url} onChange={handleChange} placeholder="https://linkedin.com/in/yourprofile" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="portfolio_url">Portfolio URL (Optional)</Label>
              <Input id="portfolio_url" name="portfolio_url" type="url" value={profileData.portfolio_url} onChange={handleChange} placeholder="https://yourportfolio.com" />
            </div>
            
            <Button type="submit" className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90" disabled={pageLoading || authLoading}>
              {pageLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ProfilePage;