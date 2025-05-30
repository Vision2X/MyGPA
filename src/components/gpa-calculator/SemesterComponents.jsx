import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, AlertDialogFooter } from '@/components/ui/alert-dialog';
import { Loader2, PlusCircle, Trash2, Edit3, Save, BookOpen } from 'lucide-react';

export const SemesterForm = ({ isOpen, setIsOpen, editingSemester, setEditingSemester, semesterFormData, setSemesterFormData, onSubmit, processing, selectedYearId }) => (
  <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open && editingSemester) setEditingSemester(null); }}>
    <DialogTrigger asChild>
      {/* Trigger is now handled by the parent component to avoid duplication */}
      <span/>
    </DialogTrigger>
    <DialogContent>
      <DialogHeader><DialogTitle>{editingSemester ? 'Edit' : 'Add'} Semester</DialogTitle></DialogHeader>
      <form onSubmit={onSubmit} className="space-y-4 py-2">
        <Input placeholder="e.g., Semester 1, Fall 2023" value={semesterFormData.name} onChange={(e) => setSemesterFormData({ name: e.target.value })} required />
        <DialogFooter>
          <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
          <Button type="submit" disabled={processing}>{processing ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 h-4 w-4" />} Save</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
);

export const SemesterItem = ({ semester, selectedSemesterId, setSelectedSemesterId, onEdit, onDelete, getGpaClass }) => (
  <Card 
    className={`cursor-pointer hover:shadow-md transition-shadow ${selectedSemesterId === semester.id ? 'border-primary ring-2 ring-primary' : 'border-border'}`} 
    onClick={() => setSelectedSemesterId(semester.id)}
  >
    <CardContent className="p-3 flex justify-between items-center">
      <div>
          <p className="font-medium">{semester.semester_name}</p>
          {semester.semester_gpa !== null && semester.semester_gpa !== undefined && 
            <p className="text-xs text-muted-foreground">GPA: {parseFloat(semester.semester_gpa).toFixed(2)} ({getGpaClass(semester.semester_gpa)})</p>
          }
          {semester.total_credits !== null && semester.total_credits !== undefined && 
            <p className="text-xs text-muted-foreground">Credits: {semester.total_credits}</p>
          }
      </div>
      <div className="flex items-center space-x-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onEdit(semester); }}>
            <Edit3 className="h-4 w-4" />
          </Button>
          <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={(e) => e.stopPropagation()}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete {semester.semester_name}?</AlertDialogTitle>
                    <AlertDialogDescription>This will delete the semester and all its modules. This action cannot be undone.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => onDelete('semester', semester.id)}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
              </AlertDialogContent>
          </AlertDialog>
      </div>
    </CardContent>
  </Card>
);

export const SemestersList = ({ semesters, loadingSemesters, selectedYearId, selectedSemesterId, setSelectedSemesterId, onEditSemester, onDelete, getGpaClass, openSemesterForm }) => (
  <div className="space-y-4">
    <div className="flex justify-between items-center">
      <h3 className="text-xl font-semibold flex items-center"><BookOpen className="mr-2 h-5 w-5 text-primary" /> Semesters</h3>
      {selectedYearId && 
        <Button size="sm" variant="outline" onClick={openSemesterForm} disabled={!selectedYearId}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Semester
        </Button>
      }
    </div>
    {loadingSemesters ? <div className="flex justify-center py-4"><Loader2 className="animate-spin mx-auto h-8 w-8 text-primary" /></div> : 
      selectedYearId ? (
        semesters.length > 0 ? semesters.map(semester => (
          <SemesterItem 
            key={semester.id} 
            semester={semester} 
            selectedSemesterId={selectedSemesterId} 
            setSelectedSemesterId={setSelectedSemesterId} 
            onEdit={onEditSemester} 
            onDelete={onDelete}
            getGpaClass={getGpaClass}
          />
        )) : <p className="text-sm text-muted-foreground text-center py-4">No semesters for this year. Add one!</p>
      ) : <p className="text-sm text-muted-foreground text-center py-4">Select an academic year to see semesters.</p>
    }
  </div>
);
