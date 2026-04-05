import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const faqs = [
  {
    category: 'Getting Started',
    items: [
      {
        question: 'Do I need to create an account to purchase assessments?',
        answer: 'Yes. HRM8 Assess creates your company account during signup so your jobs, candidates, invoices, and results are available in the dashboard immediately after checkout completes.',
      },
      {
        question: 'How quickly are assessments sent after payment?',
        answer: 'Once payment is confirmed and your role is activated, you can review the dashboard and launch invitations from HRM8. Candidate status updates appear in real time after invites are sent.',
      },
      {
        question: 'What payment methods do you accept?',
        answer: 'We support major card payments through our secure checkout provider. Payments are encrypted, processed over PCI-compliant infrastructure, and the billing records are synced back into HRM8.',
      },
    ],
  },
  {
    category: 'Candidates',
    items: [
      {
        question: 'How do candidates receive the assessment?',
        answer: 'Candidates receive a personalized email invitation with a secure link to complete their assessments. The link is unique to each candidate and expires after 7 days by default.',
      },
      {
        question: 'Can candidates complete assessments on mobile?',
        answer: 'Yes, all assessments are mobile-responsive. However, for coding and complex skill tests, we recommend candidates use a desktop for the best experience.',
      },
      {
        question: 'What if a candidate doesn\'t receive the invitation?',
        answer: 'You can resend invitations from your dashboard. We recommend asking candidates to check spam or promotions folders first. If delivery issues continue, contact our support team and we can help trace the send.',
      },
      {
        question: 'How long do candidates have to complete the assessment?',
        answer: 'By default, candidates have 7 days to complete their assessments. You\'ll receive reminders when candidates are approaching the deadline. Links can be extended if needed.',
      },
    ],
  },
  {
    category: 'Results & Reports',
    items: [
      {
        question: 'How quickly are results available?',
        answer: 'Results are available immediately after a candidate completes their assessment. You\'ll receive an email notification and can view detailed reports in your dashboard.',
      },
      {
        question: 'What information is included in the reports?',
        answer: 'Reports include overall scores, category breakdowns, strengths and development areas, and comparison benchmarks. Behavioral assessments include personality insights and team fit indicators.',
      },
      {
        question: 'Can I download or share reports?',
        answer: 'Yes, all reports can be downloaded as PDF documents. You can also share secure links to reports with other team members.',
      },
    ],
  },
  {
    category: 'Privacy & Security',
    items: [
      {
        question: 'Is candidate data secure?',
        answer: 'Absolutely. All data is encrypted in transit and at rest. We\'re GDPR compliant and follow Australian Privacy Principles. Data is stored in secure, SOC 2 compliant infrastructure.',
      },
      {
        question: 'How long is candidate data retained?',
        answer: 'Assessment results are retained for 2 years by default. You can request earlier deletion at any time. We never share or sell candidate data.',
      },
      {
        question: 'Do candidates need to consent to the assessment?',
        answer: 'Yes, candidates must agree to our privacy policy and terms before starting any assessment. You must also confirm that candidates have been informed they will receive an assessment.',
      },
    ],
  },
  {
    category: 'Refunds & Support',
    items: [
      {
        question: 'What is your refund policy?',
        answer: 'If a candidate hasn\'t started their assessment, you can request a full refund within 14 days. Once an assessment is started, it cannot be refunded. Contact support for any issues.',
      },
      {
        question: 'What if there\'s a technical issue during an assessment?',
        answer: 'Candidates can pause and resume assessments. If there\'s a significant technical issue, contact our support team and we\'ll work to resolve it, including providing a new assessment link if needed.',
      },
      {
        question: 'How can I contact support?',
        answer: 'Email us at support@hrm8.com. We respond to all inquiries within 24 business hours.',
      },
    ],
  },
];

const FAQ = () => {
  return (
    <Layout>
      {/* Hero */}
      <section className="py-16 lg:py-20">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Frequently Asked Questions
            </h1>
            <p className="text-lg text-muted-foreground">
              Everything you need to know about HRM8 Candidate Assessments.
            </p>
          </div>

          {/* FAQ Sections */}
          <div className="max-w-3xl mx-auto space-y-12">
            {faqs.map((section) => (
              <div key={section.category}>
                <h2 className="text-xl font-semibold text-foreground mb-4 pb-2 border-b border-border">
                  {section.category}
                </h2>
                <Accordion type="single" collapsible className="space-y-2">
                  {section.items.map((faq, index) => (
                    <AccordionItem 
                      key={index} 
                      value={`${section.category}-${index}`}
                      className="bg-card border border-border rounded-lg px-4 data-[state=open]:shadow-card"
                    >
                      <AccordionTrigger className="text-left font-medium hover:no-underline py-4">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground pb-4">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Still have questions */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Still have questions?
            </h2>
            <p className="text-muted-foreground mb-6">
              Can't find what you're looking for? Our team is here to help.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href="mailto:support@hrm8.com">
                <Button variant="outline" size="lg">
                  Contact Support
                </Button>
              </a>
              <Link to="/wizard">
                <Button variant="hero" size="lg">
                  Start an Assessment
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default FAQ;
