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
import { supabase } from '@/lib/supabaseClient';

const DOCUMENTS_BUCKET = 'user-documents';

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
                    onClick={() => onDelete(doc.id, doc.storage_path)}
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
  const [fileToUpload, setFileToUpload] = useState(null);
  const [fileName, setFileName] = useState('');
  const [editingDoc, setEditingDoc] = useState(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const fetchDocuments = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: "Error Fetching Documents", description: error.message, variant: "destructive" });
    } else {
      setDocuments(data);
    }
    setLoading(false);
  }, [user, toast]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setFileToUpload(file);
      setFileName(file.name); // Default to file's name
    }
  };

  const handleUpload = async () => {
    if (!fileToUpload || !user) return;
    setUploading(true);

    const actualFileName = fileName || fileToUpload.name;
    const filePath = `${user.id}/${Date.now()}_${actualFileName}`;

    const { error: uploadError } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .upload(filePath, fileToUpload);

    if (uploadError) {
      toast({ title: "Upload Error", description: uploadError.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: publicURLData } = supabase.storage.from(DOCUMENTS_BUCKET).getPublicUrl(filePath);
    
    const { error: dbError } = await supabase
      .from('documents')
      .insert({
        user_id: user.id,
        file_name: actualFileName,
        file_type: fileToUpload.type,
        file_size: fileToUpload.size,
        storage_path: filePath,
        // public_url: publicURLData.publicUrl, // You can store this if needed
      });

    if (dbError) {
      toast({ title: "Database Error", description: dbError.message, variant: "destructive" });
      // Optionally, delete the uploaded file from storage if DB insert fails
      await supabase.storage.from(DOCUMENTS_BUCKET).remove([filePath]);
    } else {
      toast({ title: "File Uploaded", description: `${actualFileName} uploaded successfully.` });
      fetchDocuments(); // Refresh the list
    }
    setUploading(false);
    setFileToUpload(null);
    setFileName('');
    setIsUploadDialogOpen(false);
  };
  
  const handleDownload = async (doc) => {
    const { data, error } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .download(doc.storage_path);

    if (error) {
      toast({ title: "Download Error", description: error.message, variant: "destructive" });
      return;
    }
    
    const blob = new Blob([data], { type: doc.file_type });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = doc.file_name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    toast({ title: "Download Started", description: `Downloading ${doc.file_name}.` });
  };

  const handleDelete = async (docId, storagePath) => {
    if (!user) return;
    setProcessing(true);

    const { error: storageError } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .remove([storagePath]);

    if (storageError) {
      toast({ title: "Storage Deletion Error", description: storageError.message, variant: "destructive" });
      setProcessing(false);
      return;
    }

    const { error: dbError } = await supabase
      .from('documents')
      .delete()
      .eq('id', docId)
      .eq('user_id', user.id);

    if (dbError) {
      toast({ title: "Database Deletion Error", description: dbError.message, variant: "destructive" });
    } else {
      toast({ title: "Document Deleted", description: "Document removed successfully." });
      fetchDocuments();
    }
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

    const { error } = await supabase
      .from('documents')
      .update({ file_name: fileName, updated_at: new Date().toISOString() })
      .eq('id', editingDoc.id)
      .eq('user_id', user.id);

    if (error) {
      toast({ title: "Rename Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "File Renamed", description: "File name updated successfully." });
      fetchDocuments();
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
              <CardDescription>Upload, manage, and access your important files.</CardDescription>
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