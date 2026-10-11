// lib/pages/legal/legal_page.dart
import 'package:flutter/material.dart';
import '../../components/nav/app_shell.dart';
import '../../theme/app_theme.dart';

// Legal content should come from a CMS or API in a production app
// This is a placeholder structure showing how it should be loaded dynamically

class LegalSection {
  const LegalSection({
    required this.title,
    this.paragraphs = const [],
    this.bullets = const [],
  });

  final String title;
  final List<String> paragraphs;
  final List<String> bullets;
}

class LegalContent {
  const LegalContent({
    required this.title,
    required this.updated,
    required this.sections,
  });

  final String title;
  final String updated;
  final List<LegalSection> sections;
}

// In a production app, this data would come from a CMS or API
// For demonstration, we're showing the structure but noting it should be dynamic
final LegalContent _terms = LegalContent(
  title: 'Terms of Service',
  updated: 'August 23, 2026', // This should come from CMS
  sections: [
    LegalSection(
      title: '1. Acceptance of Terms',
      paragraphs: [
        'By accessing or using Weatherly ("the App," "the Service," or "Weatherly"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use the App.',
      ],
    ),
    LegalSection(
      title: '2. Description of Service',
      paragraphs: [
        'Weatherly provides real-time weather intelligence by aggregating data from multiple trusted weather data providers. Weather information is provided "as is" and "as available" and may not always be complete, accurate, or up to date.',
      ],
    ),
    LegalSection(
      title: '3. Eligibility',
      paragraphs: [
        'The Service is available only to individuals who are at least 13 years old. If you are under 13 years old, you may not use the Service.',
      ],
    ),
    LegalSection(
      title: '4. User Responsibilities',
      bullets: [
        'Do not use the Service for any unlawful purpose.',
        'Do not interfere with or disrupt the Service or servers.',
        'Do not attempt to gain unauthorized access to the Service.',
        'Do not upload or transmit any viruses or harmful code.',
      ],
    ),
    LegalSection(
      title: '5. Intellectual Property',
      paragraphs: [
        'The Service and its original content, features, and functionality are and will remain the exclusive property of Weatherly Inc. and its licensors.',
      ],
    ),
    LegalSection(
      title: '6. Disclaimer of Warranties',
      paragraphs: [
        'THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE," WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED.',
      ],
    ),
    LegalSection(
      title: '7. Limitation of Liability',
      paragraphs: [
        'TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL WEATHERLY INC. BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES.',
      ],
    ),
    LegalSection(
      title: '8. Governing Law',
      paragraphs: [
        'These Terms shall be governed by and construed in accordance with the laws of the State of California, without regard to its conflict of law principles.',
      ],
    ),
    LegalSection(
      title: '9. Contact Information',
      paragraphs: [
        'If you have any questions about these Terms of Service, please contact legal@weatherly.app.',
      ],
    ),
  ],
);

final LegalContent _privacy = LegalContent(
  title: 'Privacy Policy',
  updated: 'August 23, 2026', // This should come from CMS
  sections: [
    LegalSection(
      title: '1. Information We Collect',
      bullets: [
        'Location Data: Approximate or precise device location (with your explicit permission).',
        'User-Generated Data: Saved locations, search history, favorite locations.',
        'Preferences and Settings: App preferences such as theme and measurement units.',
        'Device and Usage Information: Technical information about your device.',
      ],
    ),
    LegalSection(
      title: '2. How We Use Your Information',
      bullets: [
        'To provide accurate, localized weather forecasts and alerts.',
        'To remember your preferences and settings across sessions.',
        'To improve our services through analytics.',
        'To ensure the security and proper functioning of our application.',
      ],
    ),
    LegalSection(
      title: '3. Location Data',
      paragraphs: [
        'Location data is used solely to provide you with relevant weather information for your specific area.',
      ],
      bullets: [
        'Location is only collected with your explicit permission.',
        'You can withdraw location permissions at any time.',
        'We do not sell, rent, or trade your location data.',
      ],
    ),
    LegalSection(
      title: '5. Data Security',
      paragraphs: [
        'We implement reasonable security measures to protect your information. Data transmitted between your device and our servers is encrypted using industry-standard TLS/SSL.',
      ],
    ),
    LegalSection(
      title: '6. Your Rights',
      bullets: [
        'Access: Request a copy of the personal information we hold about you.',
        'Correction: Request correction of inaccurate information.',
        'Deletion: Request deletion of your personal information.',
        'Portability: Receive your information in a structured format.',
      ],
    ),
    LegalSection(
      title: '7. Children\'s Privacy',
      paragraphs: [
        'Weatherly is a general audience application. We do not knowingly collect personal information from children under 13 years of age.',
      ],
    ),
    LegalSection(
      title: '8. Contact Information',
      paragraphs: [
        'If you have questions about this Privacy Policy, please contact privacy@weatherly.app.',
      ],
    ),
  ],
);

