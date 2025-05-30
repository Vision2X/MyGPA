import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, AlertDialogFooter } from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { BarChart3, PlusCircle, Trash2, Edit3, Save, Loader2, BookOpen, CalendarDays, AlertCircle as CalculatorIcon, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { gradePointMapSL, getGpaClass, calculateGpa } from '@/components/gpa-calculator/gpaUtils';
import { v4 as uuidv4 } from 'uuid';


const GpaCalculatorPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [academicData, setAcademicData] = useState([]); // Stores [{ id, yearName, semesters: [{ id, semesterName, modules: [...]}]}]
  const [overallGPA, setOverallGPA] = useState(null);
  const [overallCredits, setOverallCredits] = useState(0);
  const [gpaByYear, setGpaByYear] = useState({});
  const [gpaBySemester, setGpaBySemester] = useState({});

  const [loadingData, setLoadingData] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Form states
  const [isYearFormOpen, setIsYearFormOpen] = useState(false);
  const [yearName, setYearName] = useState('');
  const [editingYearId, setEditingYearId] = useState(null);

  const [isSemesterFormOpen, setIsSemesterFormOpen] = useState(false);
  const [semesterName, setSemesterName] = useState('');
  const [currentYearIdForSemester, setCurrentYearIdForSemester] = useState(null);
  const [editingSemesterId, setEditingSemesterId] = useState(null);

  const [isModuleFormOpen, setIsModuleFormOpen] = useState(false);
  const [moduleData, setModuleData] = useState({ code: '', name: '', credits: '', grade: '' });
  const [currentSemesterIdForModule, setCurrentSemesterIdForModule] = useState(null);
  const [editingModuleId, setEditingModuleId] = useState(null);

  const fetchDataForUser = useCallback(async () => {
    if (!user) return;
    setLoadingData(true);
    try {
      const { data: years, error: yearsError } = await supabase.from('academic_years').select('*').eq('user_id', user.id).order('created_at');
      if (yearsError) throw yearsError;

      const structuredData = await Promise.all(years.map(async (year) => {
        const { data: semesters, error: semestersError } = await supabase.from('semesters').select('*').eq('academic_year_id', year.id).order('created_at');
        if (semestersError) throw semestersError;

        const semestersWithModules = await Promise.all(semesters.map(async (semester) => {
          const { data: modules, error: modulesError } = await supabase.from('modules').select('*').eq('semester_id', semester.id).order('created_at');
          if (modulesError) throw modulesError;
          return { ...semester, modules };
        }));
        return { ...year, semesters: semestersWithModules };
      }));
      setAcademicData(structuredData);
    } catch (error) {
      toast({ title: "Error fetching data", description: error.message, variant: "destructive" });
    } finally {
      setLoadingData(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchDataForUser();
  }, [fetchDataForUser]);

  const calculateAllGPAs = useCallback(() => {
    let allModulesForOverall = [];
    const yearGpas = {};
    const semesterGpas = {};

    academicData.forEach(year => {
      let yearModules = [];
      year.semesters.forEach(semester => {
        const { gpa: semGpa, totalCredits: semCredits } = calculateGpa(semester.modules);
        semesterGpas[semester.id] = { gpa: semGpa, credits: semCredits };
        yearModules = yearModules.concat(semester.modules);
        allModulesForOverall = allModulesForOverall.concat(semester.modules);
      });
      const { gpa: yrGpa, totalCredits: yrCredits } = calculateGpa(yearModules);
      yearGpas[year.id] = { gpa: yrGpa, credits: yrCredits };
    });
    
    const { gpa: overall, totalCredits: credits } = calculateGpa(allModulesForOverall.filter(m => m.grade && m.grade !== ''));
    setOverallGPA(overall);
    setOverallCredits(credits);
    setGpaByYear(yearGpas);
    setGpaBySemester(semesterGpas);

  }, [academicData]);

  useEffect(() => {
    calculateAllGPAs();
  }, [academicData, calculateAllGPAs]);


  // Year Operations
  const handleYearSubmit = async (e) => {
    e.preventDefault();
    if (!user || !yearName.trim()) return;
    setProcessing(true);
    const payload = { user_id: user.id, year_name: yearName.trim() };
    try {
      if (editingYearId) {
        const { error } = await supabase.from('academic_years').update(payload).eq('id', editingYearId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('academic_years').insert(payload);
        if (error) throw error;
      }
      toast({ title: `Academic Year ${editingYearId ? 'Updated' : 'Added'}` });
      fetchDataForUser();
      setIsYearFormOpen(false); setYearName(''); setEditingYearId(null);
    } catch (error) {
      toast({ title: `Year ${editingYearId ? 'Update' : 'Add'} Error`, description: error.message, variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  const openYearForm = (year = null) => {
    if (year) {
      setYearName(year.year_name);
      setEditingYearId(year.id);
    } else {
      setYearName('');
      setEditingYearId(null);
    }
    setIsYearFormOpen(true);
  };
  
  const deleteYear = async (yearId) => {
    setProcessing(true);
    try {
      // Cascade delete: modules -> semesters -> year
      const yearToDelete = academicData.find(y => y.id === yearId);
      if (yearToDelete) {
        for (const semester of yearToDelete.semesters) {
          await supabase.from('modules').delete().eq('semester_id', semester.id);
        }
        await supabase.from('semesters').delete().eq('academic_year_id', yearId);
      }
      const { error } = await supabase.from('academic_years').delete().eq('id', yearId);
      if (error) throw error;
      toast({ title: "Academic Year Deleted" });
      fetchDataForUser();
    } catch (error) {
      toast({ title: "Year Delete Error", description: error.message, variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };


  // Semester Operations
  const handleSemesterSubmit = async (e) => {
    e.preventDefault();
    if (!user || !currentYearIdForSemester || !semesterName.trim()) return;
    setProcessing(true);
    const payload = { user_id: user.id, academic_year_id: currentYearIdForSemester, semester_name: semesterName.trim() };
    try {
      if (editingSemesterId) {
        const { error } = await supabase.from('semesters').update(payload).eq('id', editingSemesterId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('semesters').insert(payload);
        if (error) throw error;
      }
      toast({ title: `Semester ${editingSemesterId ? 'Updated' : 'Added'}` });
      fetchDataForUser();
      setIsSemesterFormOpen(false); setSemesterName(''); setEditingSemesterId(null); setCurrentYearIdForSemester(null);
    } catch (error) {
      toast({ title: `Semester ${editingSemesterId ? 'Update' : 'Add'} Error`, description: error.message, variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  const openSemesterForm = (yearId, semester = null) => {
    setCurrentYearIdForSemester(yearId);
    if (semester) {
      setSemesterName(semester.semester_name);
      setEditingSemesterId(semester.id);
    } else {
      setSemesterName('');
      setEditingSemesterId(null);
    }
    setIsSemesterFormOpen(true);
  };

  const deleteSemester = async (semesterId) => {
    setProcessing(true);
    try {
      await supabase.from('modules').delete().eq('semester_id', semesterId);
      const { error } = await supabase.from('semesters').delete().eq('id', semesterId);
      if (error) throw error;
      toast({ title: "Semester Deleted" });
      fetchDataForUser();
    } catch (error) {
      toast({ title: "Semester Delete Error", description: error.message, variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  // Module Operations
  const handleModuleSubmit = async (e) => {
    e.preventDefault();
    if (!user || !currentSemesterIdForModule || !moduleData.code.trim() || !moduleData.name.trim() || !moduleData.credits) return;
    setProcessing(true);
    const gradePoints = moduleData.grade ? (gradePointMapSL[moduleData.grade] ?? null) : null;
    const payload = {
      user_id: user.id, semester_id: currentSemesterIdForModule,
      module_code: moduleData.code.trim(), module_name: moduleData.name.trim(),
      credits: parseFloat(moduleData.credits), grade: moduleData.grade || null, grade_points: gradePoints
    };
    try {
      if (editingModuleId) {
        const { error } = await supabase.from('modules').update(payload).eq('id', editingModuleId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('modules').insert(payload);
        if (error) throw error;
      }
      toast({ title: `Module ${editingModuleId ? 'Updated' : 'Added'}` });
      fetchDataForUser();
      setIsModuleFormOpen(false); setModuleData({ code: '', name: '', credits: '', grade: '' }); setEditingModuleId(null); setCurrentSemesterIdForModule(null);
    } catch (error) {
      toast({ title: `Module ${editingModuleId ? 'Update' : 'Add'} Error`, description: error.message, variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  const openModuleForm = (semesterId, module = null) => {
    setCurrentSemesterIdForModule(semesterId);
    if (module) {
      setModuleData({ code: module.module_code, name: module.module_name, credits: module.credits.toString(), grade: module.grade || '' });
      setEditingModuleId(module.id);
    } else {
      setModuleData({ code: '', name: '', credits: '', grade: '' });
      setEditingModuleId(null);
    }
    setIsModuleFormOpen(true);
  };

  const deleteModule = async (moduleId) => {
    setProcessing(true);
    try {
      const { error } = await supabase.from('modules').delete().eq('id', moduleId);
      if (error) throw error;
      toast({ title: "Module Deleted" });
      fetchDataForUser();
    } catch (error) {
      toast({ title: "Module Delete Error", description: error.message, variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  if (loadingData && !academicData.length) { // Show loader only on initial full load
    return <div className="flex items-center justify-center h-[calc(100vh-200px)]"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-8">
      <Card className="glassmorphism">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <BarChart3 className="h-10 w-10 text-primary" />
            <div>
              <CardTitle className="text-3xl gradient-text">GPA Studio</CardTitle>
              <CardDescription>Manage your academic progress and calculate GPA.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Card className="bg-primary/5 border-primary/20 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-primary flex items-center"><Trophy className="mr-3 h-7 w-7" />Overall Standing</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overall GPA</p>
                <p className="text-5xl font-bold text-primary">{overallGPA !== null ? overallGPA.toFixed(2) : 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Credits</p>
                <p className="text-5xl font-bold text-primary">{overallCredits || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Class Honours</p>
                <p className="text-3xl font-semibold text-accent">{getGpaClass(overallGPA)}</p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={() => openYearForm()}><PlusCircle className="mr-2 h-4 w-4" /> Add Academic Year</Button>
          </div>

          {academicData.length === 0 && !loadingData && (
            <p className="text-muted-foreground text-center py-4">No academic data found. Start by adding an academic year.</p>
          )}

          {academicData.map(year => (
            <Card key={year.id} className="bg-card/80 shadow-md">
              <CardHeader className="flex flex-row justify-between items-center p-4">
                <div className="flex items-center space-x-2">
                  <CalendarDays className="h-6 w-6 text-primary" />
                  <CardTitle className="text-xl">{year.year_name}</CardTitle>
                </div>
                <div className="flex items-center space-x-2">
                  {gpaByYear[year.id]?.gpa !== null && gpaByYear[year.id]?.gpa !== undefined && (
                    <span className="text-sm font-semibold text-primary">
                      Year GPA: {gpaByYear[year.id].gpa.toFixed(2)} (Credits: {gpaByYear[year.id].credits || 0})
                    </span>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => openYearForm(year)}><Edit3 className="h-4 w-4" /></Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader><AlertDialogTitle>Delete {year.year_name}?</AlertDialogTitle><AlertDialogDescription>This will delete the year and all its semesters and modules. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                      <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => deleteYear(year.id)}>Delete</AlertDialogAction></AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <Button size="sm" variant="outline" onClick={() => openSemesterForm(year.id)}><PlusCircle className="mr-2 h-4 w-4" /> Add Semester</Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {year.semesters.length === 0 && <p className="text-sm text-muted-foreground pl-2">No semesters in this year. Add one!</p>}
                {year.semesters.map(semester => (
                  <Card key={semester.id} className="bg-background/70">
                    <CardHeader className="flex flex-row justify-between items-center p-3">
                      <div className="flex items-center space-x-2">
                        <BookOpen className="h-5 w-5 text-accent" />
                        <CardTitle className="text-lg">{semester.semester_name}</CardTitle>
                      </div>
                      <div className="flex items-center space-x-2">
                        {gpaBySemester[semester.id]?.gpa !== null && gpaBySemester[semester.id]?.gpa !== undefined && (
                          <span className="text-xs font-semibold text-accent">
                            Sem GPA: {gpaBySemester[semester.id].gpa.toFixed(2)} (Credits: {gpaBySemester[semester.id].credits || 0})
                          </span>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => openSemesterForm(year.id, semester)}><Edit3 className="h-4 w-4" /></Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Delete {semester.semester_name}?</AlertDialogTitle><AlertDialogDescription>This will delete the semester and all its modules. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => deleteSemester(semester.id)}>Delete</AlertDialogAction></AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        <Button size="xs" variant="outline" onClick={() => openModuleForm(semester.id)}><PlusCircle className="mr-1 h-3 w-3" /> Add Module</Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-3 space-y-2">
                      {semester.modules.length === 0 && <p className="text-xs text-muted-foreground pl-2">No modules in this semester. Add some!</p>}
                      {semester.modules.map(module => (
                        <Card key={module.id} className="bg-background/50">
                          <CardContent className="p-2 flex justify-between items-center">
                            <div>
                              <p className="font-medium text-sm">{module.module_code} - {module.module_name}</p>
                              <p className="text-xs text-muted-foreground">Credits: {module.credits} | Grade: {module.grade || 'N/A'} (Points: {module.grade_points !== null ? parseFloat(module.grade_points).toFixed(2) : 'N/A'})</p>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openModuleForm(semester.id, module)}><Edit3 className="h-3 w-3" /></Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive"><Trash2 className="h-3 w-3" /></Button></AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader><AlertDialogTitle>Delete {module.module_name}?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                                  <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => deleteModule(module.id)}>Delete</AlertDialogAction></AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

      {/* Year Form Dialog */}
      <Dialog open={isYearFormOpen} onOpenChange={setIsYearFormOpen}>
        <DialogContent><DialogHeader><DialogTitle>{editingYearId ? 'Edit' : 'Add'} Academic Year</DialogTitle></DialogHeader>
          <form onSubmit={handleYearSubmit} className="space-y-4 py-2">
            <Input placeholder="e.g., First Year, 2023-2024" value={yearName} onChange={(e) => setYearName(e.target.value)} required />
            <DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose><Button type="submit" disabled={processing}>{processing ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 h-4 w-4" />} Save</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Semester Form Dialog */}
      <Dialog open={isSemesterFormOpen} onOpenChange={setIsSemesterFormOpen}>
        <DialogContent><DialogHeader><DialogTitle>{editingSemesterId ? 'Edit' : 'Add'} Semester</DialogTitle></DialogHeader>
          <form onSubmit={handleSemesterSubmit} className="space-y-4 py-2">
            <Input placeholder="e.g., Semester 1, Fall 2023" value={semesterName} onChange={(e) => setSemesterName(e.target.value)} required />
            <DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose><Button type="submit" disabled={processing}>{processing ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 h-4 w-4" />} Save</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Module Form Dialog */}
      <Dialog open={isModuleFormOpen} onOpenChange={setIsModuleFormOpen}>
        <DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>{editingModuleId ? 'Edit' : 'Add'} Module</DialogTitle></DialogHeader>
          <form onSubmit={handleModuleSubmit} className="space-y-3 py-2">
            <Input placeholder="Module Code (e.g., CS101)" value={moduleData.code} onChange={(e) => setModuleData(s => ({...s, code: e.target.value}))} required />
            <Input placeholder="Module Name (e.g., Intro to Programming)" value={moduleData.name} onChange={(e) => setModuleData(s => ({...s, name: e.target.value}))} required />
            <Input type="number" step="0.1" min="0" placeholder="Credits (e.g., 3.0)" value={moduleData.credits} onChange={(e) => setModuleData(s => ({...s, credits: e.target.value}))} required />
            <Select value={moduleData.grade} onValueChange={(value) => setModuleData(s => ({...s, grade: value === 'CLEAR_GRADE' ? '' : value}))}>
              <SelectTrigger><SelectValue placeholder="Select Grade (Optional)" /></SelectTrigger>
              <SelectContent>{Object.keys(gradePointMapSL).map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}<SelectItem value="CLEAR_GRADE">Clear Grade</SelectItem></SelectContent>
            </Select>
            <DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose><Button type="submit" disabled={processing}>{processing ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 h-4 w-4" />} Save</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </motion.div>
  );
};

export default GpaCalculatorPage;