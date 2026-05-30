"use client";

import { useCallback, useState } from "react";
import { Upload, X, FileText } from "lucide-react";

interface FileDropzoneProps {
  accept?: string;
  multiple?: boolean;
  label: string;
  hint?: string;
  files: File[];
  onFilesChange: (files: File[]) => void;
}

export default function FileDropzone({
  accept = ".pdf,.doc,.docx",
  multiple = true,
  label,
  hint,
  files,
  onFilesChange,
}: FileDropzoneProps) {
  const [dragOver, setDragOver] = useState(false);

  const addFiles = useCallback(
    (incoming: FileList | File[]) => {
      const list = Array.from(incoming);
      if (multiple) {
        onFilesChange([...files, ...list]);
      } else {
        onFilesChange(list.slice(0, 1));
      }
    },
    [files, multiple, onFilesChange]
  );

  const removeFile = (index: number) => {
    onFilesChange(files.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <label
        className={`block border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          dragOver
            ? "border-[var(--primary)] bg-[var(--primary)]/10"
            : "border-[var(--card-border)] hover:border-[var(--primary)]/50 bg-[var(--card)]"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
        }}
      >
        <input
          type="file"
          className="hidden"
          accept={accept}
          multiple={multiple}
          onChange={(e) => {
            if (e.target.files?.length) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <Upload className="w-10 h-10 mx-auto mb-3 text-[var(--primary)]" />
        <p className="font-medium text-[var(--foreground)]">{label}</p>
        {hint && <p className="text-sm text-[var(--muted)] mt-1">{hint}</p>}
      </label>

      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((file, i) => (
            <li
              key={`${file.name}-${i}`}
              className="flex items-center justify-between gap-3 p-3 rounded-lg bg-[var(--card)] border border-[var(--card-border)]"
            >
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="w-5 h-5 shrink-0 text-[var(--primary)]" />
                <span className="truncate text-sm">{file.name}</span>
                <span className="text-xs text-[var(--muted)] shrink-0">
                  {(file.size / 1024).toFixed(1)} KB
                </span>
              </div>
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="p-1 rounded hover:bg-[var(--danger)]/20 text-[var(--muted)] hover:text-[var(--danger)]"
              >
                <X className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
