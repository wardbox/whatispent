import { motion } from 'motion/react'
import { fadeIn } from '../motion/transitionPresets'
import { Link } from 'wasp/client/router'

export default function TermsOfServicePage() {
  return (
    <motion.div
      initial='initial'
      animate='animate'
      exit='exit'
      variants={fadeIn}
      className='mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8'
    >
      <h1 className='mb-8 text-4xl font-thin tracking-tight'>
        Terms of Service
      </h1>
      <p className='mb-8 text-sm text-muted-foreground'>
        Last Updated:{' '}
        {new Date().toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })}
      </p>

      <div className='prose prose-slate max-w-none space-y-8 dark:prose-invert'>
        <section>
          <h2 className='text-2xl font-thin'>1. Agreement to Terms</h2>
          <p>
            By accessing or using What I Spent ("the Service"), you agree to be
            bound by these Terms of Service ("Terms"). If you do not agree to
            these Terms, you may not access or use the Service.
          </p>
          <p>
            We reserve the right to modify these Terms at any time. We will
            notify users of material changes by updating the "Last Updated" date
            at the top of these Terms. Your continued use of the Service after
            changes constitutes acceptance of the modified Terms.
          </p>
        </section>

        <section>
          <h2 className='text-2xl font-thin'>2. Description of Service</h2>
          <p>
            What I Spent is a personal finance tracking application that helps
            you understand your spending habits by:
          </p>
          <ul>
            <li>
              Connecting to your financial institutions through Plaid to
              retrieve transaction data
            </li>
            <li>Organizing and categorizing your transactions automatically</li>
            <li>
              Providing spending summaries and insights across different time
              periods
            </li>
            <li>Allowing you to track and analyze your financial activity</li>
          </ul>
        </section>

        <section>
          <h2 className='text-2xl font-thin'>3. Account Registration</h2>
          <ul>
            <li>
              <strong>Eligibility:</strong> You must be at least 18 years old to
              use this Service.
            </li>
            <li>
              <strong>Account Creation:</strong> You must create an account
              using Google OAuth authentication.
            </li>
            <li>
              <strong>Account Security:</strong> You are responsible for
              maintaining the security of your account and for all activities
              that occur under your account.
            </li>
            <li>
              <strong>Accurate Information:</strong> You agree to provide
              accurate, current, and complete information during registration
              and to update such information as necessary.
            </li>
            <li>
              <strong>One Account:</strong> You may only create one account per
              person.
            </li>
          </ul>
        </section>

        <section>
          <h2 className='text-2xl font-thin'>4. Subscription and Payment</h2>

          <h3 className='text-xl font-thin'>4.1 Subscription Plans</h3>
          <ul>
            <li>
              <strong>Free Trial:</strong> New users may receive a free trial
              period. Trial details are provided during signup.
            </li>
            <li>
              <strong>Paid Subscription:</strong> After the trial period,
              continued use of the Service requires an active paid subscription.
            </li>
            <li>
              <strong>Pricing:</strong> Subscription prices are displayed during
              checkout and may change with notice.
            </li>
          </ul>

          <h3 className='text-xl font-thin'>4.2 Payment Terms</h3>
          <ul>
            <li>
              <strong>Payment Processing:</strong> All payments are processed
              securely through Stripe, our third-party payment processor.
            </li>
            <li>
              <strong>Billing Cycle:</strong> Subscriptions are billed on a
              recurring basis (monthly or annually as selected).
            </li>
            <li>
              <strong>Automatic Renewal:</strong> Your subscription will
              automatically renew at the end of each billing period unless you
              cancel.
            </li>
            <li>
              <strong>Payment Method:</strong> You must provide a valid payment
              method to maintain an active subscription.
            </li>
            <li>
              <strong>Failed Payments:</strong> If a payment fails, we may
              suspend or terminate your access to the Service.
            </li>
          </ul>

          <h3 className='text-xl font-thin'>4.3 Cancellation and Refunds</h3>
          <ul>
            <li>
              <strong>Cancellation:</strong> You may cancel your subscription at
              any time through your account settings or the Stripe customer
              portal.
            </li>
            <li>
              <strong>Effect of Cancellation:</strong> Upon cancellation, you
              will retain access to the Service until the end of your current
              billing period.
            </li>
            <li>
              <strong>Refunds:</strong> We do not provide refunds for partial
              billing periods. If you cancel mid-cycle, you will not receive a
              prorated refund.
            </li>
            <li>
              <strong>Exceptions:</strong> Refunds may be considered on a
              case-by-case basis for exceptional circumstances.
            </li>
          </ul>
        </section>

        <section>
          <h2 className='text-2xl font-thin'>5. Bank Account Connections</h2>

          <h3 className='text-xl font-thin'>5.1 Plaid Integration</h3>
          <p>
            Our Service uses Plaid to connect to your financial institutions.
            When you connect a bank account:
          </p>
          <ul>
            <li>
              You authorize us to access and retrieve your transaction data
              through Plaid
            </li>
            <li>You agree to Plaid's Terms of Service and Privacy Policy</li>
            <li>
              You grant us permission to sync your transactions automatically
            </li>
          </ul>

          <h3 className='text-xl font-thin'>5.2 Your Responsibilities</h3>
          <ul>
            <li>
              You are responsible for ensuring you have authorization to connect
              any bank accounts to the Service
            </li>
            <li>
              You must maintain valid credentials with your financial
              institutions
            </li>
            <li>
              You can disconnect bank accounts at any time from your Dashboard
            </li>
          </ul>

          <h3 className='text-xl font-thin'>5.3 Data Accuracy</h3>
          <p>
            While we strive to provide accurate financial data, we rely on data
            from third-party financial institutions via Plaid. We do not
            guarantee the accuracy, completeness, or timeliness of transaction
            data. You should verify important financial information with your
            bank directly.
          </p>
        </section>

        <section>
          <h2 className='text-2xl font-thin'>6. Acceptable Use</h2>
          <p>You agree NOT to:</p>
          <ul>
            <li>
              Use the Service for any illegal purpose or in violation of any
              laws
            </li>
            <li>
              Attempt to gain unauthorized access to any part of the Service
            </li>
            <li>
              Interfere with or disrupt the Service or servers connected to the
              Service
            </li>
            <li>
              Use automated means (bots, scrapers) to access the Service without
              permission
            </li>
            <li>Reverse engineer, decompile, or disassemble the Service</li>
            <li>
              Remove, alter, or obscure any proprietary notices on the Service
            </li>
            <li>
              Share your account credentials or access with unauthorized parties
            </li>
            <li>
              Use the Service to transmit viruses, malware, or harmful code
            </li>
          </ul>
        </section>

        <section>
          <h2 className='text-2xl font-thin'>7. Intellectual Property</h2>
          <ul>
            <li>
              <strong>Service Ownership:</strong> The Service, including all
              content, features, and functionality, is owned by What I Spent and
              is protected by copyright, trademark, and other intellectual
              property laws.
            </li>
            <li>
              <strong>Limited License:</strong> We grant you a limited,
              non-exclusive, non-transferable license to access and use the
              Service for personal, non-commercial purposes.
            </li>
            <li>
              <strong>Your Data:</strong> You retain all rights to your
              financial data. We do not claim ownership of your transaction
              data.
            </li>
            <li>
              <strong>Feedback:</strong> If you provide feedback or suggestions
              about the Service, we may use them without any obligation to you.
            </li>
          </ul>
        </section>

        <section>
          <h2 className='text-2xl font-thin'>8. Privacy and Data Protection</h2>
          <p>
            Your privacy is important to us. Our collection and use of your
            information is governed by our{' '}
            <Link to='/privacy' className='text-primary hover:underline'>
              Privacy Policy
            </Link>
            , which is incorporated into these Terms by reference.
          </p>
          <p>Key privacy commitments:</p>
          <ul>
            <li>
              We encrypt sensitive financial data using industry standards
            </li>
            <li>We do not sell your personal information</li>
            <li>You can export or delete your data at any time</li>
            <li>
              We comply with GDPR and CCPA requirements for applicable users
            </li>
          </ul>
        </section>

        <section>
          <h2 className='text-2xl font-thin'>9. Disclaimers and Limitations</h2>

          <h3 className='text-xl font-thin'>9.1 No Financial Advice</h3>
          <p>
            <strong>
              The Service is for informational purposes only and does not
              constitute financial advice.
            </strong>{' '}
            We do not provide investment, tax, legal, or accounting advice. You
            should consult with appropriate professionals for financial
            decisions.
          </p>

          <h3 className='text-xl font-thin'>9.2 Service Availability</h3>
          <p>
            We provide the Service on an "AS IS" and "AS AVAILABLE" basis. We
            make no warranties or representations about:
          </p>
          <ul>
            <li>The accuracy, reliability, or completeness of the Service</li>
            <li>Uninterrupted or error-free operation</li>
            <li>Compatibility with your devices or financial institutions</li>
            <li>
              Prevention of security breaches or unauthorized access (though we
              implement industry-standard security measures)
            </li>
          </ul>

          <h3 className='text-xl font-thin'>9.3 Third-Party Services</h3>
          <p>
            We integrate with third-party services (Plaid, Stripe, Google). We
            are not responsible for:
          </p>
          <ul>
            <li>
              Any failures, errors, or downtime of these third-party services
            </li>
            <li>Changes to third-party services that affect functionality</li>
            <li>Actions or omissions of these third-party providers</li>
          </ul>

          <h3 className='text-xl font-thin'>9.4 Limitation of Liability</h3>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, WHAT I SPENT SHALL NOT BE
            LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR
            PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER
            INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL,
            OR OTHER INTANGIBLE LOSSES.
          </p>
          <p>
            Our total liability to you for any claims arising from or related to
            the Service is limited to the amount you paid us in the 12 months
            preceding the claim.
          </p>
        </section>

        <section>
          <h2 className='text-2xl font-thin'>10. Indemnification</h2>
          <p>
            You agree to indemnify and hold harmless What I Spent, its officers,
            directors, employees, and agents from any claims, damages, losses,
            liabilities, and expenses (including legal fees) arising from:
          </p>
          <ul>
            <li>Your use of the Service</li>
            <li>Your violation of these Terms</li>
            <li>Your violation of any rights of another party</li>
            <li>Your bank account connections or financial data</li>
          </ul>
        </section>

        <section>
          <h2 className='text-2xl font-thin'>11. Termination</h2>

          <h3 className='text-xl font-thin'>11.1 By You</h3>
          <p>
            You may terminate your account at any time by using the account
            deletion feature in your Profile settings. This will permanently
            delete all your data.
          </p>

          <h3 className='text-xl font-thin'>11.2 By Us</h3>
          <p>
            We may suspend or terminate your access to the Service immediately,
            without notice, if:
          </p>
          <ul>
            <li>You violate these Terms</li>
            <li>Your payment fails or your subscription expires</li>
            <li>
              We believe your account poses a security risk or is being used
              fraudulently
            </li>
            <li>We discontinue the Service (with reasonable notice)</li>
          </ul>

          <h3 className='text-xl font-thin'>11.3 Effect of Termination</h3>
          <p>Upon termination:</p>
          <ul>
            <li>Your right to use the Service immediately ceases</li>
            <li>
              Your data will be deleted in accordance with our Privacy Policy
            </li>
            <li>We will cancel any active subscriptions</li>
            <li>
              Sections of these Terms that by their nature should survive
              termination will remain in effect
            </li>
          </ul>
        </section>

        <section>
          <h2 className='text-2xl font-thin'>12. Dispute Resolution</h2>

          <h3 className='text-xl font-thin'>12.1 Governing Law</h3>
          <p>
            These Terms are governed by and construed in accordance with the
            laws of [Your State/Country], without regard to conflict of law
            principles.
          </p>

          <h3 className='text-xl font-thin'>12.2 Informal Resolution</h3>
          <p>
            Before filing a claim, you agree to try to resolve the dispute
            informally by contacting us at support@whatispent.com.
          </p>

          <h3 className='text-xl font-thin'>12.3 Arbitration</h3>
          <p>
            Any dispute arising from these Terms or the Service shall be
            resolved through binding arbitration in accordance with the rules of
            the American Arbitration Association, except where prohibited by
            law.
          </p>

          <h3 className='text-xl font-thin'>12.4 Class Action Waiver</h3>
          <p>
            You agree to resolve disputes with us on an individual basis and
            waive your right to participate in class actions or class-wide
            arbitrations.
          </p>
        </section>

        <section>
          <h2 className='text-2xl font-thin'>13. General Provisions</h2>
          <ul>
            <li>
              <strong>Entire Agreement:</strong> These Terms constitute the
              entire agreement between you and What I Spent regarding the
              Service.
            </li>
            <li>
              <strong>Severability:</strong> If any provision of these Terms is
              found to be unenforceable, the remaining provisions will remain in
              effect.
            </li>
            <li>
              <strong>Waiver:</strong> Our failure to enforce any right or
              provision of these Terms will not be deemed a waiver of such right
              or provision.
            </li>
            <li>
              <strong>Assignment:</strong> You may not assign or transfer these
              Terms without our consent. We may assign these Terms without
              restriction.
            </li>
            <li>
              <strong>Force Majeure:</strong> We are not liable for delays or
              failures due to circumstances beyond our reasonable control.
            </li>
          </ul>
        </section>

        <section>
          <h2 className='text-2xl font-thin'>14. Contact Information</h2>
          <p>If you have questions about these Terms, please contact us at:</p>
          <p>
            <strong>Email:</strong> support@whatispent.com
          </p>
          <p>
            <strong>Legal:</strong> legal@whatispent.com
          </p>
        </section>

        <section className='rounded-lg border bg-muted/50 p-6'>
          <h2 className='text-2xl font-thin'>Acknowledgment</h2>
          <p>
            BY USING THE SERVICE, YOU ACKNOWLEDGE THAT YOU HAVE READ THESE TERMS
            OF SERVICE AND AGREE TO BE BOUND BY THEM.
          </p>
        </section>
      </div>
    </motion.div>
  )
}
