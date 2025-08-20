// csv-utils.ts
// ---------------------------
// Utility: convert string to camelCase
// ---------------------------
export function toCamelCase(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .replace(/[_\s\-]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ""));
}

// ---------------------------
// Generic CSV row type
// ---------------------------
export interface CSVRow {
  [key: string]: string | null;
}

// ---------------------------
// Letter types and mapping
// ---------------------------
export interface LetterData {
  recipientName: string;
  internId?: string;
  courseName: string;
  projectTitle?: string;
  startDate?: string;
  endDate?: string;
  department?: string;
  college?: string;
  duration?: string;
  position?: string; // for offer letters
}

// Enhanced field mapping function - remove this as we're using direct mapping
function mapFieldToKey(fieldName: string): string | null {
  const field = fieldName.toLowerCase().trim();
  
  // Enhanced mapping with multiple possible field names
  const fieldMappings: Record<string, string> = {
    // Recipient name variations
    'recipientname': 'recipientName',
    'recipient': 'recipientName',
    'name': 'recipientName',
    'studentname': 'recipientName',
    'student': 'recipientName',
    'internname': 'recipientName',
    
    // Intern ID variations
    'internid': 'internId',
    'intern_id': 'internId',
    'studentid': 'internId',
    'student_id': 'internId',
    'id': 'internId',
    
    // Course name variations
    'coursename': 'courseName',
    'course_name': 'courseName',
    'course': 'courseName',
    'stream': 'courseName',
    'field': 'courseName',
    'domain': 'courseName',
    
    // Project title variations
    'projecttitle': 'projectTitle',
    'project_title': 'projectTitle',
    'project': 'projectTitle',
    'title': 'projectTitle',
    'projectname': 'projectTitle',
    'project_name': 'projectTitle',
    
    // Date variations
    'startdate': 'startDate',
    'start_date': 'startDate',
    'start': 'startDate',
    'from': 'startDate',
    'fromdate': 'startDate',
    
    'enddate': 'endDate',
    'end_date': 'endDate',
    'end': 'endDate',
    'to': 'endDate',
    'todate': 'endDate',
    
    // Other fields
    'department': 'department',
    'dept': 'department',
    'college': 'college',
    'university': 'college',
    'duration': 'duration',
    'period': 'duration',
    'position': 'position',
    'role': 'position'
  };
  
  return fieldMappings[field] || null;
}

export const mapToLetterData = (row: CSVRow): LetterData => {
  const mapped: Partial<LetterData> = {};
  
  // Go through each field in the CSV row and map it to the correct property
  Object.keys(row).forEach(key => {
    const mappedKey = mapFieldToKey(key);
    if (mappedKey && row[key]) {
      (mapped as any)[mappedKey] = row[key];
    }
  });
  
  // Ensure required fields have defaults
  return {
    recipientName: mapped.recipientName || '',
    internId: mapped.internId || '',
    courseName: mapped.courseName || '',
    projectTitle: mapped.projectTitle || '',
    startDate: mapped.startDate || '',
    endDate: mapped.endDate || '',
    department: mapped.department || '',
    college: mapped.college || '',
    duration: mapped.duration || '',
    position: mapped.position || '',
  };
};

// ---------------------------
// Certificate types and mapping
// ---------------------------
export interface CertificateData {
  certificateId: string;
  recipientName: string;
  dob?: string; // only for certificates
  course: string;
  courseCode: string;
  department?: string;
  college?: string;
  content?: string;
  duration?: string;
  batchId?: string;
}

export const mapToCertificateData = (
  row: CSVRow,
  batchId?: string,
  manualDob?: string // optional manual DOB
): CertificateData => ({
  certificateId: row.certID || row.certificateId || '',
  recipientName: row.recipientName || row.name || '',
  dob: row.dob || manualDob || '', // CSV dob takes priority
  course: row.course || row.courseName || '',
  courseCode: row.courseCode || row.course_code || '',
  department: row.department || row.dept || '',
  college: row.college || row.university || '',
  content: row.content || '',
  duration: row.duration || row.period || '',
  batchId,
});

// ---------------------------
// Enhanced CSV parsing with better error handling
// ---------------------------
export const parseCSV = (csvText: string): CSVRow[] => {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];

  // Parse headers and convert to camelCase
  const headerLine = lines[0];
  let headers: string[] = [];
  
  // Handle both comma and semicolon separators
  if (headerLine.includes(';') && !headerLine.includes(',')) {
    headers = headerLine.split(';').map(h => toCamelCase(h.trim()));
  } else {
    headers = headerLine.split(',').map(h => toCamelCase(h.trim()));
  }

  const rows: CSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Use same separator as headers
    const separator = headerLine.includes(';') && !headerLine.includes(',') ? ';' : ',';
    const values = line.split(separator).map(v => v.trim().replace(/^["']|["']$/g, '')); // Remove quotes
    
    const row: CSVRow = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || null;
    });
    rows.push(row);
  }

  return rows;
};

// ---------------------------
// Enhanced CSV validation for letters
// ---------------------------
export const validateLetterCSV = (
  rows: CSVRow[],
  letterType: 'offer' | 'completion'
): string[] => {
  const errors: string[] = [];
  if (rows.length === 0) return ['CSV file is empty'];

  // Convert first row to letter data to check what fields we actually have
  const sampleData = mapToLetterData(rows[0]);
  console.log("Sample mapped data:", sampleData);

  let requiredFields: (keyof LetterData)[] = ['recipientName'];

  if (letterType === 'offer') {
    requiredFields.push('position', 'startDate', 'endDate');
  } else if (letterType === 'completion') {
    requiredFields.push('courseName', 'projectTitle', 'startDate', 'endDate');
  }

  // Check if we can map the required fields
  const mappedSample = mapToLetterData(rows[0]);
  const missingFields = requiredFields.filter(field => !mappedSample[field]);
  
  if (missingFields.length) {
    errors.push(`Cannot find required fields: ${missingFields.join(', ')}`);
    errors.push(`Available CSV headers: ${Object.keys(rows[0]).join(', ')}`);
  }

  rows.forEach((row, idx) => {
    const mapped = mapToLetterData(row);
    requiredFields.forEach(field => {
      if (!mapped[field]?.trim()) {
        errors.push(`Row ${idx + 2}: ${field} is required`);
      }
    });
  });

  return errors;
};

// ---------------------------
// CSV validation for certificates
// ---------------------------
export const validateCertificateCSV = (rows: CSVRow[]): string[] => {
  const errors: string[] = [];
  if (rows.length === 0) return ['CSV file is empty'];

  const requiredFields = ['certID', 'recipientName', 'course', 'courseCode'];
  const headers = Object.keys(rows[0]);
  const missingHeaders = requiredFields.filter(f => !headers.includes(f));
  if (missingHeaders.length) errors.push(`Missing required columns: ${missingHeaders.join(', ')}`);

  rows.forEach((row, idx) => {
    requiredFields.forEach(f => {
      if (!row[f]?.trim()) errors.push(`Row ${idx + 2}: ${f} is required`);
    });
  });

  return errors;
};