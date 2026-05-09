import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronDown } from 'lucide-react';

export default function MobileSelectDrawer({ value, options, onSelect, trigger, disabled = false }) {
  const [open, setOpen] = useState(false);
  const selectedOption = options.find(o => o.value === value);

  if (typeof window === 'undefined' || window.innerWidth >= 768) {
    // Desktop: render trigger button only (parent handles Select)
    return trigger;
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        disabled={disabled}
        className="w-full justify-between h-9 text-xs"
      >
        <span className="truncate">{selectedOption?.label || 'Selecionar'}</span>
        <ChevronDown className="w-4 h-4 ml-2 shrink-0" />
      </Button>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="h-[70vh] flex flex-col">
          <DrawerHeader className="border-b">
            <DrawerTitle className="text-base">{trigger?.props?.label || 'Opções'}</DrawerTitle>
          </DrawerHeader>
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-2">
              {options.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => {
                    onSelect(opt.value);
                    setOpen(false);
                  }}
                  disabled={opt.disabled}
                  className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-colors ${
                    value === opt.value
                      ? 'bg-primary text-primary-foreground font-medium'
                      : opt.disabled
                      ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                      : 'bg-card border border-border hover:bg-muted'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </ScrollArea>
        </DrawerContent>
      </Drawer>
    </>
  );
}