// Letter Template Configuration
// This file contains all letter template settings for easy modification

export interface LetterData {
  recipientName: string;
  position: string;
  department: string;
  courseName: string;
  duration: string;
  startDate?: string;
  completionDate?: string;
  letterType: 'offer' | 'completion';
  createdAt?: string;
}

export interface LetterTemplate {
  // Page settings
  pageFormat: 'a4' | 'letter';
  orientation: 'portrait' | 'landscape';
  
  // Colors (RGB values)
  colors: {
    primary: [number, number, number];
    text: [number, number, number];
    accent: [number, number, number];
  };
  
  // Fonts
  fonts: {
    header: { size: number; weight: 'normal' | 'bold' };
    title: { size: number; weight: 'normal' | 'bold' };
    body: { size: number; weight: 'normal' | 'bold' };
    small: { size: number; weight: 'normal' | 'bold' };
  };
  
  // Content
  institution: {
    name: string;
    subtitle: string;
    contact: {
      website: string;
      email: string;
      phone?: string;
      address?: string;
    };
  };
  
  // Letter content templates
  content: {
    offer: {
      greeting: string;
      opening: string;
      body: string;
      closing: string;
    };
    completion: {
      greeting: string;
      opening: string;
      body: string;
      closing: string;
    };
  };
  
  // Signature
  signature: {
    name: string;
    title: string;
    department: string;
  };
}

// Default Professional Letter Template
export const defaultLetterTemplate: LetterTemplate = {
  pageFormat: 'a4',
  orientation: 'portrait',
  
  colors: {
    primary: [41, 128, 185],     // Professional blue
    text: [60, 60, 60],          // Dark gray
    accent: [52, 152, 219]       // Lighter blue
  },
  
  fonts: {
    header: { size: 16, weight: 'bold' },
    title: { size: 12, weight: 'bold' },
    body: { size: 11, weight: 'normal' },
    small: { size: 10, weight: 'normal' }
  },
  
  institution: {
    name: 'TechReady Institute',
    subtitle: 'Excellence in Technology Education',
    contact: {
      website: 'www.techready.edu',
      email: 'contact@techready.edu',
      phone: '+1 (555) 123-4567',
      address: '123 Tech Street, Innovation City, TC 12345'
    }
  },
  
  content: {
    offer: {
      greeting: 'Dear {recipientName},',
      opening: 'We are pleased to offer you an internship position as {position} in our {department} department.',
      body: `This internship will provide you with valuable hands-on experience in {courseName} and will help you develop practical skills in the field.

Duration: {duration}
Start Date: {startDate}
Department: {department}

During your internship, you will:
• Gain practical experience in {courseName}
• Work with experienced professionals in the field
• Develop industry-relevant skills
• Contribute to real-world projects

We look forward to having you as part of our team and supporting your professional development.`,
      closing: 'We are excited to welcome you to TechReady Institute and look forward to a successful internship experience.'
    },
    completion: {
      greeting: 'Dear {recipientName},',
      opening: 'We are pleased to confirm that you have successfully completed your internship as {position} in our {department} department.',
      body: `During your internship period, you have demonstrated excellent skills and dedication in {courseName}.

Duration: {duration}
Completion Date: {completionDate}
Department: {department}

Throughout your internship, you have:
• Successfully completed all assigned projects
• Demonstrated strong technical skills in {courseName}
• Shown excellent teamwork and communication abilities
• Contributed meaningfully to our department's objectives

Your dedication and professionalism have been exemplary, and we are confident that the skills and experience you have gained will serve you well in your future career.`,
      closing: 'We wish you all the best in your future endeavors and hope our paths cross again in the professional world.'
    }
  },
  
  signature: {
    name: 'Dr. Sarah Johnson',
    title: 'Director of Internship Programs',
    department: 'Human Resources Department'
  }
};

// Modern Letter Template
export const modernLetterTemplate: LetterTemplate = {
  ...defaultLetterTemplate,
  colors: {
    primary: [46, 204, 113],     // Green
    text: [44, 62, 80],          // Dark blue-gray
    accent: [39, 174, 96]        // Darker green
  },
  institution: {
    ...defaultLetterTemplate.institution,
    name: 'TechReady Innovation Hub',
    subtitle: 'Transforming Future Tech Leaders'
  }
};

// Corporate Letter Template
export const corporateLetterTemplate: LetterTemplate = {
  ...defaultLetterTemplate,
  colors: {
    primary: [52, 73, 94],       // Dark gray
    text: [60, 60, 60],          // Medium gray
    accent: [149, 165, 166]      // Light gray
  },
  institution: {
    ...defaultLetterTemplate.institution,
    name: 'TechReady Corporation',
    subtitle: 'Professional Development Excellence'
  }
};