import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, AlertDialogFooter } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, PlusCircle, Trash2, Edit3, Save, AlertCircle as Calculator } from 'lucide-react'; // Renamed import
import { gradePointMapSL } from '@/components/gpa-calculator/gpaUtils';

export const ModuleForm = ({ isOpen, setIsOpen, editingModule, setEditingModule, moduleFormData, setModuleFormData, onSubmit, processing, selectedSemesterId }) => (
  <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open && editingModule) setEditingModule(null); }}>
    <DialogTrigger asChild>
      {/* Trigger is now handled by the parent component to avoid duplication */}
      <span/>
    </DialogTrigger>
    <DialogContent className="sm:max-w-md">
      <DialogHeader><DialogTitle>{editingModule ? 'Edit' : 'Add'} Module</DialogTitle></DialogHeader>
      <form onSubmit={onSubmit} className="space-y-3 py-2">
        <Input placeholder="Module Code (e.g., CS101)" value={moduleFormData.code} onChange={(e) => setModuleFormData(s => ({...s, code: e.target.value}))} required />
        <Input placeholder="Module Name (e.g., Intro to Programming)" value={moduleFormData.name} onChange={(e) => setModuleFormData(s => ({...s, name: e.target.value}))} required />
        <Input type="number" step="0.1" min="0" placeholder="Credits (e.g., 3.0)" value={moduleFormData.credits} onChange={(e) => setModuleFormData(s => ({...s, credits: e.target.value}))} required />
        <Select value={moduleFormData.grade} onValueChange={(value) => setModuleFormData(s => ({...s, grade: value === 'CLEAR_GRADE' ? '' : value}))}>
          <SelectTrigger><SelectValue placeholder="Select Grade (Optional)" /></SelectTrigger>
          <SelectContent>
            {Object.keys(gradePointMapSL).map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
            <SelectItem value="CLEAR_GRADE">Clear Grade</SelectItem>
          </SelectContent>
        </Select>
        <DialogFooter>
          <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
          <Button type="submit" disabled={processing}>{processing ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 h-4 w-4" />} Save</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
);

export const ModuleItem = ({ module, onEdit, onDelete }) => (
  <Card className="hover:shadow-md transition-shadow">
    <CardContent className="p-3">
      <div className="flex justify-between items-start">
          <div>
              <p className="font-semibold">{module.module_code} - {module.module_name}</p>
              <p className="text-sm text-muted-foreground">Credits: {module.credits}</p>
              <p className="text-sm text-muted-foreground">Grade: {module.grade || 'N/A'} (Points: {module.grade_points !== null && module.grade_points !== undefined ? parseFloat(module.grade_points).toFixed(2) : 'N/A'})</p>
          </div>
          <div className="flex items-center space-x-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(module)}>
                <Edit3 className="h-4 w-4" />
              </Button>
              <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete {module.module_name}?</AlertDialogTitle>
                        <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => onDelete('module', module.id)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                  </AlertDialogContent>
              </AlertDialog>
          </div>
      </div>
    </CardContent>
  </Card>
);

export const ModulesList = ({ modules, loadingModules, selectedSemesterId, onEditModule, onDelete, openModuleForm }) => (
  <div className="space-y-4">
    <div className="flex justify-between items-center">
      <h3 className="text-xl font-semibold flex items-center"><Calculator className="mr-2 h-5 w-5 text-primary" /> Modules</h3>
      {selectedSemesterId && 
        <Button size="sm" variant="outline" onClick={openModuleForm} disabled={!selectedSemesterId}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Module
        </Button>
      }
    </div>
    {loadingModules ? <div className="flex justify-center py-4"><Loader2 className="animate-spin mx-auto h-8 w-8 text-primary" /></div> : 
      selectedSemesterId ? (
        modules.length > 0 ? modules.map(module => (
          <ModuleItem 
            key={module.id} 
            module={module} 
            onEdit={onEditModule} 
            onDelete={onDelete} 
          />
        )) : <p className="text-sm text-muted-foreground text-center py-4">No modules for this semester. Add some!</p>
      ) : <p className="text-sm text-muted-foreground text-center py-4">Select a semester to see modules.</p>
    }
  </div>
);
