import { motion } from 'motion/react'
import { fadeIn } from '../motion/transitionPresets'

export default function PrivacyPolicyPage() {
  return (
    <motion.div
      initial='initial'
      animate='animate'
      exit='exit'
      variants={fadeIn}
      className='mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8'
    >
      <h1 className='mb-8 text-4xl font-thin tracking-tight'>Privacy Policy</h1>
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
          <h2 className='text-2xl font-thin'>1. Introduction</h2>
          <p>
            Welcome to What I Spent ("we," "our," or "us"). We are committed to
            protecting your privacy and handling your data in an open and
            transparent manner. This Privacy Policy explains how we collect,
            use, disclose, and safeguard your information when you use our
            financial tracking application and related services.
          </p>
          <p>
            By using What I Spent, you agree to the collection and use of
            information in accordance with this Privacy Policy.
          </p>
        </section>

        <section>
          <h2 className='text-2xl font-thin'>2. Information We Collect</h2>

          <h3 className='text-xl font-thin'>2.1 Information You Provide</h3>
          <ul>
            <li>
              <strong>Account Information:</strong> When you create an account
              using Google OAuth, we collect your email address and username.
            </li>
            <li>
              <strong>Payment Information:</strong> When you subscribe to our
              service, payment information is processed by Stripe, our
              third-party payment processor. We do not store your credit card
              information.
            </li>
          </ul>

          <h3 className='text-xl font-thin'>2.2 Financial Data via Plaid</h3>
          <ul>
            <li>
              <strong>Bank Account Information:</strong> When you connect your
              bank accounts through Plaid, we collect information about your
              financial institutions, account names, account types, and account
              balances.
            </li>
            <li>
              <strong>Transaction Data:</strong> We collect transaction data
              including transaction amounts, dates, merchant names, and
              categories to provide you with spending insights.
            </li>
            <li>
              <strong>Access Tokens:</strong> We securely store encrypted access
              tokens from Plaid to maintain your bank connections. These tokens
              are encrypted using AES-256-GCM encryption.
            </li>
          </ul>

          <h3 className='text-xl font-thin'>
            2.3 Automatically Collected Information
          </h3>
          <ul>
            <li>
              <strong>Usage Analytics:</strong> We use Plausible Analytics, a
              privacy-friendly analytics service, to understand how users
              interact with our application. Plausible does not use cookies and
              does not collect personally identifiable information.
            </li>
            <li>
              <strong>Log Data:</strong> Our servers automatically record
              information when you use our service, including your IP address,
              browser type, and pages visited.
            </li>
          </ul>
        </section>

        <section>
          <h2 className='text-2xl font-thin'>3. How We Use Your Information</h2>
          <p>We use the collected information for the following purposes:</p>
          <ul>
            <li>
              <strong>Provide Services:</strong> To display your financial data,
              calculate spending summaries, and provide transaction insights.
            </li>
            <li>
              <strong>Account Management:</strong> To create and maintain your
              account, process payments, and manage subscriptions.
            </li>
            <li>
              <strong>Sync Transactions:</strong> To automatically sync your
              latest transactions from connected financial institutions.
            </li>
            <li>
              <strong>Improve Our Service:</strong> To analyze usage patterns
              and improve our application's features and performance.
            </li>
            <li>
              <strong>Communication:</strong> To send you important updates
              about your account, subscription, or service changes.
            </li>
            <li>
              <strong>Security:</strong> To detect, prevent, and address
              technical issues, fraud, and security incidents.
            </li>
          </ul>
        </section>

        <section>
          <h2 className='text-2xl font-thin'>
            4. How We Share Your Information
          </h2>
          <p>
            We do not sell your personal information. We share information only
            in the following circumstances:
          </p>

          <h3 className='text-xl font-thin'>
            4.1 Third-Party Service Providers
          </h3>
          <ul>
            <li>
              <strong>Plaid:</strong> We use Plaid to connect to your financial
              institutions and retrieve transaction data. Plaid's use of your
              information is governed by their Privacy Policy.
            </li>
            <li>
              <strong>Stripe:</strong> We use Stripe to process payments and
              manage subscriptions. Stripe's use of your information is governed
              by their Privacy Policy.
            </li>
            <li>
              <strong>Google OAuth:</strong> We use Google for authentication.
              Google's use of your information is governed by their Privacy
              Policy.
            </li>
            <li>
              <strong>Plausible Analytics:</strong> We use Plausible for
              privacy-friendly website analytics that does not track individual
              users or use cookies.
            </li>
          </ul>

          <h3 className='text-xl font-thin'>4.2 Legal Requirements</h3>
          <p>
            We may disclose your information if required to do so by law or in
            response to valid requests by public authorities (e.g., a court or
            government agency).
          </p>
        </section>

        <section>
          <h2 className='text-2xl font-thin'>5. Data Security</h2>
          <p>
            We implement industry-standard security measures to protect your
            information:
          </p>
          <ul>
            <li>
              <strong>Encryption:</strong> Plaid access tokens are encrypted
              using AES-256-GCM encryption before storage.
            </li>
            <li>
              <strong>Secure Transmission:</strong> All data transmitted between
              your browser and our servers is encrypted using HTTPS/TLS.
            </li>
            <li>
              <strong>Access Controls:</strong> We restrict access to your
              personal information to authorized personnel only.
            </li>
            <li>
              <strong>Database Security:</strong> Our PostgreSQL database uses
              secure authentication and is not publicly accessible.
            </li>
          </ul>
          <p>
            However, no method of transmission over the internet or electronic
            storage is 100% secure. While we strive to protect your information,
            we cannot guarantee its absolute security.
          </p>
        </section>

        <section>
          <h2 className='text-2xl font-thin'>6. Your Data Rights</h2>
          <p>You have the following rights regarding your personal data:</p>
          <ul>
            <li>
              <strong>Access:</strong> You can view your profile information and
              connected accounts at any time through your account settings.
            </li>
            <li>
              <strong>Export:</strong> You can export all your data (including
              transactions, accounts, and profile information) as a JSON file
              from your Profile page.
            </li>
            <li>
              <strong>Deletion:</strong> You can delete your account and all
              associated data at any time from your Profile page. This action is
              permanent and cannot be undone.
            </li>
            <li>
              <strong>Disconnect Accounts:</strong> You can disconnect specific
              financial institutions from your Dashboard at any time, which will
              delete all associated accounts and transactions.
            </li>
            <li>
              <strong>Opt-Out:</strong> You can opt out of analytics tracking by
              using browser extensions that block Plausible Analytics.
            </li>
          </ul>
        </section>

        <section>
          <h2 className='text-2xl font-thin'>7. Data Retention</h2>
          <ul>
            <li>
              <strong>Active Accounts:</strong> We retain your data for as long
              as your account is active or as needed to provide you services.
            </li>
            <li>
              <strong>Deleted Accounts:</strong> When you delete your account,
              all personal data, financial connections, and transactions are
              immediately and permanently deleted from our systems.
            </li>
            <li>
              <strong>Legal Obligations:</strong> We may retain certain
              information to comply with legal obligations, resolve disputes, or
              enforce our agreements.
            </li>
          </ul>
        </section>

        <section>
          <h2 className='text-2xl font-thin'>8. Children's Privacy</h2>
          <p>
            Our service is not intended for individuals under the age of 18. We
            do not knowingly collect personal information from children. If you
            become aware that a child has provided us with personal information,
            please contact us, and we will take steps to delete such
            information.
          </p>
        </section>

        <section>
          <h2 className='text-2xl font-thin'>
            9. International Data Transfers
          </h2>
          <p>
            Your information may be transferred to and processed in countries
            other than your country of residence. These countries may have data
            protection laws different from those in your country. By using our
            service, you consent to your information being transferred to our
            facilities and third-party service providers as described in this
            Privacy Policy.
          </p>
        </section>

        <section>
          <h2 className='text-2xl font-thin'>
            10. Changes to This Privacy Policy
          </h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify
            you of any material changes by posting the new Privacy Policy on
            this page and updating the "Last Updated" date. You are advised to
            review this Privacy Policy periodically for any changes.
          </p>
        </section>

        <section>
          <h2 className='text-2xl font-thin'>11. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy or our data
            practices, please contact us at:
          </p>
          <p>
            <strong>Email:</strong> privacy@whatispent.com
          </p>
        </section>

        <section className='rounded-lg border bg-muted/50 p-6'>
          <h2 className='text-2xl font-thin'>
            Your Rights Under GDPR (for EU Users)
          </h2>
          <p>If you are in the European Union, you have additional rights:</p>
          <ul>
            <li>
              <strong>Right to Access:</strong> Request copies of your personal
              data.
            </li>
            <li>
              <strong>Right to Rectification:</strong> Request correction of
              inaccurate data.
            </li>
            <li>
              <strong>Right to Erasure:</strong> Request deletion of your data
              (available in Profile settings).
            </li>
            <li>
              <strong>Right to Data Portability:</strong> Request transfer of
              your data to another service (available via data export feature).
            </li>
            <li>
              <strong>Right to Object:</strong> Object to processing of your
              data under certain circumstances.
            </li>
            <li>
              <strong>Right to Lodge a Complaint:</strong> File a complaint with
              your local data protection authority.
            </li>
          </ul>
        </section>

        <section className='rounded-lg border bg-muted/50 p-6'>
          <h2 className='text-2xl font-thin'>
            Your Rights Under CCPA (for California Users)
          </h2>
          <p>
            If you are a California resident, you have additional rights under
            the California Consumer Privacy Act (CCPA):
          </p>
          <ul>
            <li>
              <strong>Right to Know:</strong> Request information about the
              categories and specific pieces of personal information we collect.
            </li>
            <li>
              <strong>Right to Delete:</strong> Request deletion of your
              personal information (available in Profile settings).
            </li>
            <li>
              <strong>Right to Opt-Out:</strong> We do not sell your personal
              information.
            </li>
            <li>
              <strong>Right to Non-Discrimination:</strong> We will not
              discriminate against you for exercising your CCPA rights.
            </li>
          </ul>
        </section>
      </div>
    </motion.div>
  )
}
