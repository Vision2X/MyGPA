import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, AlertDialogFooter } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, PlusCircle, Trash2, Edit3, ListChecks, Save, GripVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { saveToLocalStorage, loadFromLocalStorage } from '@/lib/localStorageManager';
import { v4 as uuidv4 } from 'uuid';

const TASKS_STORAGE_KEY_PREFIX = 'mygpa_tasks_'; // Formerly milestones
const taskStatuses = ['To Do', 'In Progress', 'Done'];

const TaskItem = ({ item, index, onEdit, onDelete, dragHandleProps }) => (
  <Draggable key={item.id} draggableId={item.id.toString()} index={index}>
    {(provided, snapshot) => (
      <motion.div
        ref={provided.innerRef}
        {...provided.draggableProps}
        layout
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className={`p-3 mb-3 rounded-md shadow-sm hover:shadow-lg transition-shadow bg-background/90 border border-border ${snapshot.isDragging ? 'ring-2 ring-accent scale-105' : ''}`}
      >
        <div className="flex justify-between items-start">
          <div className="flex-grow">
            <h4 className="font-medium text-foreground">{item.title}</h4>
            {item.description && <p className="text-xs text-muted-foreground mt-1">{item.description}</p>}
            {item.target_date && <p className="text-xs text-muted-foreground mt-1">Target: {new Date(item.target_date).toLocaleDateString()}</p>}
          </div>
          <div className="flex flex-col items-center space-y-1 ml-2">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(item)}>
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
                      <AlertDialogTitle>Delete Task?</AlertDialogTitle>
                      <AlertDialogDescription>
                      This will permanently delete the task: "{item.title}".
                      </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => onDelete(item.id)}>
                      Delete
                      </AlertDialogAction>
                  </AlertDialogFooter>
                  </AlertDialogContent>
              </AlertDialog>
              <div {...dragHandleProps} className="cursor-grab p-1">
                  <GripVertical className="h-4 w-4 text-muted-foreground/50" />
              </div>
          </div>
        </div>
      </motion.div>
    )}
  </Draggable>
);

const TaskColumn = ({ columnId, column, onEdit, onDelete }) => (
  <Droppable droppableId={columnId} key={columnId}>
    {(provided, snapshot) => (
      <div
        ref={provided.innerRef}
        {...provided.droppableProps}
        className={`p-4 rounded-lg shadow-md min-h-[200px] glassmorphism transition-colors duration-200 ${snapshot.isDraggingOver ? 'bg-primary/20' : 'bg-card/80'}`}
      >
        <h3 className="text-xl font-semibold mb-4 text-center text-primary border-b-2 border-primary/30 pb-2">{column.name} ({column.items.length})</h3>
        <AnimatePresence>
        {column.items.map((item, index) => (
          <TaskItem 
            key={item.id} 
            item={item} 
            index={index} 
            onEdit={onEdit} 
            onDelete={onDelete} 
            dragHandleProps={provided.dragHandleProps}
          />
        ))}
        </AnimatePresence>
        {provided.placeholder}
      </div>
    )}
  </Droppable>
);

