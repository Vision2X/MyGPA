import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, AlertDialogFooter } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Upload, Trash2, FileText, Download, Edit3, FolderKanban, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { saveToLocalStorage, loadFromLocalStorage, removeFromLocalStorage } from '@/lib/localStorageManager';
import { v4 as uuidv4 } from 'uuid';

const DOCUMENTS_STORAGE_KEY_PREFIX = 'mygpa_documents_'; // For metadata list per user
const DOCUMENT_CONTENT_STORAGE_KEY_PREFIX = 'mygpa_doc_content_'; // For actual file content (Data URL)

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const DocumentItem = ({ doc, onEdit, onDelete, onDownload }) => (
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
           <FileText className="h-10 w-10 text-primary mb-2" />
           <div className="flex space-x-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(doc)}>
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
                    This action cannot be undone. This will permanently delete "{doc.file_name}".
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                    className="bg-destructive hover:bg-destructive/90"
                    onClick={() => onDelete(doc.id)}
                    >
                    Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
           </div>
        </div>
        <CardTitle className="text-lg truncate" title={doc.file_name}>{doc.file_name}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground flex-grow">
        <p>Type: {doc.file_type || 'N/A'}</p>
        <p>Size: {formatFileSize(doc.file_size || 0)}</p>
        <p>Uploaded: {new Date(doc.created_at).toLocaleDateString()}</p>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full" onClick={() => onDownload(doc)}>
          <Download className="mr-2 h-4 w-4" /> Download
        </Button>
      </CardFooter>
    </Card>
  </motion.div>
);

