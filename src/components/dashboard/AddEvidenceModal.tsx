import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, FilePlus2, Loader2, UploadCloud } from 'lucide-react';
import { useState, useRef, ChangeEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../context/ToastContext';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { uploadEvidenceFile, UploadResult } from '../../utils/evidenceUpload';

const EVIDENCE_TYPES = [
  'Drone Imagery',
  'Water Sample',
  'eDNA Analysis',
  'Chemical Analysis',
  'GIS Layer',
  'Historical Dataset',
  'Sensor Telemetry',
];

export function AddEvidenceModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState(EVIDENCE_TYPES[0]);
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadData, setUploadData] = useState<UploadResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { push } = useToast();
  const queryClient = useQueryClient();

  const reset = () => {
    setUploading(false);
    setUploaded(false);
    setSelectedFile(null);
    setUploadData(null);
    setTitle('');
    setDescription('');
    setType(EVIDENCE_TYPES[0]);
  };

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setUploading(true);
    setUploaded(false);

    try {
      const result = await uploadEvidenceFile(file);
      setUploadData(result);
      setUploaded(true);
      push(`File ${file.name} hashed and uploaded successfully.`);
    } catch (error: any) {
      push(error.message || 'Failed to upload evidence file.');
      setSelectedFile(null);
    } finally {
      setUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async () => {
    const evidenceTitle = title.trim() || (selectedFile ? selectedFile.name : `${type} Evidence`);

    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('http://localhost:5000/api/evidence', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: evidenceTitle,
          kind: type,
          description: description,
          file_url: uploadData?.fileUrl || null,
          file_hash: uploadData?.fileHash || null,
          file_size: uploadData?.fileSize || null,
          mime_type: uploadData?.mimeType || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create evidence record in database.');
      }

      push(`${type} registered successfully with cryptographic hash.`);
      queryClient.invalidateQueries({ queryKey: ['evidence'] });
      reset();
      onClose();
    } catch (error: any) {
      push(error.message || 'Error saving evidence record.');
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Evidence" subtitle="Register new evidence for incident EFIF-0017" icon="file-stack" accent="border-violet-400/25 bg-violet-400/10 text-violet-300">
      <div className="space-y-4">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
        />

        <div>
          <label htmlFor="ev-title" className="mb-1.5 block text-[12px] font-semibold text-slate-300">
            Evidence Title
          </label>
          <input
            id="ev-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Water Sample Alpha - Collection Point 4"
            className="glass-input w-full rounded-xl px-3.5 py-2.5 text-[13px] text-slate-100 outline-none placeholder:text-slate-500"
          />
        </div>

        <div>
          <label htmlFor="ev-type" className="mb-1.5 block text-[12px] font-semibold text-slate-300">
            Evidence Type
          </label>
          <select
            id="ev-type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="glass-input w-full rounded-xl px-3.5 py-2.5 text-[13px] text-slate-100 outline-none [&>option]:bg-night-900"
          >
            {EVIDENCE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="ev-desc" className="mb-1.5 block text-[12px] font-semibold text-slate-300">
            Description
          </label>
          <textarea
            id="ev-desc"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the evidence, collection point and any field observations…"
            className="glass-input w-full resize-none rounded-xl px-3.5 py-2.5 text-[13px] text-slate-100 outline-none placeholder:text-slate-500"
          />
        </div>

        <div>
          <p className="mb-1.5 block text-[12px] font-semibold text-slate-300">Upload</p>
          <button
            type="button"
            onClick={triggerFileInput}
            disabled={uploading}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-white/12 bg-night-900/30 px-4 py-7 text-center transition-colors hover:border-emerald-400/40 hover:bg-emerald-400/[0.04]"
          >
            {uploading ? (
              <>
                <Loader2 className="h-6 w-6 animate-spin text-emerald-300" />
                <span className="text-[12.5px] font-medium text-slate-300">
                  Hashing & Uploading {selectedFile?.name}…
                </span>
              </>
            ) : uploaded ? (
              <>
                <CheckCircle2 className="h-6 w-6 text-emerald-300" />
                <span className="text-[12.5px] font-medium text-emerald-200">
                  {selectedFile?.name} · Verified & Stored
                </span>
                <span className="text-[10px] text-emerald-400/80 font-mono">
                  SHA-256: {uploadData?.fileHash.substring(0, 16)}...
                </span>
              </>
            ) : (
              <>
                <UploadCloud className="h-6 w-6 text-slate-400" />
                <span className="text-[12.5px] font-medium text-slate-300">Drop files here or click to select</span>
                <span className="text-[10.5px] text-slate-500">Files are hashed client-side with SHA-256 before upload</span>
              </>
            )}
          </button>
          {uploaded && (
            <div className="mt-2 flex items-center gap-2 rounded-lg border border-white/[0.07] bg-night-900/40 px-3 py-2">
              <FilePlus2 className="h-3.5 w-3.5 text-emerald-300" />
              <span className="text-[11.5px] text-slate-400">Registered to evidence queue · awaiting chain-of-custody log</span>
            </div>
          )}
        </div>

        <div className="flex gap-2.5 pt-1">
          <Button variant="violet" className="flex-1" disabled={uploading} onClick={handleSubmit}>
            Save Evidence
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </div>

        <AnimatePresence>
          {!description.trim() && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-[10.5px] text-slate-500"
            >
              A description strengthens the chain of custody record.
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </Modal>
  );
}