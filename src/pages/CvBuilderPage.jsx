import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, FileText, Settings, Download, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { gradePointMapSL, getGpaClass, calculateGpa } from '@/components/gpa-calculator/gpaUtils';
import { loadFromLocalStorage } from '@/lib/localStorageManager';

const PROFILES_STORAGE_KEY = 'mygpa_profiles';
const GPA_DATA_STORAGE_KEY_PREFIX = 'mygpa_gpa_data_';
const TASKS_STORAGE_KEY_PREFIX = 'mygpa_tasks_';

const CvBuilderPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [profile, setProfile] = useState(null);
  const [academicData, setAcademicData] = useState([]); // For GPA data
  const [tasks, setTasks] = useState([]);
  
  const [loadingData, setLoadingData] = useState(true);
  const [cvData, setCvData] = useState({
    personalStatement: '',
    includeEducation: true,
    includeProjects: true,
    includeSkills: true,
    skills: '',
  });
  const [generatedCvHtml, setGeneratedCvHtml] = useState('');

  const getGpaStorageKey = useCallback(() => `${GPA_DATA_STORAGE_KEY_PREFIX}${user.id}`, [user]);
  const getTasksStorageKey = useCallback(() => `${TASKS_STORAGE_KEY_PREFIX}${user.id}`, [user]);

  useEffect(() => {
    const loadAllData = async () => {
      if (!user) return;
      setLoadingData(true);
      
      const profiles = loadFromLocalStorage(PROFILES_STORAGE_KEY, []);
      const userProfile = profiles.find(p => p.id === user.id);
      setProfile(userProfile);

      const userAcademicData = loadFromLocalStorage(getGpaStorageKey(), []);
      setAcademicData(userAcademicData);
      
      const userTasks = loadFromLocalStorage(getTasksStorageKey(), []);
      setTasks(userTasks.filter(task => task.is_completed)); // Only completed tasks/achievements
      
      setLoadingData(false);
    };

    if (user && !authLoading) {
      loadAllData();
    }
  }, [user, authLoading, getGpaStorageKey, getTasksStorageKey]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCvData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const generateCvPreview = useCallback(() => {
    if (!profile) return "<p>Loading profile data...</p>";

    let html = `<div class="cv-preview font-sans p-8 bg-white text-gray-800 shadow-lg max-w-4xl mx-auto border border-gray-200 rounded-lg">`;
    
    html += `<header class="text-center mb-8 border-b pb-4 border-gray-300">`;
    html += `<h1 class="text-4xl font-bold text-purple-700">${profile.name || 'Your Name'}</h1>`;
    html += `<p class="text-sm text-gray-600">${profile.email || ''} ${profile.student_id_number ? `| Student ID: ${profile.student_id_number}` : ''}</p>`;
    if(profile.linkedin_url) html += `<p class="text-sm text-blue-600 hover:underline"><a href="${profile.linkedin_url}" target="_blank" rel="noopener noreferrer">${profile.linkedin_url}</a></p>`;
    if(profile.portfolio_url) html += `<p class="text-sm text-blue-600 hover:underline"><a href="${profile.portfolio_url}" target="_blank" rel="noopener noreferrer">${profile.portfolio_url}</a></p>`;
    html += `</header>`;

    if (cvData.personalStatement) {
      html += `<section class="mb-6"><h2 class="text-xl font-semibold border-b-2 border-purple-500 pb-1 mb-2 text-purple-600">Personal Statement</h2>`;
      html += `<p class="text-gray-700 whitespace-pre-wrap">${cvData.personalStatement}</p></section>`;
    }

    if (cvData.includeEducation && academicData.length > 0) {
      html += `<section class="mb-6"><h2 class="text-xl font-semibold border-b-2 border-purple-500 pb-1 mb-2 text-purple-600">Education</h2>`;
      html += `<p class="text-gray-700 font-medium">${profile.degree_program || 'Your Degree'} - ${profile.university_name || 'Your University'}</p>`;
      
      let allModulesForOverall = [];
      academicData.forEach(year => year.semesters.forEach(semester => allModulesForOverall.push(...semester.modules)));
      const { gpa: overallGpa } = calculateGpa(allModulesForOverall.filter(m => m.grade && m.grade !== ''));

      if(overallGpa !== null) {
        html += `<p class="text-sm text-gray-600">Overall GPA: ${overallGpa.toFixed(2)} (${getGpaClass(overallGpa)})</p>`;
      }
      
      html += `<ul class="list-disc list-inside ml-4 mt-2 space-y-1 text-gray-700">`;
      academicData.forEach(year => {
        let yearModules = [];
        year.semesters.forEach(semester => yearModules.push(...semester.modules));
        const {gpa: yearGpa} = calculateGpa(yearModules.filter(m => m.grade && m.grade !== ''));
        html += `<li>${year.year_name}${yearGpa !== null ? `: GPA ${yearGpa.toFixed(2)}` : ''}</li>`;
      });
      html += `</ul></section>`;
    }

    if (cvData.includeProjects && tasks.length > 0) {
      html += `<section class="mb-6"><h2 class="text-xl font-semibold border-b-2 border-purple-500 pb-1 mb-2 text-purple-600">Projects & Achievements</h2>`;
      html += `<ul class="list-disc list-inside ml-4 space-y-2 text-gray-700">`;
      tasks.forEach(task => {
        html += `<li><span class="font-medium">${task.title}</span>${task.description ? `: ${task.description}` : ''}</li>`;
      });
      html += `</ul></section>`;
    }
    
    if (cvData.includeSkills && cvData.skills) {
      html += `<section class="mb-6"><h2 class="text-xl font-semibold border-b-2 border-purple-500 pb-1 mb-2 text-purple-600">Skills</h2>`;
      html += `<p class="text-gray-700 whitespace-pre-wrap">${cvData.skills.split(/[\n,]+/).map(s => s.trim()).filter(s => s).join(', ')}</p></section>`;
    }

    html += `</div>`;
    setGeneratedCvHtml(html);
    return html;
  }, [profile, cvData, academicData, tasks]);
  
  useEffect(() => {
    if (!authLoading && user && !loadingData) {
      generateCvPreview();
    }
  }, [cvData, profile, academicData, tasks, authLoading, user, loadingData, generateCvPreview]);


  const handleDownloadCv = () => {
    const cvContent = generateCvPreview();
    const blob = new Blob([`<html><head><title>CV - ${profile?.name || 'User'}</title><style>body{font-family:sans-serif;margin:0;padding:0;} .cv-preview{max-width:800px; margin:20px auto; padding:30px; border:1px solid #eee; box-shadow:0 0 10px rgba(0,0,0,0.1);} h1{font-size:2em;color:#5A2E8A;} h2{font-size:1.4em; border-bottom:2px solid #7E3AF2; padding-bottom:4px; margin-bottom:10px; color:#6B2FBF;} header p{font-size:0.9em; color:#555;} section{margin-bottom:20px;} ul{list-style-position:inside; padding-left:5px;} li{margin-bottom:5px;} p{line-height:1.6; color:#333;}</style></head><body>${cvContent}</body></html>`], { type: 'text/html' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `CV_${profile?.name?.replace(/\s/g, '_') || 'User'}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    toast({title: "CV Downloaded", description: "Your CV has been downloaded as an HTML file."});
  };


  if (authLoading || loadingData) {
    return <div className="flex items-center justify-center h-[calc(100vh-200px)]"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }
  if (!user) return <p>Please log in to build your CV.</p>;


  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-8">
      <Card className="glassmorphism">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <FileText className="h-10 w-10 text-primary" />
            <div>
              <CardTitle className="text-3xl gradient-text">ATS-Friendly CV Builder</CardTitle>
              <CardDescription>Craft your professional CV with ease. Tailor content and download.</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-1 glassmorphism">
          <CardHeader>
            <CardTitle className="flex items-center"><Settings className="mr-2 h-5 w-5 text-primary" />CV Content Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="personalStatement" className="text-base">Personal Statement / Summary</Label>
              <Textarea id="personalStatement" name="personalStatement" value={cvData.personalStatement} onChange={handleInputChange} placeholder="Write a brief summary about yourself, your goals, and key strengths..." className="mt-1 min-h-[100px]" />
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox id="includeEducation" name="includeEducation" checked={cvData.includeEducation} onCheckedChange={(checked) => handleInputChange({ target: { name: 'includeEducation', type: 'checkbox', checked }})}/>
                <Label htmlFor="includeEducation" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Include Education History</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="includeProjects" name="includeProjects" checked={cvData.includeProjects} onCheckedChange={(checked) => handleInputChange({ target: { name: 'includeProjects', type: 'checkbox', checked }})}/>
                <Label htmlFor="includeProjects" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Include Projects/Achievements</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="includeSkills" name="includeSkills" checked={cvData.includeSkills} onCheckedChange={(checked) => handleInputChange({ target: { name: 'includeSkills', type: 'checkbox', checked }})} />
                <Label htmlFor="includeSkills" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Include Skills Section</Label>
              </div>
            </div>

            {cvData.includeSkills && (
              <div>
                <Label htmlFor="skills" className="text-base">Skills</Label>
                <Textarea id="skills" name="skills" value={cvData.skills} onChange={handleInputChange} placeholder="List your skills, e.g., JavaScript, React, Project Management, Public Speaking..." className="mt-1 min-h-[80px]" />
                 <p className="text-xs text-muted-foreground mt-1">Separate skills with commas or new lines.</p>
              </div>
            )}
            <div className="flex space-x-2 mt-4">
              <Button onClick={handleDownloadCv} className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"><Download className="mr-2 h-4 w-4"/>Download CV</Button>
            </div>
             <p className="text-xs text-muted-foreground mt-2 text-center">CV will be downloaded as an HTML file. You can open it in a browser and print to PDF.</p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 glassmorphism">
          <CardHeader>
            <CardTitle className="flex items-center"><Eye className="mr-2 h-5 w-5 text-primary" />CV Preview</CardTitle>
            <CardDescription>This is a live preview of your CV based on selected options.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-4 bg-white min-h-[600px] overflow-y-auto shadow-inner" dangerouslySetInnerHTML={{ __html: generatedCvHtml || '<p class="text-muted-foreground text-center py-10">Select options to generate CV preview.</p>' }} />
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};

export default CvBuilderPage;