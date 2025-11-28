import { Check } from 'lucide-react';

type Step = 1 | 2 | 3;

interface StepIndicatorProps {
  currentStep: Step;
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  const steps = [
    {
      number: 1,
      title: 'Informations obligatoires',
      description: 'Champs du template'
    },
    {
      number: 2,
      title: 'Informations supplémentaires',
      description: 'Ajoutez des champs personnalisés'
    },
    {
      number: 3,
      title: 'Configuration des stocks',
      description: 'Gérez vos stocks et variants'
    }
  ];

  return (
    <div className="mb-8 flex flex-row gap-4">
      {steps.map((step, index) => (
        <div key={step.number}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className={`flex items-center ${currentStep >= step.number ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                  currentStep > step.number 
                    ? 'bg-primary border-primary text-primary-foreground' 
                    : currentStep === step.number 
                    ? 'border-primary' 
                    : 'border-muted'
                }`}>
                  {currentStep > step.number ? <Check className="w-5 h-5" /> : step.number}
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium">{step.title}</p>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

