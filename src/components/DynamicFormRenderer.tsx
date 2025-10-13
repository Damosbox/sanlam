import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, Loader2, CheckCircle } from "lucide-react";
import { DynamicFormField } from "@/components/forms/DynamicFormField";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User } from "@supabase/supabase-js";

interface FormStep {
  title: string;
  description?: string;
  fields: any[];
}

interface FormTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  product_type: string;
  steps: FormStep[];
  premium_calculation?: any;
}

interface DynamicFormRendererProps {
  templateId: string;
  onSubmit?: (data: any) => void;
  onCancel?: () => void;
  user: User | null;
  channel: 'B2C' | 'B2B';
  clientId?: string; // For B2B, broker can fill for a client
}

export const DynamicFormRenderer = ({ 
  templateId, 
  onSubmit, 
  onCancel,
  user,
  channel,
  clientId 
}: DynamicFormRendererProps) => {
  const [template, setTemplate] = useState<FormTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const { data, error } = await supabase
          .from('form_templates')
          .select('*')
          .eq('id', templateId)
          .single();

        if (error) throw error;
        setTemplate(data as unknown as FormTemplate);
      } catch (error) {
        console.error('Error fetching template:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger le formulaire",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTemplate();
  }, [templateId, toast]);

  const validateStep = (stepIndex: number): boolean => {
    if (!template) return false;

    const step = template.steps[stepIndex];
    const newErrors: Record<string, string> = {};

    step.fields.forEach((field: any) => {
      const value = formData[field.id];

      // Required validation
      if (field.required && (!value || (Array.isArray(value) && value.length === 0))) {
        newErrors[field.id] = `${field.label} est requis`;
      }

      // Email validation
      if (field.type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          newErrors[field.id] = 'Email invalide';
        }
      }

      // Tel validation
      if (field.type === 'tel' && value) {
        const telRegex = /^[+]?[\d\s-()]+$/;
        if (!telRegex.test(value)) {
          newErrors[field.id] = 'Numéro de téléphone invalide';
        }
      }

      // Number validation
      if (field.type === 'number' && value) {
        const num = parseFloat(value);
        if (field.validation?.min !== undefined && num < field.validation.min) {
          newErrors[field.id] = `Minimum: ${field.validation.min}`;
        }
        if (field.validation?.max !== undefined && num > field.validation.max) {
          newErrors[field.id] = `Maximum: ${field.validation.max}`;
        }
      }

      // Text length validation
      if ((field.type === 'text' || field.type === 'textarea') && value) {
        if (field.validation?.minLength && value.length < field.validation.minLength) {
          newErrors[field.id] = `Minimum ${field.validation.minLength} caractères`;
        }
        if (field.validation?.maxLength && value.length > field.validation.maxLength) {
          newErrors[field.id] = `Maximum ${field.validation.maxLength} caractères`;
        }
      }

      // Pattern validation
      if (field.validation?.pattern && value) {
        const regex = new RegExp(field.validation.pattern);
        if (!regex.test(value)) {
          newErrors[field.id] = 'Format invalide';
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!template) return;

    if (validateStep(currentStep)) {
      if (currentStep < template.steps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setErrors({});
    }
  };

  const calculatePremium = (): number => {
    // Simple premium calculation logic
    // You can extend this based on template.premium_calculation config
    let basePremium = 10000; // Default base premium
    
    // Add logic based on form data
    Object.entries(formData).forEach(([key, value]) => {
      // Example: add premium based on certain field values
      if (typeof value === 'number') {
        basePremium += value * 0.01;
      }
    });

    return Math.round(basePremium);
  };

  const handleSubmit = async () => {
    if (!user || !template) return;

    setSubmitting(true);
    try {
      // Generate policy number
      const policyNumber = `POL-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      // Calculate premium
      const monthlyPremium = calculatePremium();

      // Create subscription
      const subscriptionData = {
        user_id: clientId || user.id, // Use clientId if broker is filling for client
        policy_number: policyNumber,
        monthly_premium: monthlyPremium,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
        status: 'active',
        selected_coverages: formData,
        product_id: null, // Will be linked to product if needed
      };

      const { data, error } = await supabase
        .from('subscriptions')
        .insert([subscriptionData])
        .select()
        .single();

      if (error) throw error;

      setSuccess(true);
      toast({
        title: "Souscription réussie !",
        description: `Votre police ${policyNumber} a été créée avec succès.`,
      });

      if (onSubmit) {
        onSubmit(data);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la souscription",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Card>
    );
  }

  if (!template) {
    return (
      <Card className="p-8">
        <p className="text-center text-muted-foreground">Formulaire introuvable</p>
      </Card>
    );
  }

  if (success) {
    return (
      <Card className="p-8">
        <div className="text-center space-y-4">
          <CheckCircle className="w-16 h-16 text-bright-green mx-auto" />
          <h3 className="text-2xl font-bold">Souscription réussie !</h3>
          <p className="text-muted-foreground">
            Votre demande a été enregistrée avec succès.
          </p>
          {onCancel && (
            <Button onClick={onCancel}>Retour</Button>
          )}
        </div>
      </Card>
    );
  }

  const currentStepData = template.steps[currentStep];
  const progress = ((currentStep + 1) / template.steps.length) * 100;

  return (
    <Card className="p-8">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold">{template.name}</h2>
          {template.description && (
            <p className="text-muted-foreground mt-2">{template.description}</p>
          )}
        </div>

        {/* Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              Étape {currentStep + 1} sur {template.steps.length}
            </span>
            <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} />
        </div>

        {/* Step Content */}
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold">{currentStepData.title}</h3>
            {currentStepData.description && (
              <p className="text-muted-foreground mt-1">{currentStepData.description}</p>
            )}
          </div>

          {/* Fields */}
          <div className="space-y-4">
            {currentStepData.fields.map((field: any) => (
              <DynamicFormField
                key={field.id}
                field={field}
                value={formData[field.id]}
                onChange={(value) => {
                  setFormData({ ...formData, [field.id]: value });
                  // Clear error when user starts typing
                  if (errors[field.id]) {
                    setErrors({ ...errors, [field.id]: '' });
                  }
                }}
                error={errors[field.id]}
              />
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-6 border-t">
          <div>
            {currentStep > 0 && (
              <Button variant="outline" onClick={handleBack}>
                <ChevronLeft className="w-4 h-4 mr-2" />
                Précédent
              </Button>
            )}
            {onCancel && currentStep === 0 && (
              <Button variant="outline" onClick={onCancel}>
                Annuler
              </Button>
            )}
          </div>

          <Button onClick={handleNext} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Traitement...
              </>
            ) : currentStep === template.steps.length - 1 ? (
              'Soumettre'
            ) : (
              <>
                Suivant
                <ChevronRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
};
