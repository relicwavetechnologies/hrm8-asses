import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { 
  Building2, 
  Users, 
  Sparkles, 
  CreditCard, 
  Send, 
  BarChart3,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

const steps = [
  {
    icon: Building2,
    number: 1,
    title: 'Enter Company & User Details',
    description: 'Create your HRM8 Assess workspace with the company and admin details needed to manage assessments after checkout.',
    highlights: ['Company and account bootstrap', 'Your work email and password', 'Workspace created before checkout'],
  },
  {
    icon: Users,
    number: 2,
    title: 'Define the Position',
    description: 'Describe the role you\'re hiring for. Our AI uses this to recommend the most relevant assessments.',
    highlights: ['Job title and location', 'Key skills and responsibilities', 'Optional: paste full job description'],
  },
  {
    icon: Sparkles,
    number: 3,
    title: 'Select Assessments & Services',
    description: 'Choose from our library of assessments for skills, behaviour, and aptitude. Add optional services like reference checks, identity verification, and more.',
    highlights: ['AI-powered assessment recommendations', 'Add-on services like reference & background checks', 'Browse the full library to customise your package'],
  },
  {
    icon: Users,
    number: 4,
    title: 'Add Your Candidates',
    description: 'Enter candidate details one by one or bulk import multiple candidates at once.',
    highlights: ['Name and email required', 'Optional candidate reference ID', 'Bulk paste for multiple candidates'],
  },
  {
    icon: CreditCard,
    number: 5,
    title: 'Pay Securely',
    description: 'Review your order and complete secure checkout. HRM8 confirms payment, activates your assessment role, and prepares your dashboard.',
    highlights: ['Clear cost breakdown', 'Secure hosted checkout', 'Activation after payment confirmation'],
  },
  {
    icon: Send,
    number: 6,
    title: 'Confirm & Launch',
    description: 'After payment, HRM8 confirms the order, opens your dashboard, and lets you launch candidate invitations from the live role workspace.',
    highlights: ['Payment confirmation screen', 'Dashboard access right away', 'Launch invitations when you are ready'],
  },
  {
    icon: BarChart3,
    number: 7,
    title: 'View Results',
    description: 'Results are available as soon as candidates complete. Access detailed reports anytime from your dashboard.',
    highlights: ['Real-time completion tracking', 'Detailed score reports', 'Downloadable PDF reports'],
  },
];

const HowItWorks = () => {
  return (
    <Layout>
      {/* Hero */}
      <section className="py-16 lg:py-24">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-primary/20 mb-6">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Built for a fast assessment-first signup</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              How HRM8 Assessments Work
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              From creating a role to viewing candidate results — the entire process takes just minutes, not days.
            </p>
            <Link to="/wizard">
              <Button variant="hero" size="lg">
                Start an Assessment
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            {steps.map((step, index) => (
              <div key={step.number} className="relative">
                {/* Connector */}
                {index < steps.length - 1 && (
                  <div className="absolute left-8 top-20 bottom-0 w-0.5 bg-border" />
                )}
                
                <div className="flex gap-6 mb-12">
                  {/* Icon */}
                  <div className="relative z-10 flex-shrink-0 w-16 h-16 rounded-2xl hero-gradient flex items-center justify-center shadow-lg">
                    <step.icon className="h-7 w-7 text-primary-foreground" />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 bg-card rounded-2xl p-6 border border-border shadow-card">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-sm font-bold text-primary">Step {step.number}</span>
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {step.description}
                    </p>
                    <ul className="space-y-2">
                      {step.highlights.map((highlight) => (
                        <li key={highlight} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                          {highlight}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Ready to get started?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Create your workspace, complete checkout, and land directly in your dashboard with the role ready to manage.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/wizard">
                <Button variant="hero" size="lg">
                  Start an Assessment
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/assessments">
                <Button variant="outline" size="lg">
                  Browse Assessments
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default HowItWorks;
