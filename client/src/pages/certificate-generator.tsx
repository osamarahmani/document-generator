import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Upload, User, Settings } from "lucide-react";
import { CertificatePreviewModal } from "@/components/certificate-preview-modal";
import { Download } from "lucide-react";


const downloadCSVTemplate = () => {
  const headers = ["Name", "certID", "Course", "Department", "College", "Content", "Duration", "DOB"];
  const csvContent = headers.join(",") + "\n"; // just header row
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "certificate_csv_template.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};


// Backend base URL from environment variable

export default function CertificateGenerator() {
  const [method, setMethod] = useState<"bulk" | "single">("single");
  const [csvFile, setCsvFile] = useState<File | null>(null);

  const [bulkCourseCode, setBulkCourseCode] = useState("");
  const [singleCourseCode, setSingleCourseCode] = useState("");

  const [previewCert, setPreviewCert] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Single certificate mutation
  const singleCertMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/apiv1/api/certificates`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to generate certificate");
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({ title: "Certificate generated successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/certificates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setPreviewCert(data);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to generate certificate",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  // Bulk certificate mutation
  const bulkCertMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch(`/apiv1/api/certificates/bulk`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to process bulk certificates");
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: `Bulk certificates generated successfully!`,
        description: `Generated ${data.count} certificates`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/certificates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/batches"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to generate bulk certificates",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const handleSingleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const data = {
      recipientName: formData.get("recipientName") as string,
      course: formData.get("course") as string,
      courseCode: singleCourseCode,
      department: formData.get("department") as string || "",
      college: formData.get("college") as string || "",
      duration: formData.get("duration") as string || "",
      content: formData.get("content") as string || "",
      dob: formData.get("dob") as string || undefined,
    };

    singleCertMutation.mutate(data);
  };

  const handleBulkSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!csvFile) {
      toast({
        title: "Please select a CSV file",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData(e.currentTarget);
    formData.append("csv", csvFile);

    bulkCertMutation.mutate(formData);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900" data-testid="page-title">
          Certificate Generator
        </h2>
        <p className="text-sm text-gray-500 mt-1" data-testid="page-subtitle">
          Create professional certificates individually or in bulk
        </p>

        {/* CSV Download Button */}
        <Button
          onClick={downloadCSVTemplate}
          variant="outline"
          className="mt-3 flex items-center space-x-2"
          data-testid="button-download-csv-template"
        >
          <Download className="h-4 w-4" />
          <span>Download CSV Template</span>
        </Button>
      </div>



      {/* Generation Method Selection */}
      <Card className="shadow-material">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Generation Method</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              variant={method === "bulk" ? "default" : "outline"}
              className="p-6 h-auto justify-start"
              onClick={() => setMethod("bulk")}
              data-testid="button-bulk-method"
            >
              <div className="text-center w-full">
                <Upload className="h-8 w-8 mx-auto mb-3" />
                <h4 className="text-lg font-medium mb-2">Bulk Generation</h4>
                <p className="text-sm opacity-70">Upload CSV for multiple certificates</p>
              </div>
            </Button>

            <Button
              variant={method === "single" ? "default" : "outline"}
              className="p-6 h-auto justify-start"
              onClick={() => setMethod("single")}
              data-testid="button-single-method"
            >
              <div className="text-center w-full">
                <User className="h-8 w-8 mx-auto mb-3" />
                <h4 className="text-lg font-medium mb-2">Individual Generation</h4>
                <p className="text-sm opacity-70">Create single certificate manually</p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Generation Form */}
      {method === "bulk" && (
        <Card className="shadow-material">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Bulk Certificate Generation</h3>
            <form onSubmit={handleBulkSubmit} className="space-y-6">
              <div>
                <Label htmlFor="csv-upload">CSV File Upload</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors mt-2">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-2">
                    Drop your CSV file here or click to browse
                  </p>
                  <Input
                    id="csv-upload"
                    type="file"
                    accept=".csv"
                    onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                    className="hidden"
                    data-testid="input-csv-upload"
                  />
                  <Button
                    type="button"
                    variant="link"
                    onClick={() => document.getElementById("csv-upload")?.click()}
                    data-testid="button-choose-file"
                  >
                    Choose File
                  </Button>
                  {csvFile && (
                    <p className="text-sm text-green-600 mt-2">
                      Selected: {csvFile.name}
                    </p>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Required columns: Name, Course, Department, College, Duration
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="courseCode">Course Code</Label>
                  <Input
                    id="courseCode"
                    name="courseCode"
                    placeholder="e.g., FSW, DSA, MOB"
                    data-testid="input-course-code"
                    value={bulkCourseCode}
                    onChange={(e) => setBulkCourseCode(e.target.value.toUpperCase())}
                  />
                </div>
                <div>
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    name="year"
                    type="number"
                    defaultValue={new Date().getFullYear()}
                    data-testid="input-year"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={bulkCertMutation.isPending}
                className="w-full"
                data-testid="button-generate-bulk"
              >
                <Settings className="h-4 w-4 mr-2" />
                {bulkCertMutation.isPending ? "Generating..." : "Generate Certificates"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Single Generation Form */}
      {method === "single" && (
        <Card className="shadow-material">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Individual Certificate Generation
            </h3>
            <form onSubmit={handleSingleSubmit} className="space-y-6">

              {/* Recipient Name + Course */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="recipientName">Recipient Name *</Label>
                  <Input
                    id="recipientName"
                    name="recipientName"
                    required
                    placeholder="Enter full name"
                    data-testid="input-recipient-name"
                  />
                </div>
                <div>
                  <Label htmlFor="course">Course *</Label>
                  <Input
                    id="course"
                    name="course"
                    required
                    placeholder="Enter course name"
                    data-testid="input-course"
                  />
                </div>
              </div>

              {/* Course Code + Department */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="courseCode">Course Code *</Label>
                  <Input
                    id="courseCode"
                    name="courseCode"
                    required
                    placeholder="Enter course code (e.g., CS101)"
                    data-testid="input-course-code"
                    value={singleCourseCode}
                    onChange={(e) => setSingleCourseCode(e.target.value.toUpperCase())}
                  />
                </div>
                <div>
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    name="department"
                    placeholder="e.g., Computer Science"
                    data-testid="input-department"
                  />
                </div>
              </div>

              {/* College + Duration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="college">College/Institution</Label>
                  <Input
                    id="college"
                    name="college"
                    placeholder="Enter institution name"
                    data-testid="input-college"
                  />
                </div>
                <div>
                  <Label htmlFor="duration">Duration</Label>
                  <Input
                    id="duration"
                    name="duration"
                    placeholder="e.g., 6 months"
                    data-testid="input-duration"
                  />
                </div>
              </div>

              {/* DOB Field */}
              <div>
                <Label htmlFor="dob">Date of Birth</Label>
                <Input
                  id="dob"
                  name="dob"
                  type="date"
                  placeholder="Select date of birth"
                  data-testid="input-dob"
                />
              </div>

              {/* Additional Content */}
              <div>
                <Label htmlFor="content">Additional Content</Label>
                <Textarea
                  id="content"
                  name="content"
                  rows={3}
                  placeholder="Any additional information for the certificate"
                  data-testid="textarea-content"
                />
              </div>

              {/* Submit Button */}
              <div className="flex space-x-4">
                <Button
                  type="submit"
                  disabled={singleCertMutation.isPending}
                  className="flex-1"
                  data-testid="button-generate-single"
                >
                  <User className="h-4 w-4 mr-2" />
                  {singleCertMutation.isPending
                    ? "Generating..."
                    : "Generate Certificate"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}


      {/* Preview Modal */}
      {previewCert && (
        <CertificatePreviewModal
          certificate={previewCert}
          isOpen={!!previewCert}
          onClose={() => setPreviewCert(null)}
        />
      )}
    </div>
  );
}
