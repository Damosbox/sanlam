import { Slider } from "@/components/ui/slider";

interface SavingsSliderProps {
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
  label: string;
  subtitle?: string;
  helperText: string;
}

export const SavingsSlider = ({
  min,
  max,
  value,
  onChange,
  label,
  subtitle,
  helperText
}: SavingsSliderProps) => {
  return (
    <div className="space-y-4 p-6 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 transition-smooth">
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">{label}</label>
        <div className="text-4xl md:text-5xl font-bold text-foreground animate-fade-in">
          {value.toLocaleString('fr-FR')}
        </div>
        {subtitle && (
          <p className="text-sm text-muted-foreground italic animate-fade-in">
            {subtitle}
          </p>
        )}
      </div>
      
      <Slider
        min={min}
        max={max}
        step={1000}
        value={[value]}
        onValueChange={(values) => onChange(values[0])}
        className="my-6"
      />
      
      <p className="text-sm text-muted-foreground leading-relaxed">
        {helperText}
      </p>
    </div>
  );
};
