import { useState, useCallback } from 'react';
import { Logger } from '../core/logger/LoggerService';
import { analytics } from '../services/AnalyticsService';

/**
 * Hook to interface with the native File System Access API on Desktop / Chromium browsers
 * with transparent fallback to traditional Blob and File input operations.
 */
export function useFileSystem() {
  const [fileHandle, setFileHandle] = useState(null);
  const [fileName, setFileName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const isSupported = typeof window !== 'undefined' && 'showOpenFilePicker' in window;

  const openExcelFile = useCallback(async (fileInputFallbackRef) => {
    setIsProcessing(true);
    setError(null);

    if (isSupported) {
      try {
        const [handle] = await window.showOpenFilePicker({
          types: [
            {
              description: 'Classeurs Excel GMAO (*.xlsx, *.xls)',
              accept: {
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
                'application/vnd.ms-excel': ['.xls'],
                'application/json': ['.json'],
              },
            },
          ],
          multiple: false,
        });

        const file = await handle.getFile();
        setFileHandle(handle);
        setFileName(file.name);
        setIsProcessing(false);
        analytics.track('file_opened_native', 'excel', { fileName: file.name });
        return { file, handle };
      } catch (err) {
        setIsProcessing(false);
        if (err.name !== 'AbortError') {
          Logger.error('Failed to open file via Native File System:', err, 'useFileSystem');
          setError(err);
        }
        return null;
      }
    } else {
      setIsProcessing(false);
      // Fallback: trigger file input click
      if (fileInputFallbackRef?.current) {
        fileInputFallbackRef.current.click();
      }
      return null;
    }
  }, [isSupported]);

  const saveExcelFile = useCallback(
    async (fileBuffer, defaultName = 'GMAO_Export.xlsx') => {
      setIsProcessing(true);
      setError(null);

      if (isSupported) {
        try {
          const handle = await window.showSaveFilePicker({
            suggestedName: defaultName,
            types: [
              {
                description: 'Classeur Excel (*.xlsx)',
                accept: {
                  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
                },
              },
            ],
          });

          const writable = await handle.createWritable();
          await writable.write(fileBuffer);
          await writable.close();

          setFileHandle(handle);
          setFileName(defaultName);
          setIsProcessing(false);
          analytics.track('file_saved_native', 'excel', { fileName: defaultName });
          return handle;
        } catch (err) {
          setIsProcessing(false);
          if (err.name !== 'AbortError') {
            Logger.error('Failed to save file via Native File System:', err, 'useFileSystem');
            setError(err);
          }
          return null;
        }
      } else {
        // Fallback: standard blob download
        try {
          const blob =
            fileBuffer instanceof Blob
              ? fileBuffer
              : new Blob([fileBuffer], {
                  type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = defaultName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          setIsProcessing(false);
          return true;
        } catch (err) {
          setIsProcessing(false);
          Logger.error('Fallback save failed:', err, 'useFileSystem');
          setError(err);
          return null;
        }
      }
    },
    [isSupported]
  );

  return {
    isSupported,
    fileHandle,
    fileName,
    isProcessing,
    error,
    openExcelFile,
    saveExcelFile,
  };
}
