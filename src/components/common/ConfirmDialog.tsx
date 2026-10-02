"use client";

import Modal from "./Modal";

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  danger = true,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal open={open} onClose={onCancel} title={title} widthClassName="max-w-sm">
      <p className="text-sm text-slate-600">{message}</p>
      <div className="mt-6 flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className={`rounded-md px-3 py-1.5 text-sm font-medium text-white ${
            danger ? "bg-red-600 hover:bg-red-700" : "bg-slate-900 hover:bg-slate-800"
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
