// web/src/pages/legal/Cookies.jsx
import { LegalPage } from '@/components/legal/LegalPage';

const { Section } = LegalPage;

function Cookies() {
    return (
        <LegalPage title="Cookie Policy" updated="August 23, 2026">
            <Section title="1. What Are Cookies">
                <p>
                    Cookies are small text files stored on your device by your browser. Weatherly
                    also uses similar technologies such as local storage and session storage to remember
                    your preferences, improve performance, and provide essential functionality.
                </p>
            </Section>

            <Section title="2. How We Use Cookies & Storage Technologies">
                <ul className="list-disc pl-4 sm:pl-5 space-y-1">
                    <li><strong>Essential Cookies:</strong> Necessary for the website to function properly. These include cookies that remember your theme preference, units settings, and saved locations.</li>
                    <li><strong>Performance Cookies:</strong> Used to understand how visitors interact with our website by collecting and reporting information anonymously. These help us improve site performance and user experience.</li>
                    <li><strong>Functional Cookies:</strong> Enable enhanced functionality and personalization, such as remembering your last active location and dismissed notices.</li>
                    <li><strong>Analytics Cookies:</strong> Help us analyze site traffic and user behavior to improve our services. We use trusted third-party analytics providers who may set their own cookies.</li>
                </ul>
            </Section>

            <Section title="3. Specific Cookies We Use">
                <div className="space-y-2">
                    <div>
                        <h3 className="font-medium text-stone-900 dark:text-stone-100">First-Party Cookies</h3>
                        <p className="text-stone-600 dark:text-stone-400 mt-1">
                            Weatherly sets the following cookies directly:
                        </p>
                        <ul className="list-disc pl-5 space-y-1 mt-2">
                            <li><strong>weatherly_theme:</strong> Stores your preferred display theme (light/dark/system)</li>
                            <li><strong>weatherly_units:</strong> Remembers your preferred measurement units (metric/imperial)</li>
                            <li><strong>weatherly_locations:</strong> Saves your custom locations for quick access</li>
                            <li><strong>weatherly_lastOpened:</strong> Tracks when you last opened the app for performance optimization</li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-medium text-stone-900 dark:text-stone-100 mt-4">Third-Party Cookies</h3>
                        <p className="text-stone-600 dark:text-stone-400 mt-1">
                            We may allow trusted third-party services to set cookies for:
                        </p>
                        <ul className="list-disc pl-5 space-y-1 mt-2">
                            <li>Analytics and performance monitoring (e.g., error tracking, usage statistics)</li>
                            <li>Embedded content from weather data providers</li>
                            <li>Security and fraud prevention measures</li>
                        </ul>
                    </div>
                </div>
            </Section>

            <Section title="4. Managing Your Cookie Preferences">
                <p>
                    You have several options to control or delete cookies:
                </p>
                <ul className="list-disc pl-4 sm:pl-5 space-y-1">
                    <li><strong>Browser Settings:</strong> Most browsers allow you to block or delete cookies through their privacy settings. Refer to your browser's help documentation for specific instructions.</li>
                    <li><strong>In-App Controls:</strong> You can clear all locally stored app data via Settings → Data & Storage → Clear cache within the Weatherly app.</li>
                    <li><strong>Opt-Out Mechanisms:</strong> For third-party analytics cookies, you may be able to opt out through the provider's specific opt-out page.</li>
                </ul>
                <p className="mt-2">
                    Please note that disabling certain cookies may affect the functionality and user experience of Weatherly.
                </p>
            </Section>

            <Section title="5. Data Retention">
                <p>
                    The retention period for our cookies varies:
                </p>
                <ul className="list-disc pl-4 sm:pl-5 space-y-1">
                    <li><strong>Session Cookies:</strong> Expire when you close your browser</li>
                    <li><strong>Persistent Cookies:</strong> Typically remain for 30 days to 2 years, depending on their purpose</li>
                    <li><strong>Local Storage Data:</strong> Remains until manually cleared or until you uninstall the application</li>
                </ul>
            </Section>

            <Section title="6. Changes to This Policy">
                <p>
                    We may update this Cookie Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. We will notify users of any material changes by updating the "Last updated" date at the top of this policy. For significant changes, we may provide additional notice through in-app notifications or email.
                </p>
            </Section>

            <Section title="7. Contact Information">
                <p>
                    If you have questions about our use of cookies or this Cookie Policy, please contact us at:
                </p>
                <p className="mt-2">
                    <a href="mailto:privacy@weatherly.app" className="text-orange-500 hover:underline">
                        privacy@weatherly.app
                    </a>
                </p>
            </Section>
        </LegalPage>
    );
}

export default Cookies;