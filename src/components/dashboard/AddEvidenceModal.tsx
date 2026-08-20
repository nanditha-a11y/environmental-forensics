import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, FilePlus2, Loader2, UploadCloud } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

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
  const [type, setType] = useState(EVIDENCE_TYPES[0]);
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const fileName = 'efif_evidence_upload.sim';
  const { push } = useToast();

  const reset = () => {
    setUploading(false);
    setUploaded(false);
    setDescription('');
    setType(EVIDENCE_TYPES[0]);
  };

  const simulateUpload = () => {
    if (uploaded) return;
    setUploading(true);
    window.setTimeout(() => {
      setUploading(false);
      setUploaded(true);
    }, 1400);
  };

  const handleSubmit = () => {
    push(`${type} added to case EFIF-0017 (simulated).`);
    reset();
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Evidence" subtitle="Register new evidence for incident EFIF-0017" icon="file-stack" accent="border-violet-400/25 bg-violet-400/10 text-violet-300">
      <div className="space-y-4">
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
            onClick={simulateUpload}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-white/12 bg-night-900/30 px-4 py-7 text-center transition-colors hover:border-emerald-400/40 hover:bg-emerald-400/[0.04]"
          >
            {uploading ? (
              <>
                <Loader2 className="h-6 w-6 animate-spin text-emerald-300" />
                <span className="text-[12.5px] font-medium text-slate-300">Uploading {fileName}…</span>
              </>
            ) : uploaded ? (
              <>
                <CheckCircle2 className="h-6 w-6 text-emerald-300" />
                <span className="text-[12.5px] font-medium text-emerald-200">{fileName} · uploaded (simulated)</span>
              </>
            ) : (
              <>
                <UploadCloud className="h-6 w-6 text-slate-400" />
                <span className="text-[12.5px] font-medium text-slate-300">Drop files here or click to select</span>
                <span className="text-[10.5px] text-slate-500">Prototype upload — no data leaves this device</span>
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
