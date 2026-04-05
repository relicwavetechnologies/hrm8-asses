import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

const CTASection = () => {
  return (
    <section className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 hero-gradient opacity-95" />
      
      <div className="container relative">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-6">
            Ready to find your best candidates?
          </h2>
          <p className="text-lg text-primary-foreground/80 mb-10">
            Create your workspace, complete secure checkout, and start managing assessments in minutes.
          </p>
          <Link to="/wizard">
            <Button
              variant="hero-outline"
              size="xl"
              className="group"
            >
              Start Your First Assessment
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