const UploadDocumentForm = ({ isOpen, setIsOpen, fileName, setFileName, handleFileChange, handleUpload, uploading, fileToUpload }) => (
  <Dialog open={isOpen} onOpenChange={setIsOpen}>
    <DialogTrigger asChild>
      <Button className="bg-gradient-to-r from-primary to-accent hover:opacity-90">
        <Upload className="mr-2 h-4 w-4" /> Upload New Document
      </Button>
    </DialogTrigger>
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Upload Document</DialogTitle>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="doc-name">Document Name (Optional)</Label>
          <Input id="doc-name" value={fileName} onChange={(e) => setFileName(e.target.value)} placeholder="e.g., Transcript.pdf" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="doc-file">File</Label>
          <Input id="doc-file" type="file" onChange={handleFileChange} />
        </div>
      </div>
      <DialogFooter>
        <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
        <Button onClick={handleUpload} disabled={uploading || !fileToUpload}>
          {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />} Upload
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

const EditDocumentForm = ({ isOpen, setIsOpen, fileName, setFileName, handleUpdateFileName, processing, setEditingDoc }) => (
  <Dialog open={isOpen} onOpenChange={(open) => { if(!open) setEditingDoc(null); setIsOpen(open);}}>
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Edit Document Name</DialogTitle>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="edit-doc-name">Document Name</Label>
          <Input id="edit-doc-name" value={fileName} onChange={(e) => setFileName(e.target.value)} placeholder="e.g., Transcript.pdf" />
        </div>
      </div>
      <DialogFooter>
        <DialogClose asChild><Button variant="outline" onClick={() => setEditingDoc(null)}>Cancel</Button></DialogClose>
        <Button onClick={handleUpdateFileName} disabled={processing || !fileName}>
          {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Save Changes
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

const DocumentsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [fileToUpload, setFileToUpload] = useState(null); // File object
  const [fileName, setFileName] = useState(''); // For custom naming
  const [editingDoc, setEditingDoc] = useState(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const getDocsStorageKey = useCallback(() => `${DOCUMENTS_STORAGE_KEY_PREFIX}${user.id}`, [user]);

  const fetchDocuments = useCallback(() => {
    if (!user) return;
    setLoading(true);
    const userDocuments = loadFromLocalStorage(getDocsStorageKey(), []);
    setDocuments(userDocuments.sort((a,b) => new Date(b.created_at) - new Date(a.created_at)));
    setLoading(false);
  }, [user, getDocsStorageKey]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setFileToUpload(file);
      setFileName(file.name); 
    }
  };

  const handleUpload = async () => {
    if (!fileToUpload || !user) return;
    setUploading(true);

    const reader = new FileReader();
    reader.readAsDataURL(fileToUpload);
    reader.onload = () => {
      const fileDataUrl = reader.result;
      const actualFileName = fileName || fileToUpload.name;
      const docId = uuidv4();

      const newDocumentMeta = {
        id: docId,
        user_id: user.id,
        file_name: actualFileName,
        file_type: fileToUpload.type,
        file_size: fileToUpload.size,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Save metadata
      const userDocuments = loadFromLocalStorage(getDocsStorageKey(), []);
      userDocuments.push(newDocumentMeta);
      saveToLocalStorage(getDocsStorageKey(), userDocuments);

      // Save content (Data URL)
      saveToLocalStorage(`${DOCUMENT_CONTENT_STORAGE_KEY_PREFIX}${docId}`, fileDataUrl);
      
      toast({ title: "File Uploaded", description: `${actualFileName} uploaded successfully.` });
      fetchDocuments();
      setUploading(false);
      setFileToUpload(null);
      setFileName('');
      setIsUploadDialogOpen(false);
    };
    reader.onerror = () => {
      toast({ title: "Upload Error", description: "Could not read file for upload.", variant: "destructive" });
      setUploading(false);
    };
  };
  
  const handleDownload = async (doc) => {
    const fileDataUrl = loadFromLocalStorage(`${DOCUMENT_CONTENT_STORAGE_KEY_PREFIX}${doc.id}`);
    if (!fileDataUrl) {
      toast({ title: "Download Error", description: "File content not found.", variant: "destructive" });
      return;
    }
    
    const link = document.createElement('a');
    link.href = fileDataUrl;
    link.download = doc.file_name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Download Started", description: `Downloading ${doc.file_name}.` });
  };

  const handleDelete = async (docId) => {
    if (!user) return;
    setProcessing(true);

    let userDocuments = loadFromLocalStorage(getDocsStorageKey(), []);
    userDocuments = userDocuments.filter(d => d.id !== docId);
    saveToLocalStorage(getDocsStorageKey(), userDocuments);
    removeFromLocalStorage(`${DOCUMENT_CONTENT_STORAGE_KEY_PREFIX}${docId}`);
    
    toast({ title: "Document Deleted", description: "Document removed successfully." });
    fetchDocuments();
    setProcessing(false);
  };
  
  const openEditDialog = (doc) => {
    setEditingDoc(doc);
    setFileName(doc.file_name);
    setIsEditDialogOpen(true);
  };

  const handleUpdateFileName = async () => {
    if (!editingDoc || !fileName || !user) return;
    setProcessing(true);

    let userDocuments = loadFromLocalStorage(getDocsStorageKey(), []);
    const docIndex = userDocuments.findIndex(d => d.id === editingDoc.id);
    if (docIndex !== -1) {
      userDocuments[docIndex].file_name = fileName;
      userDocuments[docIndex].updated_at = new Date().toISOString();
      saveToLocalStorage(getDocsStorageKey(), userDocuments);
      toast({ title: "File Renamed", description: "File name updated successfully." });
      fetchDocuments();
    } else {
      toast({ title: "Rename Error", description: "Document not found.", variant: "destructive" });
    }
    
    setProcessing(false);
    setIsEditDialogOpen(false);
    setEditingDoc(null);
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
            <FolderKanban className="h-10 w-10 text-primary" />
            <div>
              <CardTitle className="text-3xl gradient-text">My Documents</CardTitle>
              <CardDescription>Upload, manage, and access your important files locally.</CardDescription>
            </div>
          </div>
          <UploadDocumentForm 
            isOpen={isUploadDialogOpen}
            setIsOpen={setIsUploadDialogOpen}
            fileName={fileName}
            setFileName={setFileName}
            handleFileChange={handleFileChange}
            handleUpload={handleUpload}
            uploading={uploading}
            fileToUpload={fileToUpload}
          />
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-10">
              <FileText className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No documents uploaded yet. Click "Upload New Document" to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {documents.map((doc) => (
                  <DocumentItem 
                    key={doc.id} 
                    doc={doc} 
                    onEdit={openEditDialog} 
                    onDelete={handleDelete} 
                    onDownload={handleDownload} 
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>

      {editingDoc && (
        <EditDocumentForm 
          isOpen={isEditDialogOpen}
          setIsOpen={setIsEditDialogOpen}
          fileName={fileName}
          setFileName={setFileName}
          handleUpdateFileName={handleUpdateFileName}
          processing={processing}
          setEditingDoc={setEditingDoc}
        />
      )}
    </motion.div>
  );
};

export default DocumentsPage;