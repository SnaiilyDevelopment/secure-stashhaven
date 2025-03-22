
import React, { useState } from 'react';
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
import { Loader2 } from 'lucide-react';
import { shareFileWithUser } from '@/lib/filesharing';

interface ShareFormProps {
  filePath: string;
  onShareComplete: () => void;
  setError: (error: string | null) => void;
}

const ShareForm: React.FC<ShareFormProps> = ({ 
  filePath, 
  onShareComplete, 
  setError 
}) => {
  const [email, setEmail] = useState('');
  const [permissions, setPermissions] = useState<'view' | 'edit' | 'admin'>('view');
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    if (!email) {
      setError("Please enter an email address.");
      return;
    }

    setIsSharing(true);
    setError(null);
    
    try {
      const result = await shareFileWithUser(filePath, email, permissions);
      
      if (result.success) {
        setEmail('');
        onShareComplete();
      } else {
        setError(result.message || "An error occurred while sharing the file");
      }
    } catch (err) {
      console.error("Error sharing file:", err);
      setError("An unexpected error occurred");
    } finally {
      setIsSharing(false);
    }
  };

  return (
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
      <Button type="button" disabled={isSharing} onClick={handleShare}>
        {isSharing ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Sharing...
          </>
        ) : "Share"}
      </Button>
    </div>
  );
};

export default ShareForm;
