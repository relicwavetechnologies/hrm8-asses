import Layout from '@/components/layout/Layout';
import { Link } from 'react-router-dom';

const Terms = () => {
  return (
    <Layout>
      <section className="py-16">
        <div className="container">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold text-foreground mb-8">
              Terms of Service
            </h1>
            <p className="text-muted-foreground mb-8">
              Last updated: January 2025
            </p>

            <div className="prose prose-slate max-w-none">
              <div className="space-y-8 text-muted-foreground">
                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-4">1. Acceptance of Terms</h2>
                  <p>
                    By accessing or using HRM8 Candidate Assessments ("Service"), you agree to be bound by these Terms of Service. If you are using the Service on behalf of an organization, you represent that you have authority to bind that organization.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-4">2. Service Description</h2>
                  <p>
                    HRM8 provides candidate assessment services including skills tests, behavioral assessments, and aptitude evaluations. Assessments are delivered through our platform and partner integrations.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-4">3. User Responsibilities</h2>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Provide accurate company and candidate information</li>
                    <li>Obtain necessary consent from candidates before sending assessments</li>
                    <li>Use assessment results for legitimate employment purposes only</li>
                    <li>Maintain confidentiality of account credentials</li>
                    <li>Comply with applicable employment and anti-discrimination laws</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-4">4. Payment Terms</h2>
                  <p>
                    Prices are shown in the billing currency selected for your workspace unless otherwise stated. Payment is required at the time of purchase. HRM8 uses secure hosted checkout and approved payment processors to collect and settle payment.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-4">5. Refund Policy</h2>
                  <p>
                    Full refunds are available for assessments not yet started by candidates within 14 days of purchase. Once a candidate begins an assessment, no refund is available. Contact support@hrm8.com for refund requests.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-4">6. Intellectual Property</h2>
                  <p>
                    All assessment content, methodologies, and reports are proprietary to HRM8 and our assessment partners. You may use reports for internal hiring decisions but may not redistribute or resell assessment content.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-4">7. Limitation of Liability</h2>
                  <p>
                    HRM8 provides assessment tools to support hiring decisions but does not guarantee hiring outcomes. Assessment results should be used as one factor among many in employment decisions.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-4">8. Changes to Terms</h2>
                  <p>
                    We may update these terms from time to time. Continued use of the Service after changes constitutes acceptance of updated terms.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-4">9. Contact</h2>
                  <p>
                    For questions about these Terms, contact us at legal@hrm8.com.
                  </p>
                </section>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-border">
              <Link to="/privacy" className="text-primary hover:underline">
                View Privacy Policy →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Terms;
