import React, { useState } from 'react';

import { useUserContext } from '@/context/UserContext';
import { generateIdFromLabel } from '@/lib/utils';

import { UploadDialog } from './UploadDialog';

interface UploadButtonProps {
  userId: string | null;
  pipelineId: string;
  uploadedDocuments: any[];
  onUploadSuccess?: () => void;
  setUploadedDocuments: (docs: any[]) => void;
  showToast?: (message: {
    title: string;
    description: string;
    variant: 'default' | 'destructive' | 'success';
  }) => void;
}

export const UploadButton: React.FC<UploadButtonProps> = ({
  userId,
  pipelineId,
  uploadedDocuments,
  setUploadedDocuments,
  onUploadSuccess,
  showToast = () => {},
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { getClient } = useUserContext();

  const handleDocumentUpload = async (files: File[]) => {
    setIsUploading(true);
    const client = await getClient(pipelineId);
    if (!client) {
      throw new Error('Failed to get authenticated client');
    }

    try {
      const uploadedFiles: any[] = [];
      const metadatas: Record<string, any>[] = [];
      const userIds: (string | null)[] = [];

      for (const file of files) {
        const fileId = generateIdFromLabel(file.name);
        uploadedFiles.push({ document_id: fileId, title: file.name });
        metadatas.push({ title: file.name });
        userIds.push(userId);
      }

      await client.ingestFiles(files, {
        metadatas: metadatas,
        user_ids: userIds,
      });

      setUploadedDocuments([...uploadedDocuments, ...uploadedFiles]);
      showToast({
        variant: 'success',
        title: 'Upload Successful',
        description: 'The documents have been uploaded',
      });
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (error: any) {
      console.error('Error uploading files:', error);
      showToast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: error.message,
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsDialogOpen(true)}
        disabled={isUploading}
        className={`pl-2 pr-2 text-white py-2 px-4 rounded-full ${
          isUploading
            ? 'bg-blue-400 cursor-not-allowed'
            : 'bg-blue-500 hover:bg-blue-600'
        }`}
      >
        {isUploading ? 'Uploading...' : 'Upload File(s)'}
      </button>
      <UploadDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onUpload={handleDocumentUpload}
      />
    </>
  );
};
