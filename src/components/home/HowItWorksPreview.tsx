import { Building2, Users, CreditCard, Send } from 'lucide-react';

const steps = [
  {
    icon: Building2,
    number: '01',
    title: 'Create Role',
    description: 'Define your position and get AI-recommended assessments and services tailored to the role.',
  },
  {
    icon: Users,
    number: '02',
    title: 'Add Candidates',
    description: 'Simply add one or more candidates name and email and we take care of everything.',
  },
  {
    icon: CreditCard,
    number: '03',
    title: 'Pay & Launch',
    description: 'Review your order, complete secure checkout, and launch candidate invitations from your live dashboard.',
  },
];

const HowItWorksPreview = () => {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Three simple steps
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From role creation to candidate assessment in minutes, not days.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <div
              key={step.number}
              className="relative group"
            >
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-1/2 w-full h-0.5 bg-border" />
              )}
              
              <div className="relative bg-card rounded-2xl p-8 border border-border shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1">
                {/* Step number */}
                <div className="absolute -top-4 left-8 px-3 py-1 bg-primary text-primary-foreground text-sm font-bold rounded-full">
                  {step.number}
                </div>
                
                {/* Icon */}
                <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center mb-6 group-hover:bg-primary/10 transition-colors">
                  <step.icon className="h-7 w-7 text-primary" />
                </div>

                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {step.title}
                </h3>
                <p className="text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksPreview;
