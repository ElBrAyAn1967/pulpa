'use client';

import { FRUIT_OPTIONS, type FruitEmoji } from '@/lib/types/ambassador';

interface FruitSelectorProps {
  selected: FruitEmoji | null;
  onSelect: (fruit: FruitEmoji) => void;
}

export default function FruitSelector({ selected, onSelect }: FruitSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-foreground">
        Tu fruta favorita 🍎
        <span className="text-destructive ml-1">*</span>
      </label>

      <div className="grid grid-cols-6 gap-2">
        {FRUIT_OPTIONS.map((fruit) => (
          <button
            key={fruit}
            type="button"
            onClick={() => onSelect(fruit)}
            className={`
              aspect-square rounded-lg text-4xl
              flex items-center justify-center
              transition-all duration-200
              ${
                selected === fruit
                  ? 'bg-primary scale-110 shadow-lg'
                  : 'bg-card hover:bg-card-hover hover:scale-105'
              }
            `}
            aria-label={`Seleccionar ${fruit}`}
            aria-pressed={selected === fruit}
          >
            {fruit}
          </button>
        ))}
      </div>

      {selected && (
        <p className="text-sm text-muted-foreground text-center">
          Seleccionaste: <span className="text-2xl">{selected}</span>
        </p>
      )}
    </div>
  );
}
