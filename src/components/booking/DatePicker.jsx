import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { t } from '@/lib/i18n';

const MONTH_NAMES = {
  pt: ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'],
  en: ['January','February','March','April','May','June','July','August','September','October','November','December'],
  es: ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'],
  fr: ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'],
  de: ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'],
  nl: ['Januari','Februari','Maart','April','Mei','Juni','Juli','Augustus','September','Oktober','November','December'],
};

const DAY_NAMES = {
  pt: ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'],
  en: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],
  es: ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'],
  fr: ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'],
  de: ['So','Mo','Di','Mi','Do','Fr','Sa'],
  nl: ['Zo','Ma','Di','Wo','Do','Vr','Za'],
};

export default function DatePicker({ value, onChange, min, lang = 'en', label }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const minDate = min ? new Date(min + 'T00:00:00') : today;

  const parseValue = (v) => {
    if (!v) return null;
    const [y, m, d] = v.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  const selected = parseValue(value);

  const [viewYear, setViewYear] = useState(() => selected?.getFullYear() || minDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(() => selected?.getMonth() ?? minDate.getMonth());

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const monthNames = MONTH_NAMES[lang] || MONTH_NAMES.en;
  const dayNames = DAY_NAMES[lang] || DAY_NAMES.en;

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const selectDay = (day) => {
    const d = new Date(viewYear, viewMonth, day);
    if (d < minDate) return;
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    onChange(`${yyyy}-${mm}-${dd}`);
    setOpen(false);
  };

  const formatDisplay = (v) => {
    if (!v) return '';
    const d = parseValue(v);
    if (!d) return v;
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
  };

  const isDisabled = (day) => {
    const d = new Date(viewYear, viewMonth, day);
    return d < minDate;
  };

  const isSelected = (day) => {
    if (!selected) return false;
    return selected.getFullYear() === viewYear && selected.getMonth() === viewMonth && selected.getDate() === day;
  };

  const isToday = (day) => {
    const now = new Date();
    return now.getFullYear() === viewYear && now.getMonth() === viewMonth && now.getDate() === day;
  };

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full h-12 px-3 flex items-center gap-2 rounded-md border border-input bg-background text-sm hover:bg-muted/50 transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
        <span className={value ? 'text-foreground' : 'text-muted-foreground'}>
          {value ? formatDisplay(value) : (label || 'DD/MM/YYYY')}
        </span>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-card border border-border rounded-xl shadow-xl p-4 w-72">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <button type="button" onClick={prevMonth} className="p-1 rounded hover:bg-muted transition-colors min-h-0 min-w-0">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-sm">
              {monthNames[viewMonth]} {viewYear}
            </span>
            <button type="button" onClick={nextMonth} className="p-1 rounded hover:bg-muted transition-colors min-h-0 min-w-0">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {dayNames.map(d => (
              <div key={d} className="text-center text-xs text-muted-foreground font-medium py-1">{d}</div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((day, i) => (
              <div key={i}>
                {day ? (
                  <button
                    type="button"
                    onClick={() => selectDay(day)}
                    disabled={isDisabled(day)}
                    className={`w-full aspect-square flex items-center justify-center text-sm rounded-lg transition-colors min-h-0 min-w-0
                      ${isSelected(day) ? 'bg-primary text-primary-foreground font-bold' : ''}
                      ${!isSelected(day) && isToday(day) ? 'border border-primary text-primary font-semibold' : ''}
                      ${isDisabled(day) ? 'text-muted-foreground/40 cursor-not-allowed' : (!isSelected(day) ? 'hover:bg-muted cursor-pointer' : '')}
                    `}
                  >
                    {day}
                  </button>
                ) : <div />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}