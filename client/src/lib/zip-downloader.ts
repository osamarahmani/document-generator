import JSZip from 'jszip';
import { generateCertificatePDF } from './certificate-pdf-generator';
import { generateLetterPDF } from './letter-pdf-generator'; // Make sure this path is correct

export class ZipDownloader {
  private zip: JSZip;

  constructor() {
    this.zip = new JSZip();
  }

  /**
   * Add a certificate PDF to the ZIP file
   * @param certificate Certificate data object
   */
  async addCertificatePDF(certificate: any): Promise<void> {
    try {
      const pdfBlob = await this.generateCertificatePDFBlob(certificate);
      const filename = `${certificate.certificateId.replace(/[/]/g, '_')}_${certificate.recipientName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      this.zip.file(filename, pdfBlob);
    } catch (error) {
      console.error('Error adding certificate PDF:', error);
      throw error;
    }
  }

  /**
   * Add a letter PDF to the ZIP file
   * @param letter Letter data object
   */
  async addLetterPDF(letter: any): Promise<void> {
    try {
      const pdfBlob = await this.generateLetterPDFBlob(letter);
      const filename = `${letter.letterType}_${letter.recipientName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      this.zip.file(filename, pdfBlob);
    } catch (error) {
      console.error('Error adding letter PDF:', error);
      throw error;
    }
  }

  /**
   * Download the ZIP file containing all added PDFs
   * @param filename Name for the downloaded ZIP file
   */
  async downloadZip(filename: string): Promise<void> {
    try {
      const content = await this.zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating zip:', error);
      throw error;
    }
  }

  /**
   * Generate a certificate PDF as a Blob for ZIP inclusion
   * @param certificate Certificate data
   * @returns PDF as Blob
   */
  private async generateCertificatePDFBlob(certificate: any): Promise<Blob> {
    return await generateCertificatePDF(certificate);
  }

  /**
   * Generate a letter PDF as a Blob for ZIP inclusion
   * @param letter Letter data
   * @returns PDF as Blob
   */
  private async generateLetterPDFBlob(letter: any): Promise<Blob> {
    return await generateLetterPDF(letter);
  }
}
