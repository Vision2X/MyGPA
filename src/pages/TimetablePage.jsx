
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, AlertDialogFooter } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, PlusCircle, Trash2, Edit3, CalendarClock, Save, BellRing } from 'lucide-react';
import { motion } from 'framer-motion';
import { saveToLocalStorage, loadFromLocalStorage } from '@/lib/localStorageManager';
import { v4 as uuidv4 } from 'uuid';

const TIMETABLE_STORAGE_KEY_PREFIX = 'mygpa_timetable_';
const eventTypes = ['Lecture', 'Lab', 'Office Hours', 'Study Session', 'Exam', 'Other'];
const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const TimetableEventItem = ({ event, onEdit, onDelete }) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.2 }}
    className="p-4 mb-4 rounded-lg shadow-sm hover:shadow-lg transition-shadow bg-card/90 border border-border"
  >
    <div className="flex justify-between items-start">
      <div>
        <h4 className="font-semibold text-lg text-primary">{event.title}</h4>
        <p className="text-sm text-muted-foreground">{event.type} on {event.day}</p>
        <p className="text-sm text-muted-foreground">Time: {event.startTime} - {event.endTime}</p>
        {event.location && <p className="text-sm text-muted-foreground">Location: {event.location}</p>}
        {event.notes && <p className="text-xs text-muted-foreground mt-1">Notes: {event.notes}</p>}
      </div>
      <div className="flex flex-col space-y-1">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(event)}>
          <Edit3 className="h-4 w-4" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Event?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the event: "{event.title}".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => onDelete(event.id)}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  </motion.div>
);

