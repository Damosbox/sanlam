import { Slider } from "@/components/ui/slider";

interface EducationSliderProps {
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
  label: string;
  subtitle?: string;
  helperText: string;
  unit?: string;
}

export const EducationSlider = ({
  min,
  max,
  value,
  onChange,
  label,
  subtitle,
  helperText,
  unit
}: EducationSliderProps) => {
  return (
    <div className="space-y-4 p-6 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 transition-smooth">
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">{label}</label>
        <div className="text-4xl md:text-5xl font-bold text-foreground animate-fade-in">
          {value.toLocaleString('fr-FR')}{unit && ` ${unit}`}
        </div>
        {subtitle && (
          <p className="text-sm text-muted-foreground italic animate-fade-in">
            {subtitle}
          </p>
        )}
      </div>
      
      <Slider
        value={[value]}
        onValueChange={(values) => onChange(values[0])}
        min={min}
        max={max}
        step={unit === "ans" ? 1 : 1000}
        className="py-4"
      />
      
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{min.toLocaleString('fr-FR')}{unit && ` ${unit}`}</span>
        <span>{max.toLocaleString('fr-FR')}{unit && ` ${unit}`}</span>
      </div>
      
      <p className="text-sm text-muted-foreground leading-relaxed mt-4">
        {helperText}
      </p>
    </div>
  );
};
