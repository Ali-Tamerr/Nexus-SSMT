export interface TermsSection {
  id: string;
  title: string;
  content: string[];
}

export const LAST_UPDATED = 'September 2026';

export const TERMS_SECTIONS: TermsSection[] = [
  {
    id: 'acceptance',
    title: '1. Acceptance of Terms',
    content: [
      'By accessing or using Nexus (the "Social Study Mapping Tool", "we", "our", or "the platform"), whether through a registered account, Google OAuth authentication, or the local guest workspace, you agree to be bound by these Terms and Conditions.',
      'If you do not agree with any portion of these Terms, you should not access or use the platform.',
    ],
  },
  {
    id: 'description',
    title: '2. Description of the Service',
    content: [
      'Nexus is an interactive visual knowledge graph and study mapping platform that helps students, researchers, and teams organize concepts, ideas, and notes into dynamic, interconnected graphs.',
      'Nexus provides both a cloud-synchronized mode (for registered users to access real-time collaboration and cloud backup) and an offline Local Workspace mode (for users who prefer zero-login local storage).',
    ],
  },
  {
    id: 'data-privacy',
    title: '3. Data Privacy and Treatment',
    content: [
      'Zero Data Selling: We respect your privacy. We never sell, rent, monetize, or share your personal information, notes, or graph data with third-party advertisers or data brokers.',
      'Local Workspace Privacy: When using the Local Workspace mode without an account, all graphs, nodes, links, and drawings are stored entirely in your local browser storage (localStorage). None of this data is transmitted to or stored on our servers.',
      'Cloud Workspace Storage: When you create a registered account, your graph data, nodes, and account profile are stored securely on our backend servers solely to provide you with access across devices and enable collaborative features you choose to use.',
    ],
  },
  {
    id: 'accounts-oauth',
    title: '4. Accounts and Google Authentication',
    content: [
      'You may register an account using your email address and password, or by signing in through Google OAuth.',
      'Google OAuth Integration: Signing in with Google is provided strictly as a convenient, secure alternative to traditional email account creation. Data obtained through Google OAuth (such as your email and display name) is treated with the exact same privacy standards as email-based accounts and is used solely for account identification and profile display.',
      'You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account.',
    ],
  },
  {
    id: 'ownership',
    title: '5. User Content and Intellectual Property',
    content: [
      '100% User Ownership: You retain complete and full ownership, copyright, and all intellectual property rights to all study notes, graph structures, attachments, and content you create or upload to Nexus.',
      'Limited Service License: By creating or storing content on our cloud platform, you grant Nexus only the narrow, non-exclusive technical license required to host, store, process, and display your content to you and your authorized collaborators.',
      'You may delete your projects, nodes, or account at any time, which removes your data from active service databases.',
    ],
  },
  {
    id: 'acceptable-use',
    title: '6. Acceptable Use',
    content: [
      'You agree not to use Nexus for any unlawful purpose, to transmit malicious software, or to attempt to reverse engineer, disrupt, or overload the platform infrastructure.',
      'We reserve the right to suspend or terminate accounts that violate these terms or abuse service resources.',
    ],
  },
  {
    id: 'disclaimer',
    title: '7. Disclaimer of Warranties and Limitation of Liability',
    content: [
      'Nexus is provided on an "AS IS" and "AS AVAILABLE" basis without warranties of any kind, whether express or implied.',
      'While we strive for high reliability and data integrity, we recommend that users maintain local backups of critical study materials. To the fullest extent permitted by law, Nexus and its contributors shall not be liable for any indirect, incidental, or consequential damages resulting from your use of the service.',
    ],
  },
  {
    id: 'modifications',
    title: '8. Changes to Terms',
    content: [
      'We may update these Terms from time to time. If changes are material, we will update the "Last Updated" date at the top of this document. Continued use of Nexus after modifications constitutes acceptance of the revised Terms.',
    ],
  },
];