const TimetableForm = ({ isOpen, setIsOpen, currentEvent, formData, handleInputChange, handleSelectChange, handleSubmit, processing }) => (
  <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open && currentEvent) setIsOpen(false); }}>
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>{currentEvent ? 'Edit Timetable Event' : 'Add New Timetable Event'}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4 py-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="title">Event Title</Label>
            <Input id="title" name="title" value={formData.title} onChange={handleInputChange} placeholder="e.g., CS101 Lecture" required />
          </div>
          <div>
            <Label htmlFor="type">Event Type</Label>
            <Select name="type" value={formData.type} onValueChange={(value) => handleSelectChange('type', value)}>
              <SelectTrigger id="type"><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>{eventTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="day">Day of Week</Label>
            <Select name="day" value={formData.day} onValueChange={(value) => handleSelectChange('day', value)}>
              <SelectTrigger id="day"><SelectValue placeholder="Select day" /></SelectTrigger>
              <SelectContent>{daysOfWeek.map(day => <SelectItem key={day} value={day}>{day}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="startTime">Start Time</Label>
            <Input id="startTime" name="startTime" type="time" value={formData.startTime} onChange={handleInputChange} required />
          </div>
          <div>
            <Label htmlFor="endTime">End Time</Label>
            <Input id="endTime" name="endTime" type="time" value={formData.endTime} onChange={handleInputChange} required />
          </div>
        </div>
        <div>
          <Label htmlFor="location">Location (Optional)</Label>
          <Input id="location" name="location" value={formData.location} onChange={handleInputChange} placeholder="e.g., Room 301, Online" />
        </div>
        <div>
          <Label htmlFor="notes">Notes (Optional)</Label>
          <Input id="notes" name="notes" value={formData.notes} onChange={handleInputChange} placeholder="Additional details or reminders" />
        </div>
        <DialogFooter>
          <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
          <Button type="submit" disabled={processing}>
            {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {currentEvent ? 'Save Changes' : 'Add Event'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
);

const TimetablePage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    type: eventTypes[0],
    day: daysOfWeek[0],
    startTime: '',
    endTime: '',
    location: '',
    notes: '',
  });

  const getTimetableStorageKey = useCallback(() => `${TIMETABLE_STORAGE_KEY_PREFIX}${user.id}`, [user]);

  const fetchEvents = useCallback(() => {
    if (!user) return;
    setLoading(true);
    const userEvents = loadFromLocalStorage(getTimetableStorageKey(), []);
    // Sort events by day, then start time
    userEvents.sort((a, b) => {
      const dayComparison = daysOfWeek.indexOf(a.day) - daysOfWeek.indexOf(b.day);
      if (dayComparison !== 0) return dayComparison;
      return a.startTime.localeCompare(b.startTime);
    });
    setEvents(userEvents);
    setLoading(false);
  }, [user, getTimetableStorageKey]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({ title: '', type: eventTypes[0], day: daysOfWeek[0], startTime: '', endTime: '', location: '', notes: '' });
    setCurrentEvent(null);
  };

  const openFormDialog = (event = null) => {
    if (event) {
      setCurrentEvent(event);
      setFormData({
        title: event.title,
        type: event.type,
        day: event.day,
        startTime: event.startTime,
        endTime: event.endTime,
        location: event.location || '',
        notes: event.notes || '',
      });
    } else {
      resetForm();
    }
    setIsFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    if (new Date(`1970-01-01T${formData.startTime}`) >= new Date(`1970-01-01T${formData.endTime}`)) {
        toast({ title: "Invalid Time", description: "Start time must be before end time.", variant: "destructive" });
        return;
    }
    setProcessing(true);

    const userEvents = loadFromLocalStorage(getTimetableStorageKey(), []);
    const now = new Date().toISOString();

    if (currentEvent) { // Editing
      const eventIndex = userEvents.findIndex(ev => ev.id === currentEvent.id);
      if (eventIndex !== -1) {
        userEvents[eventIndex] = { ...currentEvent, ...formData, updated_at: now };
      }
    } else { // Adding new
      const newEvent = { id: uuidv4(), user_id: user.id, ...formData, created_at: now, updated_at: now };
      userEvents.push(newEvent);
    }
    
    saveToLocalStorage(getTimetableStorageKey(), userEvents);
    toast({ title: `Event ${currentEvent ? 'Updated' : 'Added'}`, description: `${formData.title} details saved.` });
    fetchEvents();
    setIsFormOpen(false);
    resetForm();
    setProcessing(false);
  };

  const handleDelete = async (eventId) => {
    if (!user) return;
    setProcessing(true);
    let userEvents = loadFromLocalStorage(getTimetableStorageKey(), []);
    userEvents = userEvents.filter(ev => ev.id !== eventId);
    saveToLocalStorage(getTimetableStorageKey(), userEvents);
    
    toast({ title: "Event Deleted", description: "Timetable event removed successfully." });
    fetchEvents();
    setProcessing(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-[calc(100vh-200px)]"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <Card className="glassmorphism">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center space-x-3">
            <CalendarClock className="h-10 w-10 text-primary" />
            <div>
              <CardTitle className="text-3xl gradient-text">My Timetable</CardTitle>
              <CardDescription>Manage your weekly schedule and set up reminders (soon!).</CardDescription>
            </div>
          </div>
          <Button onClick={() => openFormDialog()} className="bg-gradient-to-r from-primary to-accent hover:opacity-90">
            <PlusCircle className="mr-2 h-4 w-4" /> Add Event
          </Button>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <div className="text-center py-10">
              <CalendarClock className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Your timetable is empty. Add some events to get started!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((event) => (
                <TimetableEventItem 
                  key={event.id} 
                  event={event} 
                  onEdit={openFormDialog} 
                  onDelete={handleDelete} 
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <TimetableForm
        isOpen={isFormOpen}
        setIsOpen={setIsFormOpen}
        currentEvent={currentEvent}
        formData={formData}
        handleInputChange={handleInputChange}
        handleSelectChange={handleSelectChange}
        handleSubmit={handleSubmit}
        processing={processing}
      />
       <Card className="glassmorphism mt-8">
        <CardHeader>
          <CardTitle className="flex items-center"><BellRing className="mr-2 h-5 w-5 text-accent" /> Reminders</CardTitle>
          <CardDescription>Event reminders will appear here. This feature is coming soon!</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-6">No active reminders. Stay tuned!</p>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default TimetablePage;