const TaskForm = ({ isOpen, setIsOpen, currentTask, formData, handleInputChange, handleStatusChange, handleSubmit, processing }) => (
  <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if(!open && currentTask) setIsOpen(false)}}>
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{currentTask ? 'Edit Task' : 'Add New Task'}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4 py-4">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" value={formData.title} onChange={handleInputChange} placeholder="e.g., Submit Assignment 1" required />
        </div>
        <div>
          <Label htmlFor="description">Description (Optional)</Label>
          <Textarea id="description" name="description" value={formData.description} onChange={handleInputChange} placeholder="Details about the task" />
        </div>
        <div>
          <Label htmlFor="target_date">Target Date (Optional)</Label>
          <Input id="target_date" name="target_date" type="date" value={formData.target_date} onChange={handleInputChange} />
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <Select name="status" value={formData.status} onValueChange={handleStatusChange}>
            <SelectTrigger id="status">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {taskStatuses.map(status => (
                <SelectItem key={status} value={status}>{status}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
          <Button type="submit" disabled={processing}>
            {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {currentTask ? 'Save Changes' : 'Add Task'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
);


const TasksPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState([]);
  const [columns, setColumns] = useState({});
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    target_date: '',
    status: 'To Do',
  });

  const getTasksStorageKey = useCallback(() => `${TASKS_STORAGE_KEY_PREFIX}${user.id}`, [user]);

  const fetchTasks = useCallback(() => {
    if (!user) return;
    setLoading(true);
    const userTasks = loadFromLocalStorage(getTasksStorageKey(), []);
    setTasks(userTasks.sort((a,b) => new Date(b.created_at) - new Date(a.created_at))); // Or by custom order
    setLoading(false);
  }, [user, getTasksStorageKey]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    const newColumns = taskStatuses.reduce((acc, status) => {
      acc[status] = {
        name: status,
        items: tasks.filter(task => task.status === status || (status === 'To Do' && !task.status)),
      };
      return acc;
    }, {});
    setColumns(newColumns);
  }, [tasks]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleStatusChange = (value) => {
     setFormData(prev => ({ ...prev, status: value }));
  };

  const resetForm = () => {
    setFormData({ title: '', description: '', target_date: '', status: 'To Do' });
    setCurrentTask(null);
  };

  const openFormDialog = (task = null) => {
    if (task) {
      setCurrentTask(task);
      setFormData({
        title: task.title,
        description: task.description || '',
        target_date: task.target_date ? task.target_date.split('T')[0] : '',
        status: task.status || 'To Do',
      });
    } else {
      resetForm();
    }
    setIsFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    setProcessing(true);

    const userTasks = loadFromLocalStorage(getTasksStorageKey(), []);
    const now = new Date().toISOString();

    if (currentTask) { // Editing
      const taskIndex = userTasks.findIndex(t => t.id === currentTask.id);
      if (taskIndex !== -1) {
        userTasks[taskIndex] = {
          ...userTasks[taskIndex],
          ...formData,
          target_date: formData.target_date || null,
          is_completed: formData.status === 'Done',
          completed_at: formData.status === 'Done' ? now : null,
          updated_at: now,
        };
      }
    } else { // Adding new
      const newTask = {
        id: uuidv4(),
        user_id: user.id,
        ...formData,
        target_date: formData.target_date || null,
        is_completed: formData.status === 'Done',
        completed_at: formData.status === 'Done' ? now : null,
        created_at: now,
        updated_at: now,
      };
      userTasks.push(newTask);
    }
    
    saveToLocalStorage(getTasksStorageKey(), userTasks);
    toast({ title: `Task ${currentTask ? 'Updated' : 'Added'}`, description: `${formData.title} details saved.` });
    fetchTasks();
    setIsFormOpen(false);
    resetForm();
    setProcessing(false);
  };

  const handleDelete = async (taskId) => {
    if (!user) return;
    setProcessing(true);
    let userTasks = loadFromLocalStorage(getTasksStorageKey(), []);
    userTasks = userTasks.filter(t => t.id !== taskId);
    saveToLocalStorage(getTasksStorageKey(), userTasks);
    
    toast({ title: "Task Deleted", description: "Task removed successfully." });
    fetchTasks();
    setProcessing(false);
  };

  const onDragEnd = async (result) => {
    if (!result.destination) return;
    const { source, destination, draggableId } = result;

    if (source.droppableId === destination.droppableId && source.index === destination.index) return;
    
    const userTasks = loadFromLocalStorage(getTasksStorageKey(), []);
    const taskToMove = userTasks.find(t => t.id.toString() === draggableId);
    if (!taskToMove) return;
    
    const newStatus = destination.droppableId;
    const now = new Date().toISOString();
    
    const updatedTask = {
      ...taskToMove,
      status: newStatus,
      is_completed: newStatus === 'Done',
      completed_at: newStatus === 'Done' ? now : null,
      updated_at: now,
    };

    const taskIndex = userTasks.findIndex(t => t.id === taskToMove.id);
    if (taskIndex !== -1) {
      userTasks[taskIndex] = updatedTask;
      saveToLocalStorage(getTasksStorageKey(), userTasks);
      toast({ title: "Task Moved", description: `Task "${taskToMove.title}" moved to ${newStatus}.` });
      fetchTasks(); // Refresh UI from localStorage
    } else {
      toast({ title: "Task Move Error", description: "Could not find task to move.", variant: "destructive" });
    }
  };

  if (loading) {
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
      className="space-y-6"
    >
      <Card className="glassmorphism">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center space-x-3">
            <ListChecks className="h-10 w-10 text-primary" />
            <div>
              <CardTitle className="text-3xl gradient-text">My Tasks</CardTitle>
              <CardDescription>Organize your to-dos with this Kanban board.</CardDescription>
            </div>
          </div>
          <Button onClick={() => openFormDialog()} className="bg-gradient-to-r from-primary to-accent hover:opacity-90">
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Task
          </Button>
        </CardHeader>
      </Card>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {Object.entries(columns).map(([columnId, column]) => (
            <TaskColumn 
              key={columnId} 
              columnId={columnId} 
              column={column} 
              onEdit={openFormDialog} 
              onDelete={handleDelete} 
            />
          ))}
        </div>
      </DragDropContext>

      <TaskForm 
        isOpen={isFormOpen}
        setIsOpen={setIsFormOpen}
        currentTask={currentTask}
        formData={formData}
        handleInputChange={handleInputChange}
        handleStatusChange={handleStatusChange}
        handleSubmit={handleSubmit}
        processing={processing}
      />
    </motion.div>
  );
};

export default TasksPage;