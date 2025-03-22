
import React from 'react';
import { 
  PageHeader, 
  PageHeaderDescription, 
  PageHeaderHeading 
} from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface DashboardHeaderProps {
  onUploadClick: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ onUploadClick }) => {
  return (
    <PageHeader className="pb-8">
      <div className="flex items-center justify-between">
        <PageHeaderHeading>My Secure Files</PageHeaderHeading>
        <Button onClick={onUploadClick} className="flex gap-1 items-center">
          <Plus className="h-4 w-4" />
          Upload
        </Button>
      </div>
      <PageHeaderDescription>
        Upload, manage, and securely share your encrypted files.
      </PageHeaderDescription>
    </PageHeader>
  );
};

export default DashboardHeader;
