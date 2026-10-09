// web/src/pages/legal/Terms.jsx
import { LegalPage } from '@/components/legal/LegalPage';

const { Section } = LegalPage;

function Terms() {
    return (
        <LegalPage title="Terms of Service" updated="August 23, 2026">
            <Section title="1. Acceptance of Terms">
                <p>
                    By accessing or using Weatherly ("the App," "the Service," or "Weatherly"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use the App. Your continued use of the App constitutes your acceptance of and agreement to all terms and conditions in this document.
                </p>
            </Section>

            <Section title="2. Description of Service">
                <p>
                    Weatherly provides real-time weather intelligence by aggregating data from multiple trusted weather data providers. The Service includes weather forecasts, alerts, analytics, and related features made available through our mobile and web applications. Weather information is provided "as is" and "as available" and may not always be complete, accurate, or up to date due to the inherent unpredictability of weather patterns and limitations of data sources.
                </p>
            </Section>

            <Section title="3. Eligibility">
                <p>
                    The Service is available only to individuals who are at least 13 years old. If you are under 13 years old, you may not use the Service. By using the Service, you represent and warrant that you are at least 13 years of age.
                </p>
            </Section>

            <Section title="4. Account Registration">
                <p>
                    While many features of Weatherly are available without registration, certain features may require you to create an account. You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate, current, and complete. You are responsible for maintaining the confidentiality of your account and password and for restricting access to your device. You agree to accept responsibility for all activities that occur under your account.
                </p>
            </Section>

            <Section title="5. User Responsibilities and Conduct">
                <p>As a condition of your use of the Service, you agree not to:</p>
                <ul className="list-disc pl-4 sm:pl-5 space-y-1">
                    <li>Use the Service for any unlawful purpose or in violation of any local, state, national, or international law</li>
                    <li>Interfere with or disrupt the Service or servers or networks connected to the Service</li>
                    <li>Attempt to gain unauthorized access to the Service, user accounts, or computer systems</li>
                    <li>Upload or transmit any viruses, malware, or other harmful code</li>
                    <li>Engage in any form of harassment, abuse, or harmful conduct toward other users</li>
                    <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
                    <li>Remove, circumvent, disable, damage, or otherwise interfere with security-related features of the Service</li>
                </ul>
            </Section>

            <Section title="6. Intellectual Property Rights">
                <p>
                    The Service and its original content, features, and functionality are and will remain the exclusive property of Weatherly Inc. and its licensors. The Service is protected by copyright, trademark, and other laws of both the United States and foreign countries. Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of Weatherly Inc.
                </p>
                <p className="mt-2">
                    Nothing in these Terms shall be construed as granting, by implication, estoppel, or otherwise, any license or right to use any trademark displayed on the Service without our prior written permission.
                </p>
            </Section>

            <Section title="7. User-Generated Content">
                <p>
                    If you choose to contribute content to the Service (such as location names, weather observations, or feedback), you grant Weatherly a worldwide, non-exclusive, royalty-free, transferable, sublicensable license to use, reproduce, distribute, create derivative works from, display, and perform such content in connection with the Service and Weatherly's business.
                </p>
                <p className="mt-2">
                    You represent and warrant that: (i) you own or control all rights to the content you submit; (ii) the content is accurate; (iii) use of the content you supply does not violate any policy or these Terms, and will not cause injury to any person or entity; and (iv) you have obtained any necessary permissions from third parties to submit the content.
                </p>
            </Section>

            <Section title="8. Third-Party Weather Providers and Data">
                <p>
                    Weatherly aggregates weather data from multiple third-party providers. We do not control the accuracy, completeness, timeliness, or reliability of data provided by these third parties. Weatherly is not responsible for any errors, omissions, or inaccuracies in the weather data provided by third-party providers.
                </p>
                <p className="mt-2">
                    The use of third-party data is subject to the terms and conditions of those providers. By using Weatherly, you acknowledge that you may be subject to the terms of third-party data providers.
                </p>
            </Section>

            <Section title="9. Disclaimer of Warranties">
                <p>
                    THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE," WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING, BUT NOT LIMITED TO, WARRANTIES OF TITLE OR IMPLIED WARRANTIES OF MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, OR OTHERWISE, EXCEPT AS EXPRESSLY PROVIDED IN THESE TERMS.
                </p>
            </Section>

            <Section title="10. Limitation of Liability">
                <p>
                    TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL WEATHERLY INC., ITS AFFILIATES, OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, PARTNERS, OR LICENSORS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF USE, DATA, GOOD-WILL, OR THE COST OF PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES, RESULTING FROM (A) THE USE OR INABILITY TO USE THE SERVICE; (B) ANY ERRORS OR OMISSIONS IN ANY CONTENT; (C) ANY UNAUTHORIZED ACCESS TO OR ALTERATION OF YOUR TRANSMISSIONS OR DATA; (D) STATEMENTS OR CONDUCT OF ANY THIRD PARTY ON THE SERVICE; OR (E) ANY OTHER MATTER RELATING TO THE SERVICE.
                </p>
                <p className="mt-2">
                    SOME JURISDICTIONS DO NOT ALLOW THE EXCLUSION OF CERTAIN WARRANTIES OR THE LIMITATION OR EXCLUSION OF LIABILITY FOR INCIDENTAL OR CONSEQUENTIAL DAMAGES. TO THE EXTENT SUCH EXCLUSIONS OR LIMITATIONS ARE NOT PERMITTED IN YOUR JURISDICTION, OUR LIABILITY SHALL BE LIMITED TO THE MAXIMUM EXTENT PERMITTED BY LAW.
                </p>
            </Section>

            <Section title="11. Indemnification">
                <p>
                    You agree to defend, indemnify, and hold harmless Weatherly Inc., its affiliates, and their respective officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, and expenses, including reasonable attorneys' fees, arising out of or in any way connected with: (i) your access to or use of the Service; (ii) your violation of these Terms; or (iii) your violation of any rights of another.
                </p>
            </Section>

            <Section title="12. Termination">
                <p>
                    We may terminate or suspend your access to the Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach these Terms. Upon termination, your right to use the Service will immediately cease. If you wish to terminate your account, you may simply discontinue using the Service.
                </p>
            </Section>

            <Section title="13. Governing Law">
                <p>
                    These Terms shall be governed by and construed in accordance with the laws of the State of California, without regard to its conflict of law principles. Any legal action or proceeding arising under these Terms shall be brought exclusively in the federal or state courts located in San Francisco County, California, and you hereby consent to and submit to the personal jurisdiction of such courts for the purpose of litigating any such action or proceeding.
                </p>
            </Section>

            <Section title="14. Changes to These Terms">
                <p>
                    We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion. By continuing to access or use our Service after any revisions become effective, you agree to be bound by the revised Terms.
                </p>
            </Section>

            <Section title="15. Contact Information">
                <p>
                    If you have any questions about these Terms of Service, please contact us at:
                </p>
                <p className="mt-2">
                    <a href="mailto:legal@weatherly.app" className="text-orange-500 hover:underline">
                        legal@weatherly.app
                    </a>
                </p>
                <p className="mt-2">
                    Alternatively, you can reach us at:
                </p>
                <p className="mt-1">
                    Weatherly Legal Team<br />
                    c/o Weatherly Inc.<br />
                    123 Weatherly Way<br />
                    San Francisco, CA 94105<br />
                    USA
                </p>
            </Section>
        </LegalPage>
    );
}

export default Terms;