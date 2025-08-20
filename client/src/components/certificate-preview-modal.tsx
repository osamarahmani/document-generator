import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Award, Download, X } from "lucide-react";
import { generateCertificatePDF } from "@/lib/certificate-pdf-generator";
import dayjs from "dayjs";

interface CertificatePreviewModalProps {
  certificate: any;
  isOpen: boolean;
  onClose: () => void;
}

export const CertificatePreviewModal = ({
  certificate,
  isOpen,
  onClose
}: CertificatePreviewModalProps) => {
  const handleDownload = async () => {
    try {
      await generateCertificatePDF(certificate);
    } catch (error) {
      console.error("Failed to download certificate:", error);
    }
  };

  // Decide what content to show - matching generator logic exactly
  const certificateContent = 
    certificate.content && certificate.content.trim().length > 0
      ? certificate.content
      : `Successfully completed internship on ${certificate.course}`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-full h-fit" data-testid="certificate-preview-modal">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>Certificate Preview</DialogTitle>
        </DialogHeader>

        <div
          className="relative shadow-2xl border mx-auto"
          style={{
            width: "100%",
            maxWidth: "900px", // Fit nicely in modal
            aspectRatio: "1123/794", // Maintain A4 landscape ratio
            backgroundImage: "url('/BGF.png')", // Matching generator background
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
          data-testid="certificate-preview"
        >
          {/* Outer Border - matching generator exactly */}
          <div 
            className="absolute"
            style={{
              top: '11px',
              left: '11px',
              right: '11px',
              bottom: '11px',
              border: '10px solid rgb(18, 24, 66)' // Matching generator color
            }}
          ></div>
          
          {/* Inner Border - matching generator exactly */}
          <div 
            className="absolute"
            style={{
              top: '27px',
              left: '27px',
              right: '27px',
              bottom: '27px',
              border: '1.5px solid rgb(2, 132, 199)' // sky-600 matching generator
            }}
          ></div>

          {/* Certificate Content */}
          <div className="relative z-10 w-full h-full">
            {/* Title - exactly matching generator */}
            <div className="absolute w-full" style={{ top: '20.2%' }}>
              <h1 
                className="font-bold text-center"
                style={{ 
                  fontSize: 'clamp(16px, 2.5vw, 28px)',
                  color: 'rgb(18, 24, 66)', // Matching generator color
                  fontFamily: 'Arial, sans-serif'
                }}
              >
                CERTIFICATE OF COMPLETION
              </h1>
            </div>

            {/* Subtitle - exactly matching generator */}
            <div className="absolute w-full" style={{ top: '26.5%' }}>
              <p 
                className="text-center"
                style={{
                  fontSize: 'clamp(10px, 1.2vw, 14px)',
                  color: 'rgb(100, 116, 139)', // Matching generator color
                  fontFamily: 'Arial, sans-serif'
                }}
              >
                This is to certify that
              </p>
            </div>

            {/* Student Name - exactly matching generator with yOffset */}
            <div className="absolute w-full" style={{ top: '32%' }}>
              <h2 
                className="font-bold text-center"
                style={{
                  fontSize: 'clamp(20px, 3.2vw, 36px)',
                  color: 'rgb(4, 40, 91)', // Matching generator color
                  fontFamily: 'Arial, sans-serif'
                }}
                data-testid="preview-recipient-name"
              >
                {certificate.recipientName}
              </h2>
            </div>

            {/* Decorative Line - exactly matching generator position and width */}
            <div
              style={{
                position: "absolute",
                top: "39%", // Further below the name
                left: "50%",
                transform: "translateX(-50%)",
                width: "31.2%", // 350px/1123px ratio from generator
                borderTop: "2px solid black",
              }}
            ></div>

            {/* Body Text - exactly matching generator logic and position */}
            <div className="absolute w-full" style={{ top: '41%' }}>
              <p 
                className="text-center px-12"
                style={{
                  fontSize: 'clamp(12px, 1.4vw, 16px)',
                  color: 'rgb(51, 65, 85)', // Matching generator color
                  fontFamily: 'Arial, sans-serif',
                  lineHeight: '1.5'
                }}
                data-testid="preview-content"
              >
                {certificateContent}
              </p>
            </div>

            {/* Duration and Department - exactly matching generator */}
            <div className="absolute w-full" style={{ top: '44.5%' }}>
              <p 
                className="text-center"
                style={{
                  fontSize: 'clamp(10px, 1.2vw, 14px)',
                  color: 'rgb(51, 65, 85)', // Matching generator color
                  fontFamily: 'Arial, sans-serif'
                }}
              >
                Duration: {certificate.duration} | Department: {certificate.department}
              </p>
            </div>

            {/* Certificate ID and Issue Date - exactly matching generator position */}
            <div 
              className="absolute text-left"
              style={{
                bottom: '8.8%',
                left: '3.6%',
                fontSize: 'clamp(8px, 0.9vw, 10px)',
                color: 'rgb(71, 85, 105)', // Matching generator color
                fontFamily: 'Courier, monospace', // Matching generator font
                lineHeight: '1.5'
              }}
            >
              <p>Certificate ID: <span data-testid="preview-certificate-id">{certificate.certificateId}</span></p>
              <p>Issue Date: {dayjs(certificate.createdAt ?? Date.now()).format("DD/MM/YYYY")}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};