// web/src/pages/legal/Privacy.jsx
import { LegalPage } from '@/components/legal/LegalPage';

const { Section } = LegalPage;

function Privacy() {
    return (
        <LegalPage title="Privacy Policy" updated="August 23, 2026">
            <Section title="1. Information We Collect">
                <p>Weatherly collects and processes the following types of information to provide our weather intelligence services:</p>
                <ul className="list-disc pl-4 sm:pl-5 space-y-1">
                    <li><strong>Location Data:</strong> Approximate or precise device location (with your explicit permission) to deliver localized weather forecasts, alerts, and insights.</li>
                    <li><strong>User-Generated Data:</strong> Saved locations, search history, favorite locations, and custom notifications you create within the app.</li>
                    <li><strong>Preferences and Settings:</strong> App preferences such as theme, measurement units, notification preferences, and widget configurations.</li>
                    <li><strong>Device and Usage Information:</strong> Technical information about your device, operating system, app version, and usage patterns to improve performance and troubleshoot issues.</li>
                    <li><strong>Weather Interaction Data:</strong> Anonymized data about how you interact with weather information (which forecasts you view, alerts you check, etc.) to improve our service relevance.</li>
                </ul>
            </Section>

            <Section title="2. How We Use Your Information">
                <p>We use the information we collect for the following purposes:</p>
                <ul className="list-disc pl-4 sm:pl-5 space-y-1">
                    <li>To provide accurate, localized weather forecasts, alerts, and weather intelligence tailored to your location</li>
                    <li>To remember your preferences and settings across sessions and devices</li>
                    <li>To improve our services through analytics and user behavior analysis</li>
                    <li>To communicate with you about service updates, safety alerts, and important notifications (when you have opted in)</li>
                    <li>To ensure the security, integrity, and proper functioning of our application</li>
                    <li>To comply with legal obligations and protect our rights</li>
                </ul>
            </Section>

            <Section title="3. Legal Basis for Processing">
                <p>We process your personal information based on the following legal grounds:</p>
                <ul className="list-disc pl-4 sm:pl-5 space-y-1">
                    <li><strong>Consent:</strong> For location tracking and certain optional features where you have given explicit permission</li>
                    <li><strong>Contract Performance:</strong> To provide the core weather service you requested</li>
                    <li><strong>Legitimate Interests:</strong> For improving our service, preventing fraud, and ensuring network security</li>
                    <li><strong>Legal Compliance:</strong> When required to comply with applicable laws and regulations</li>
                </ul>
            </Section>

            <Section title="4. Location Data">
                <p>
                    Location data is used solely to provide you with relevant weather information for your specific area. We understand the sensitivity of location data and handle it with special care:
                </p>
                <ul className="list-disc pl-4 sm:pl-5 space-y-1">
                    <li>Location data is only collected when you have explicitly granted permission through your device's operating system</li>
                    <li>You can withdraw location permissions at any time via your device settings or within the app at Settings → Location → Location Permissions</li>
                    <li>We do not sell, rent, or trade your location data to third parties for marketing purposes</li>
                    <li>Location data used for weather services is typically processed in real-time and not stored long-term unless you explicitly save a location</li>
                </ul>
            </Section>

            <Section title="5. Data Sharing and Third-Party Providers">
                <p>We share certain information with trusted third parties to provide our service:</p>
                <ul className="list-disc pl-4 sm:pl-5 space-y-1">
                    <li><strong>Weather Data Providers:</strong> We aggregate data from multiple weather providers (including Open-Meteo, NOAA, OpenWeatherMap, WeatherAPI, Tomorrow.io, and Copernicus) and may share anonymized or aggregated location coordinates necessary to fetch weather data.</li>
                    <li><strong>Service Providers:</strong> We work with trusted partners for hosting, analytics, error monitoring, and other operational services who may process data on our behalf.</li>
                    <li><strong>Legal Requirements:</strong> We may disclose information when required by law, regulation, or legal process.</li>
                </ul>
                <p className="mt-2">
                    We do not sell your personal information to third parties for marketing or advertising purposes.
                </p>
            </Section>

            <Section title="6. Data Security">
                <p>We implement reasonable security measures to protect your information:</p>
                <ul className="list-disc pl-4 sm:pl-5 space-y-1">
                    <li>Data transmitted between your device and our servers is encrypted using industry-standard TLS/SSL</li>
                    <li>We employ secure coding practices and regularly update our dependencies to address known vulnerabilities</li>
                    <li>Access to personal data is restricted to authorized personnel who need it to perform their job functions</li>
                    <li>We conduct regular security assessments and penetration testing</li>
                </ul>
                <p className="mt-2">
                    While we strive to protect your information, no method of transmission over the internet or electronic storage is 100% secure.
                </p>
            </Section>

            <Section title="7. Data Retention">
                <p>We retain your information only as long as necessary:</p>
                <ul className="list-disc pl-4 sm:pl-5 space-y-1">
                    <li><strong>Account Information:</strong> If you create an account, we retain your data until you delete your account</li>
                    <li><strong>Location History:</strong> Saved locations remain until you remove them</li>
                    <li><strong>Usage Analytics:</strong> Aggregated usage data may be retained for longer periods to improve our service</li>
                    <li><strong>Cache Data:</strong> Temporary weather data is automatically cleared according to our caching policies</li>
                </ul>
                <p className="mt-2">
                    You can delete your data at any time by clearing app data or uninstalling the application.
                </p>
            </Section>

            <Section title="8. Your Rights and Choices">
                <p>Depending on your jurisdiction, you may have certain rights regarding your personal information:</p>
                <ul className="list-disc pl-4 sm:pl-5 space-y-1">
                    <li><strong>Access:</strong> You may request a copy of the personal information we hold about you</li>
                    <li><strong>Correction:</strong> You may request correction of inaccurate or incomplete information</li>
                    <li><strong>Deletion:</strong> You may request deletion of your personal information in certain circumstances</li>
                    <li><strong>Portability:</strong> You may receive your information in a structured, commonly used format</li>
                    <li><strong>Objection:</strong> You may object to certain types of processing, such as direct marketing</li>
                </ul>
                <p className="mt-2">
                    To exercise these rights, please contact us at <a href="mailto:privacy@weatherly.app" className="text-orange-500 hover:underline">privacy@weatherly.app</a>.
                </p>
            </Section>

            <Section title="9. Children's Privacy">
                <p>
                    Weatherly is a general audience application. We do not knowingly collect personal information from children under 13 years of age. If we become aware that we have inadvertently collected personal information from a child under 13, we will take steps to delete such information as soon as possible.
                </p>
            </Section>

            <Section title="10. International Data Transfers">
                <p>
                    Weatherly may transfer, store, and process your information in countries outside your own. Where we transfer personal data, we ensure appropriate safeguards are in place to protect your information in accordance with applicable data protection laws.
                </p>
            </Section>

            <Section title="11. Changes to This Policy">
                <p>
                    We may update this Privacy Policy from time to time. We will notify users of any material changes by updating the "Last updated" date at the top of this policy. For significant changes, we may provide additional notice through in-app notifications or email. Your continued use of Weatherly after such changes constitutes your acceptance of the updated Privacy Policy.
                </p>
            </Section>

            <Section title="12. Contact Information">
                <p>
                    If you have questions about this Privacy Policy or our data practices, please contact us at:
                </p>
                <p className="mt-2">
                    <a href="mailto:privacy@weatherly.app" className="text-orange-500 hover:underline">
                        privacy@weatherly.app
                    </a>
                </p>
                <p className="mt-2">
                    Alternatively, you can reach us at:
                </p>
                <p className="mt-1">
                    Weatherly Privacy Team<br />
                    c/o Weatherly Inc.<br />
                    123 Weatherly Way<br />
                    San Francisco, CA 94105<br />
                    USA
                </p>
            </Section>
        </LegalPage>
    );
}

export default Privacy;