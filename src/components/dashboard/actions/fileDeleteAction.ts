
import { deleteFile } from '@/lib/storage';

export const handleFileDelete = async (
  filePath: string,
  fileName: string,
  onSuccess?: () => void
): Promise<boolean> => {
  if (confirm(`Are you sure you want to delete ${fileName}?`)) {
    const success = await deleteFile(filePath);
    if (success && onSuccess) {
      onSuccess();
    }
    return success;
  }
  return false;
};
