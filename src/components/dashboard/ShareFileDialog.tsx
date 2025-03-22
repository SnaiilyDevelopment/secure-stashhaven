
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, Mail, Eye, Edit, Star, AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/components/ui/use-toast';
import { 
  shareFileWithUser, 
  ShareFileError,
  getFileRecipients, 
  removeFileAccess, 
  FileRecipient 
} from '@/lib/filesharing';

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
  const [email, setEmail] = useState('');
  const [permissions, setPermissions] = useState<'view' | 'edit' | 'admin'>('view');
  const [isLoading, setIsLoading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
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

  const handleShare = async () => {
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter an email address.",
        variant: "destructive"
      });
      return;
    }

    setIsSharing(true);
    setError(null);
    
    try {
      const result = await shareFileWithUser(filePath, email, permissions);
      
      if (result.success) {
        setEmail('');
        await fetchRecipients();
      } else if (result.error === ShareFileError.USER_NOT_FOUND) {
        setError(`User with email ${email} not found`);
      } else {
        setError(result.message);
      }
    } catch (err) {
      console.error("Error sharing file:", err);
      setError("An unexpected error occurred");
    } finally {
      setIsSharing(false);
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

  const getPermissionIcon = (permission: string) => {
    switch (permission) {
      case 'view':
        return <Eye className="h-4 w-4 text-blue-500" />;
      case 'edit':
        return <Edit className="h-4 w-4 text-green-500" />;
      case 'admin':
        return <Star className="h-4 w-4 text-amber-500" />;
      default:
        return <Eye className="h-4 w-4 text-blue-500" />;
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
        
        <div className="flex items-end gap-2">
          <div className="grid flex-1 gap-2">
            <Label htmlFor="email" className="sr-only">
              Email
            </Label>
            <Input
              id="email"
              placeholder="Enter user's email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSharing}
            />
          </div>
          <Select
            value={permissions}
            onValueChange={(value) => setPermissions(value as 'view' | 'edit' | 'admin')}
            disabled={isSharing}
          >
            <SelectTrigger className="w-[110px]">
              <SelectValue placeholder="Permissions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="view">View</SelectItem>
              <SelectItem value="edit">Edit</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
          <Button type="submit" disabled={isSharing} onClick={handleShare}>
            {isSharing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sharing...
              </>
            ) : "Share"}
          </Button>
        </div>
        
        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2">People with access</h4>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="ml-2 text-sm">Loading...</span>
            </div>
          ) : recipients.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {recipients.map((recipient) => (
                <div 
                  key={recipient.id} 
                  className="flex items-center justify-between bg-secondary/50 p-2 rounded-md"
                >
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{recipient.email}</span>
                    <Badge 
                      variant="outline" 
                      className="flex items-center gap-1 text-xs"
                    >
                      {getPermissionIcon(recipient.permissions)}
                      {recipient.permissions}
                    </Badge>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleRemoveAccess(recipient.id)}
                    disabled={isRemoving === recipient.id}
                    title="Remove access"
                  >
                    {isRemoving === recipient.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-3 text-muted-foreground text-sm bg-secondary/20 rounded-md">
              No shared access yet
            </div>
          )}
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
