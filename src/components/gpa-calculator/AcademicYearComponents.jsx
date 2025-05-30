import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, AlertDialogFooter } from '@/components/ui/alert-dialog';
import { Loader2, PlusCircle, Trash2, Edit3, Save, CalendarDays } from 'lucide-react';

export const AcademicYearForm = ({ isOpen, setIsOpen, editingYear, setEditingYear, yearFormData, setYearFormData, onSubmit, processing }) => (
  <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open && editingYear) setEditingYear(null); }}>
    <DialogTrigger asChild>
      {/* Trigger is now handled by the parent component to avoid duplication */}
      <span/>
    </DialogTrigger>
    <DialogContent>
      <DialogHeader><DialogTitle>{editingYear ? 'Edit' : 'Add'} Academic Year</DialogTitle></DialogHeader>
      <form onSubmit={onSubmit} className="space-y-4 py-2">
        <Input placeholder="e.g., First Year, 2023-2024" value={yearFormData.name} onChange={(e) => setYearFormData({ name: e.target.value })} required />
        <DialogFooter>
          <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
          <Button type="submit" disabled={processing}>{processing ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 h-4 w-4" />} Save</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
);

export const AcademicYearItem = ({ year, selectedYearId, setSelectedYearId, onEdit, onDelete, getGpaClass }) => (
  <Card 
    className={`cursor-pointer hover:shadow-md transition-shadow ${selectedYearId === year.id ? 'border-primary ring-2 ring-primary' : 'border-border'}`} 
    onClick={() => setSelectedYearId(year.id)}
  >
    <CardContent className="p-3 flex justify-between items-center">
      <div>
          <p className="font-medium">{year.year_name}</p>
          {year.year_gpa !== null && year.year_gpa !== undefined && 
            <p className="text-xs text-muted-foreground">GPA: {parseFloat(year.year_gpa).toFixed(2)} ({getGpaClass(year.year_gpa)})</p>
          }
      </div>
      <div className="flex items-center space-x-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onEdit(year); }}>
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
                    <AlertDialogTitle>Delete {year.year_name}?</AlertDialogTitle>
                    <AlertDialogDescription>This will delete the year and all its semesters and modules. This action cannot be undone.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => onDelete('year', year.id)}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
              </AlertDialogContent>
          </AlertDialog>
      </div>
    </CardContent>
  </Card>
);

export const AcademicYearsList = ({ years, loadingYears, selectedYearId, setSelectedYearId, onEditYear, onDelete, getGpaClass, openYearForm }) => (
  <div className="space-y-4">
    <div className="flex justify-between items-center">
      <h3 className="text-xl font-semibold flex items-center"><CalendarDays className="mr-2 h-5 w-5 text-primary" /> Academic Years</h3>
      <Button size="sm" variant="outline" onClick={openYearForm}>
        <PlusCircle className="mr-2 h-4 w-4" /> Add Year
      </Button>
    </div>
    {loadingYears ? <div className="flex justify-center py-4"><Loader2 className="animate-spin mx-auto h-8 w-8 text-primary" /></div> : 
      years.length > 0 ? years.map(year => (
        <AcademicYearItem 
          key={year.id} 
          year={year} 
          selectedYearId={selectedYearId} 
          setSelectedYearId={setSelectedYearId} 
          onEdit={onEditYear} 
          onDelete={onDelete} 
          getGpaClass={getGpaClass}
        />
    )) : <p className="text-sm text-muted-foreground text-center py-4">No academic years added yet.</p>}
  </div>
);
