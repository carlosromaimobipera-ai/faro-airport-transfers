import React, { useState } from 'react';
import { Pencil, Check, X } from 'lucide-react';

export default function AdminNotesCell({ booking, onSave }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(booking.admin_notes || '');

  const handleSave = () => {
    onSave(booking.id, value);
    setEditing(false);
  };

  const handleCancel = () => {
    setValue(booking.admin_notes || '');
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1 min-w-[160px]">
        <input
          autoFocus
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') handleCancel(); }}
          className="flex-1 text-xs border border-input rounded px-2 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-ring h-7"
          placeholder="Nota interna..."
        />
        <button onClick={handleSave} className="text-green-600 hover:text-green-700 p-1"><Check className="w-3.5 h-3.5" /></button>
        <button onClick={handleCancel} className="text-muted-foreground hover:text-foreground p-1"><X className="w-3.5 h-3.5" /></button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground group max-w-[160px] text-left"
    >
      <Pencil className="w-3 h-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
      <span className={`truncate ${value ? 'text-foreground' : 'italic text-muted-foreground/60'}`}>
        {value || 'Adicionar nota...'}
      </span>
    </button>
  );
}