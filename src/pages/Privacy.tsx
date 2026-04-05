import Layout from '@/components/layout/Layout';
import { Link } from 'react-router-dom';

const Privacy = () => {
  return (
    <Layout>
      <section className="py-16">
        <div className="container">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold text-foreground mb-8">
              Privacy Policy
            </h1>
            <p className="text-muted-foreground mb-8">
              Last updated: January 2025
            </p>

            <div className="prose prose-slate max-w-none">
              <div className="space-y-8 text-muted-foreground">
                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-4">1. Information We Collect</h2>
                  <h3 className="font-medium text-foreground mt-4 mb-2">From Employers:</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Company information (name, address, industry)</li>
                    <li>User contact details (name, email, phone)</li>
                    <li>Payment information and billing metadata (processed securely via our payment providers)</li>
                    <li>Position and hiring information</li>
                  </ul>
                  
                  <h3 className="font-medium text-foreground mt-4 mb-2">From Candidates:</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Contact information provided by employer</li>
                    <li>Assessment responses and results</li>
                    <li>Technical information (browser, device type)</li>
                    <li>Assessment completion timestamps</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-4">2. How We Use Information</h2>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Deliver and administer assessments</li>
                    <li>Generate assessment reports</li>
                    <li>Process payments</li>
                    <li>Send transactional communications</li>
                    <li>Improve our services</li>
                    <li>Comply with legal obligations</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-4">3. Data Sharing</h2>
                  <p>
                    We share data only as necessary to provide our services:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 mt-2">
                    <li><strong className="text-foreground">Assessment Partners:</strong> To deliver and score assessments</li>
                    <li><strong className="text-foreground">Payment Processors:</strong> Airwallex and other approved payment partners used for secure checkout and settlement</li>
                    <li><strong className="text-foreground">Service Providers:</strong> Hosting and infrastructure services</li>
                    <li><strong className="text-foreground">Legal Requirements:</strong> When required by law</li>
                  </ul>
                  <p className="mt-4">
                    We never sell personal data to third parties for marketing purposes.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-4">4. Data Retention</h2>
                  <p>
                    Assessment results are retained for 2 years from the date of completion. Account information is retained for the life of the account plus 7 years for legal compliance. You may request earlier deletion of candidate data.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-4">5. Data Security</h2>
                  <p>
                    We implement industry-standard security measures including:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 mt-2">
                    <li>Encryption in transit (TLS 1.3) and at rest (AES-256)</li>
                    <li>SOC 2 compliant infrastructure</li>
                    <li>Regular security audits</li>
                    <li>Access controls and authentication</li>
                    <li>Secure payment processing (PCI-DSS compliant)</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-4">6. Candidate Rights</h2>
                  <p>
                    Candidates have the right to:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 mt-2">
                    <li>Access their assessment data</li>
                    <li>Request correction of inaccurate data</li>
                    <li>Request deletion of their data</li>
                    <li>Withdraw consent (though this may affect assessment completion)</li>
                    <li>Lodge complaints with relevant data protection authorities</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-4">7. International Transfers</h2>
                  <p>
                    Data may be processed in Australia and other countries where our service providers operate. We ensure appropriate safeguards are in place for international transfers in compliance with GDPR and Australian Privacy Principles.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-4">8. Cookies</h2>
                  <p>
                    We use essential cookies for authentication and security. Analytics cookies help us improve our services. You can manage cookie preferences through your browser settings.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-foreground mb-4">9. Contact Us</h2>
                  <p>
                    For privacy inquiries or to exercise your rights:
                  </p>
                  <p className="mt-2">
                    Email: privacy@hrm8.com<br />
                    Mail: HRM8 Privacy Officer, [Address]
                  </p>
                </section>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-border">
              <Link to="/terms" className="text-primary hover:underline">
                View Terms of Service →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Privacy;
