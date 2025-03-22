
import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { getFileRecipients, removeFileAccess, FileRecipient } from '@/lib/filesharing';
import ShareForm from './share/ShareForm';
import RecipientList from './share/RecipientList';

interface ShareFileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filePath: string;
  fileName: string;
}

const ShareFileDialog: React.FC<ShareFileDialogProps> = ({ 
  open, 
  onOpenChange, 
  filePath, 
  fileName 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);
  const [recipients, setRecipients] = useState<FileRecipient[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && filePath) {
      fetchRecipients();
      setError(null);
    }
  }, [open, filePath]);

  const fetchRecipients = async () => {
    if (!filePath) return;
    
    try {
      setIsLoading(true);
      const fetchedRecipients = await getFileRecipients(filePath);
      setRecipients(fetchedRecipients);
    } catch (err) {
      console.error("Error fetching recipients:", err);
      setError("Failed to load current shares");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveAccess = async (shareId: string) => {
    setIsRemoving(shareId);
    try {
      const success = await removeFileAccess(shareId);
      if (success) {
        await fetchRecipients();
      } else {
        setError("Failed to remove access");
      }
    } catch (err) {
      console.error("Error removing access:", err);
      setError("An unexpected error occurred while removing access");
    } finally {
      setIsRemoving(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share "{fileName}"</DialogTitle>
          <DialogDescription>
            Share this encrypted file with other users securely.
          </DialogDescription>
        </DialogHeader>
        
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <ShareForm 
          filePath={filePath}
          onShareComplete={fetchRecipients}
          setError={setError}
        />
        
        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2">People with access</h4>
          
          <RecipientList
            recipients={recipients}
            isLoading={isLoading}
            isRemoving={isRemoving}
            onRemoveAccess={handleRemoveAccess}
          />
        </div>
        
        <DialogFooter className="sm:justify-end">
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShareFileDialog;
