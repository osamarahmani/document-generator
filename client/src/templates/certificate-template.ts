// Certificate Template Configuration
// This file contains all certificate template settings for easy modification

export interface CertificateData {
  certificateId: string;
  recipientName: string;
  course: string;
  department?: string;
  college?: string;
  duration?: string;
  content?: string;
  createdAt?: string;
}

export interface CertificateTemplate {
  // Page settings
  pageFormat: 'a4' | 'letter';
  orientation: 'portrait' | 'landscape';
  
  // Colors (RGB values)
  colors: {
    primary: [number, number, number];
    secondary: [number, number, number];
    text: [number, number, number];
    border: [number, number, number];
    background: [number, number, number];
  };
  
  // Fonts
  fonts: {
    title: { size: number; weight: 'normal' | 'bold' };
    subtitle: { size: number; weight: 'normal' | 'bold' };
    name: { size: number; weight: 'normal' | 'bold' };
    body: { size: number; weight: 'normal' | 'bold' };
    small: { size: number; weight: 'normal' | 'bold' };
  };
  
  // Layout
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  
  // Content
  title: string;
  institution: {
    name: string;
    subtitle?: string;
    logo?: string;
  };
  
  // Positioning (in mm for landscape A4: 297x210)
  positions: {
    title: { x: number; y: number };
    certificateId: { x: number; y: number };
    recipientName: { x: number; y: number };
    course: { x: number; y: number };
    details: { x: number; y: number };
    date: { x: number; y: number };
    signature: { x: number; y: number };
  };
}

// Default Professional Certificate Template
export const defaultCertificateTemplate: CertificateTemplate = {
  pageFormat: 'a4',
  orientation: 'landscape',
  
  colors: {
    primary: [41, 128, 185],     // Professional blue
    secondary: [52, 152, 219],   // Lighter blue
    text: [60, 60, 60],          // Dark gray
    border: [41, 128, 185],      // Same as primary
    background: [255, 255, 255]  // White
  },
  
  fonts: {
    title: { size: 32, weight: 'bold' },
    subtitle: { size: 14, weight: 'normal' },
    name: { size: 24, weight: 'bold' },
    body: { size: 14, weight: 'normal' },
    small: { size: 10, weight: 'normal' }
  },
  
  margins: {
    top: 10,
    bottom: 10,
    left: 10,
    right: 10
  },
  
  title: 'CERTIFICATE OF COMPLETION',
  
  institution: {
    name: 'TechReady Institute',
    subtitle: 'Excellence in Technology Education'
  },
  
  positions: {
    title: { x: 148.5, y: 40 },           // Center of page
    certificateId: { x: 20, y: 25 },       // Top left
    recipientName: { x: 148.5, y: 85 },    // Center
    course: { x: 148.5, y: 125 },          // Center
    details: { x: 148.5, y: 140 },         // Center
    date: { x: 148.5, y: 185 },            // Bottom center
    signature: { x: 200, y: 170 }          // Bottom right
  }
};

// Alternative templates can be added here
export const modernCertificateTemplate: CertificateTemplate = {
  ...defaultCertificateTemplate,
  colors: {
    primary: [46, 204, 113],     // Green
    secondary: [39, 174, 96],    // Darker green
    text: [44, 62, 80],          // Dark blue-gray
    border: [46, 204, 113],      // Green
    background: [255, 255, 255]  // White
  },
  title: 'ACHIEVEMENT CERTIFICATE'
};

export const elegantCertificateTemplate: CertificateTemplate = {
  ...defaultCertificateTemplate,
  colors: {
    primary: [155, 89, 182],     // Purple
    secondary: [142, 68, 173],   // Darker purple
    text: [52, 73, 94],          // Dark gray
    border: [155, 89, 182],      // Purple
    background: [255, 255, 255]  // White
  },
  title: 'CERTIFICATE OF EXCELLENCE'
};