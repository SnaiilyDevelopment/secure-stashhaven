
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mail, Eye, Edit, Star, Loader2, Trash2 } from 'lucide-react';
import { FileRecipient } from '@/lib/filesharing/types';

interface RecipientListProps {
  recipients: FileRecipient[];
  isLoading: boolean;
  isRemoving: string | null;
  onRemoveAccess: (shareId: string) => void;
}

const RecipientList: React.FC<RecipientListProps> = ({
  recipients,
  isLoading,
  isRemoving,
  onRemoveAccess
}) => {
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span className="ml-2 text-sm">Loading...</span>
      </div>
    );
  }

  if (recipients.length === 0) {
    return (
      <div className="text-center py-3 text-muted-foreground text-sm bg-secondary/20 rounded-md">
        No shared access yet
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-48 overflow-y-auto">
      {recipients.map((recipient) => (
        <div 
          key={recipient.share_id} 
          className="flex items-center justify-between bg-secondary/50 p-2 rounded-md"
        >
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{recipient.recipient_email}</span>
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
            onClick={() => onRemoveAccess(recipient.share_id)}
            disabled={isRemoving === recipient.share_id}
            title="Remove access"
          >
            {isRemoving === recipient.share_id ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
            )}
          </Button>
        </div>
      ))}
    </div>
  );
};

export default RecipientList;
