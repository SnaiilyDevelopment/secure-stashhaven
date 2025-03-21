
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
import { Trash2, Mail, Shield, Eye, Edit, Star } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { shareFileWithUser, getFileRecipients, removeFileAccess } from '@/lib/filesharing';

interface ShareFileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filePath: string;
  fileName: string;
}

interface Recipient {
  id: string;
  email: string;
  permissions: 'view' | 'edit' | 'admin';
  shared_at: string;
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
  const [recipients, setRecipients] = useState<Recipient[]>([]);

  useEffect(() => {
    if (open && filePath) {
      fetchRecipients();
    }
  }, [open, filePath]);

  const fetchRecipients = async () => {
    if (!filePath) return;
    
    const fetchedRecipients = await getFileRecipients(filePath);
    setRecipients(fetchedRecipients);
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

    setIsLoading(true);
    
    try {
      const success = await shareFileWithUser(filePath, email, permissions);
      
      if (success) {
        setEmail('');
        fetchRecipients();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveAccess = async (shareId: string) => {
    const success = await removeFileAccess(shareId);
    if (success) {
      fetchRecipients();
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
            />
          </div>
          <Select
            value={permissions}
            onValueChange={(value) => setPermissions(value as 'view' | 'edit' | 'admin')}
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
          <Button type="submit" disabled={isLoading} onClick={handleShare}>
            Share
          </Button>
        </div>
        
        {recipients.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">People with access</h4>
            <div className="space-y-2">
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
                    title="Remove access"
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
        
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