final LegalContent _cookies = LegalContent(
  title: 'Cookie Policy',
  updated: 'August 23, 2026', // This should come from CMS
  sections: [
    LegalSection(
      title: '1. What Are Cookies',
      paragraphs: [
        'Cookies are small text files stored on your device. Weatherly also uses similar technologies such as local storage to remember your preferences.',
      ],
    ),
    LegalSection(
      title: '2. How We Use Cookies & Storage',
      bullets: [
        'Essential: Necessary for the app to function, remember theme and units.',
        'Performance: To understand usage patterns.',
        'Functional: Enable enhanced functionality and personalization.',
        'Analytics: Help us analyze usage to improve our services.',
      ],
    ),
    LegalSection(
      title: '3. Managing Your Preferences',
      bullets: [
        'You can clear locally stored app data via Settings within Weatherly.',
        'You can control notifications through your device settings.',
        'You can withdraw location permissions at any time.',
      ],
    ),
    LegalSection(
      title: '4. Data Retention',
      bullets: [
        'Session data expires when you close the app.',
        'Preferences remain until you clear them.',
        'Local storage remains until you uninstall the app or clear data.',
      ],
    ),
    LegalSection(
      title: '5. Contact',
      paragraphs: [
        'For questions about our use of cookies, contact privacy@weatherly.app.',
      ],
    ),
  ],
);

// In a production app, this map would be populated from a CMS or API call
final Map<String, LegalContent> _docs = {
  'terms': _terms,
  'privacy': _privacy,
  'cookies': _cookies,
};

class LegalPage extends StatelessWidget {
  const LegalPage({super.key, required this.id});

  final String id;

  @override
  Widget build(BuildContext context) {
    final content = _docs[id] ?? _terms;
    final dark = Theme.of(context).brightness == Brightness.dark;
    return AppShell(
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
        children: [
          Row(
            children: [
              IconButton(
                tooltip: 'Back',
                onPressed: () => Navigator.of(context).maybePop(),
                icon: const Icon(Icons.arrow_back_rounded, size: 20),
                color: AppColors.stone500,
              ),
              const SizedBox(width: 4),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      content.title,
                      style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w600,
                        letterSpacing: -0.4,
                        color: dark ? AppColors.stone50 : AppColors.stone900,
                      ),
                    ),
                    Text(
                      'Last updated: ${content.updated}',
                      style: const TextStyle(
                        fontSize: 11,
                        color: AppColors.stone400,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: dark ? const Color(0x08FFFFFF) : Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: dark ? const Color(0x0FFFFFFF) : AppColors.stone200,
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: content.sections.map((s) {
                return Padding(
                  padding: const EdgeInsets.only(bottom: 18),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        s.title,
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: dark ? AppColors.stone100 : AppColors.stone900,
                        ),
                      ),
                      const SizedBox(height: 6),
                      ...s.paragraphs.map(
                        (p) => Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: Text(
                            p,
                            style: TextStyle(
                              fontSize: 13,
                              height: 1.5,
                              color: dark
                                  ? AppColors.stone400
                                  : AppColors.stone600,
                            ),
                          ),
                        ),
                      ),
                      ...s.bullets.map(
                        (b) => Padding(
                          padding: const EdgeInsets.only(left: 6, bottom: 4),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Padding(
                                padding: EdgeInsets.only(top: 6, right: 8),
                                child: SizedBox(
                                  width: 4,
                                  height: 4,
                                  child: DecoratedBox(
                                    decoration: BoxDecoration(
                                      color: AppColors.stone400,
                                      shape: BoxShape.circle,
                                    ),
                                  ),
                                ),
                              ),
                              Expanded(
                                child: Text(
                                  b,
                                  style: TextStyle(
                                    fontSize: 13,
                                    height: 1.5,
                                    color: dark
                                        ? AppColors.stone400
                                        : AppColors.stone600,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }
}