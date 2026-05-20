import { Plus, Pencil, Trash2 } from 'lucide-react';

type CrudAction = 'create' | 'update' | 'delete';

interface TableCrudToolbarProps {
  label?: string;
  onAction?: (action: CrudAction) => void;
  className?: string;
}

export function TableCrudToolbar({ label = 'Table Actions', onAction, className = '' }: TableCrudToolbarProps) {
  const handle = (action: CrudAction) => {
    if (onAction) onAction(action);
  };

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 mb-3 ${className}`}>
      <span className="text-[11px] text-[#6B7280] uppercase tracking-wide">{label}</span>
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => handle('create')} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs border border-[#D9D9D9] bg-[#002D5E] text-white hover:bg-[#001F42] transition-colors" type="button">
          <Plus className="w-3.5 h-3.5" /> Create
        </button>
        <button onClick={() => handle('update')} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs border border-[#D9D9D9] bg-white text-[#333333] hover:bg-[#F5F6F8] transition-colors" type="button">
          <Pencil className="w-3.5 h-3.5" /> Update
        </button>
        <button onClick={() => handle('delete')} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs border border-[#D9D9D9] bg-white text-[#9B2226] hover:bg-[#FDF2F2] transition-colors" type="button">
          <Trash2 className="w-3.5 h-3.5" /> Delete
        </button>
      </div>
    </div>
  );
}
