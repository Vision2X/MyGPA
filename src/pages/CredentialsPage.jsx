import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, AlertDialogFooter } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, PlusCircle, Trash2, Edit3, KeyRound, Eye, EyeOff, Save, BookCopy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { saveToLocalStorage, loadFromLocalStorage } from '@/lib/localStorageManager';
import { v4 as uuidv4 } from 'uuid';

const CREDENTIALS_STORAGE_KEY_PREFIX = 'mygpa_credentials_';

const CredentialItem = ({ cred, onEdit, onDelete, onToggleVisibility, showPassword }) => (
  <motion.div
    layout
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.8 }}
    transition={{ duration: 0.3 }}
  >
    <Card className="overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col h-full">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <KeyRound className="h-8 w-8 text-primary mb-2" />
          <div className="flex space-x-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(cred)}>
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
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action will permanently delete the credentials for "{cred.service_name}".
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => onDelete(cred.id)}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        <CardTitle className="text-lg truncate" title={cred.service_name}>{cred.service_name}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground flex-grow space-y-1">
        <p><strong>Username:</strong> {cred.username || 'N/A'}</p>
        <div className="flex items-center">
          <strong>Password:</strong>&nbsp;
          {showPassword ? (
            <span>{cred.password_encrypted}</span> 
          ) : (
            <span>••••••••</span>
          )}
          <Button variant="ghost" size="icon" className="h-6 w-6 ml-2" onClick={() => onToggleVisibility(cred.id)}>
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
        {cred.notes && <p className="pt-1"><strong>Notes:</strong> <span className="whitespace-pre-wrap">{cred.notes}</span></p>}
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground">Last updated: {new Date(cred.updated_at).toLocaleDateString()}</p>
      </CardFooter>
    </Card>
  </motion.div>
);

const CredentialForm = ({ isOpen, setIsOpen, currentCredential, formData, handleInputChange, handleSubmit, processing }) => (
  <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if(!open && currentCredential) setIsOpen(false) }}>
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{currentCredential ? 'Edit Credential' : 'Add New Credential'}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4 py-4">
        <div>
          <Label htmlFor="service_name">Service Name</Label>
          <Input id="service_name" name="service_name" value={formData.service_name} onChange={handleInputChange} placeholder="e.g., Google, University Portal" required />
        </div>
        <div>
          <Label htmlFor="username">Username/Email</Label>
          <Input id="username" name="username" value={formData.username} onChange={handleInputChange} placeholder="Your username or email" />
        </div>
        <div>
          <Label htmlFor="password_encrypted">Password</Label>
          <Input id="password_encrypted" name="password_encrypted" type="text" value={formData.password_encrypted} onChange={handleInputChange} placeholder="Enter password" />
        </div>
        <div>
          <Label htmlFor="notes">Notes (Optional)</Label>
          <Textarea id="notes" name="notes" value={formData.notes} onChange={handleInputChange} placeholder="Any additional notes, recovery codes, etc." />
        </div>
        <DialogFooter>
          <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
          <Button type="submit" disabled={processing}>
            {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {currentCredential ? 'Save Changes' : 'Add Credential'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
);


const CredentialsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showPassword, setShowPassword] = useState({});

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentCredential, setCurrentCredential] = useState(null);
  const [formData, setFormData] = useState({
    service_name: '',
    username: '',
    password_encrypted: '', // For localStorage, this will be stored as plain text.
    notes: '',
  });

  const getCredsStorageKey = useCallback(() => `${CREDENTIALS_STORAGE_KEY_PREFIX}${user.id}`, [user]);

  const fetchCredentials = useCallback(() => {
    if (!user) return;
    setLoading(true);
    const userCredentials = loadFromLocalStorage(getCredsStorageKey(), []);
    setCredentials(userCredentials.sort((a,b) => new Date(b.created_at) - new Date(a.created_at)));
    setLoading(false);
  }, [user, getCredsStorageKey]);

  useEffect(() => {
    fetchCredentials();
  }, [fetchCredentials]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({ service_name: '', username: '', password_encrypted: '', notes: '' });
    setCurrentCredential(null);
  };

  const openFormDialog = (credential = null) => {
    if (credential) {
      setCurrentCredential(credential);
      setFormData({
        service_name: credential.service_name,
        username: credential.username || '',
        password_encrypted: credential.password_encrypted || '',
        notes: credential.notes || '',
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

    const userCredentials = loadFromLocalStorage(getCredsStorageKey(), []);
    const now = new Date().toISOString();

    if (currentCredential) { // Editing
      const credIndex = userCredentials.findIndex(c => c.id === currentCredential.id);
      if (credIndex !== -1) {
        userCredentials[credIndex] = {
          ...userCredentials[credIndex],
          ...formData,
          updated_at: now,
        };
      }
    } else { // Adding new
      const newCredential = {
        id: uuidv4(),
        user_id: user.id,
        ...formData,
        created_at: now,
        updated_at: now,
      };
      userCredentials.push(newCredential);
    }
    
    saveToLocalStorage(getCredsStorageKey(), userCredentials);
    toast({ title: `Credential ${currentCredential ? 'Updated' : 'Saved'}`, description: `${formData.service_name} details saved.` });
    fetchCredentials();
    setIsFormOpen(false);
    resetForm();
    setProcessing(false);
  };

  const handleDelete = async (credId) => {
    if (!user) return;
    setProcessing(true);
    let userCredentials = loadFromLocalStorage(getCredsStorageKey(), []);
    userCredentials = userCredentials.filter(c => c.id !== credId);
    saveToLocalStorage(getCredsStorageKey(), userCredentials);
    
    toast({ title: "Credential Deleted", description: "Credential removed successfully." });
    fetchCredentials();
    setProcessing(false);
  };

  const togglePasswordVisibility = (id) => {
    setShowPassword(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      <Card className="glassmorphism">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center space-x-3">
            <BookCopy className="h-10 w-10 text-primary" />
            <div>
              <CardTitle className="text-3xl gradient-text">Credentials Manager</CardTitle>
              <CardDescription>Store and manage your usernames and passwords locally.</CardDescription>
            </div>
          </div>
          <Button onClick={() => openFormDialog()} className="bg-gradient-to-r from-primary to-accent hover:opacity-90">
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Credential
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : credentials.length === 0 ? (
            <div className="text-center py-10">
              <KeyRound className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No credentials saved yet. Click "Add New Credential" to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {credentials.map((cred) => (
                  <CredentialItem 
                    key={cred.id} 
                    cred={cred} 
                    onEdit={openFormDialog} 
                    onDelete={handleDelete}
                    onToggleVisibility={togglePasswordVisibility}
                    showPassword={showPassword[cred.id]}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>
      <CredentialForm 
        isOpen={isFormOpen} 
        setIsOpen={setIsFormOpen} 
        currentCredential={currentCredential}
        formData={formData}
        handleInputChange={handleInputChange}
        handleSubmit={handleSubmit}
        processing={processing}
      />
    </motion.div>
  );
};

export default CredentialsPage;