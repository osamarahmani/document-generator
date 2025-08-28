import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Upload, Edit, Handshake, GraduationCap } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Download } from "lucide-react";





export default function LetterGenerator() {
  const [letterType, setLetterType] = useState<"offer" | "completion">("offer");
  const [method, setMethod] = useState<"bulk" | "single">("single");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const singleLetterMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/apiv1/api/letters`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to generate letter");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Letter generated successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/letters"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to generate letter",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const bulkLetterMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch(`/apiv1/api/letters/bulk`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to process bulk letters");
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: `Bulk letters generated successfully!`,
        description: `Generated ${data.count} letters`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/letters"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/batches"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to generate bulk letters",
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
      email: formData.get("email") as string,
      letterType,
      position: formData.get("position") as string,
      department: formData.get("department") as string,
      startDate: formData.get("startDate") as string,
      endDate: formData.get("endDate") as string,
      stipend: formData.get("stipend") as string,
      courseName: formData.get("courseName") as string,
      duration: formData.get("duration") as string,
      completionDate: formData.get("completionDate") as string,
      grade: formData.get("grade") as string,
      notes: formData.get("notes") as string,

      // ✅ Add missing fields
      projectTitle: formData.get("projectTitle") as string,
      internId: formData.get("internId") as string,
    };


    singleLetterMutation.mutate(data);
  };

  const handleBulkSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!csvFile) {
      toast({
        title: "Please select a CSV file",
        variant: "destructive"
      });
      return;
    }

    const formData = new FormData();
    formData.append("csv", csvFile);
    formData.append("letterType", letterType);

    bulkLetterMutation.mutate(formData);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2
          className="text-2xl font-semibold text-gray-900"
          data-testid="page-title"
        >
          Letter Generator
        </h2>
        <p
          className="text-sm text-gray-500 mt-1"
          data-testid="page-subtitle"
        >
          Generate offer letters and completion Letter
        </p>

        {/* CSV Download Button */}
        <Button
          onClick={() => {
            const headers = [
              "recipientName",
              "courseName",
              "startDate",
              "endDate",
              "completionDate",
              "projectTitle"
            ];
            const csvContent = headers.join(",") + "\n";
            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", "letter_template.csv");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }}
          variant="outline"
          className="mt-3 flex items-center space-x-2"
          data-testid="button-download-letter-template"
        >
          <Download className="h-4 w-4" />  
          <span>Download CSV Template</span>
        </Button>

       
      </div>


      {/* Letter Type Selection */}
      <Card className="shadow-material">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Letter Type</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              variant={letterType === "offer" ? "default" : "outline"}
              className="p-6 h-auto justify-start"
              onClick={() => setLetterType("offer")}
              data-testid="button-offer-letter"
            >
              <div className="text-center w-full">
                <Handshake className="h-8 w-8 mx-auto mb-3" />
                <h4 className="text-lg font-medium mb-2">Offer Letter</h4>
                <p className="text-sm opacity-70">Generate internship offer letters</p>
              </div>
            </Button>

            <Button
              variant={letterType === "completion" ? "default" : "outline"}
              className="p-6 h-auto justify-start"
              onClick={() => setLetterType("completion")}
              data-testid="button-completion-letter"
            >
              <div className="text-center w-full">
                <GraduationCap className="h-8 w-8 mx-auto mb-3" />
                <h4 className="text-lg font-medium mb-2">Completion Letter</h4>
                <p className="text-sm opacity-70">Generate course completion letters</p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Generation Method Selection */}
      <Card className="shadow-material">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Generation Method</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              variant={method === "bulk" ? "default" : "outline"}
              className="p-4 h-auto justify-start"
              onClick={() => setMethod("bulk")}
              data-testid="button-bulk-generation"
            >
              <div className="flex items-center space-x-3">
                <Upload className="h-6 w-6" />
                <div>
                  <h4 className="font-medium">Bulk Generation</h4>
                  <p className="text-sm opacity-70">Upload CSV for multiple letters</p>
                </div>
              </div>
            </Button>

            <Button
              variant={method === "single" ? "default" : "outline"}
              className="p-4 h-auto justify-start"
              onClick={() => setMethod("single")}
              data-testid="button-single-generation"
            >
              <div className="flex items-center space-x-3">
                <Edit className="h-6 w-6" />
                <div>
                  <h4 className="font-medium">Individual Generation</h4>
                  <p className="text-sm opacity-70">Create single letter manually</p>
                </div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Generation Form */}
      {method === "bulk" && (
        <Card className="shadow-material">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Bulk Letter Generation</h3>
            <form onSubmit={handleBulkSubmit} className="space-y-6">
              <div>
                <Label htmlFor="letter-csv-upload">CSV File Upload</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors mt-2">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-2">
                    Drop your CSV file here or click to browse
                  </p>
                  <Input
                    id="letter-csv-upload"
                    type="file"
                    accept=".csv"
                    onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                    className="hidden"
                    data-testid="input-letter-csv"
                  />
                  <Button
                    type="button"
                    variant="link"
                    onClick={() => document.getElementById("letter-csv-upload")?.click()}
                    data-testid="button-choose-letter-file"
                  >
                    Choose File
                  </Button>
                  {csvFile && (
                    <p className="text-sm text-green-600 mt-2">
                      Selected: {csvFile.name}
                    </p>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                disabled={bulkLetterMutation.isPending}
                className="w-full"
                data-testid="button-generate-bulk-letters"
              >
                <Upload className="h-4 w-4 mr-2" />
                {bulkLetterMutation.isPending ? "Generating..." : "Generate Letters"}
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
              Individual {letterType === "offer" ? "Offer Letter" : "Completion Certificate"} Generation
            </h3>
            <form onSubmit={handleSingleSubmit} className="space-y-6">

              {/* Common field for both */}
              <div>
                <Label htmlFor="recipientName">Recipient Name *</Label>
                <Input
                  id="recipientName"
                  name="recipientName"
                  required
                  placeholder="Enter full name"
                  data-testid="input-letter-recipient-name"
                />
              </div>

              {/* Offer Letter fields according to CSV header */}
              {letterType === "offer" && (
                <>
                  <div>
                    <Label htmlFor="courseName">Course Name *</Label>
                    <Input
                      id="courseName"
                      name="courseName"
                      required
                      placeholder="Enter course name"
                      data-testid="input-course-name"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startDate">Start Date *</Label>
                      <Input
                        id="startDate"
                        name="startDate"
                        type="date"
                        required
                        data-testid="input-start-date"
                      />
                    </div>
                    <div>
                      <Label htmlFor="endDate">End Date *</Label>
                      <Input
                        id="endDate"
                        name="endDate"
                        type="date"
                        required
                        data-testid="input-end-date"
                      />
                    </div>
                  </div>

                  {/* <div>
                    <Label htmlFor="completionDate">Completion Date</Label>
                    <Input
                      id="completionDate"
                      name="completionDate"
                      type="date"
                      data-testid="input-completion-date"
                    />
                  </div> */}
                </>
              )}

              {/* Completion Certificate fields according to CSV header */}
              {letterType === "completion" && (
                <>
                  {/* <div>
                    <Label htmlFor="internId">Intern ID *</Label>
                    <Input
                      id="internId"
                      name="internId"
                      required
                      placeholder="Enter intern ID"
                      data-testid="input-intern-id"
                    />
                  </div> */}

                  <div>
                    <Label htmlFor="courseName">Course Name *</Label>
                    <Input
                      id="courseName"
                      name="courseName" // ✅ camelCase to match generator
                      required
                      placeholder="Enter course name"
                      data-testid="input-course-name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="projectTitle">Project Title</Label>
                    <Input
                      id="projectTitle"
                      name="projectTitle"
                      placeholder="Enter project title (optional)"
                      data-testid="input-project-title"
                    />
                  </div>


                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startDate">Start Date *</Label>
                      <Input
                        id="startDate"
                        name="startDate" // ✅ matches generator
                        type="date"
                        required
                        data-testid="input-start-date"
                      />
                    </div>
                    <div>
                      <Label htmlFor="endDate">End Date *</Label>
                      <Input
                        id="endDate"
                        name="endDate" // ✅ matches generator
                        type="date"
                        required
                        data-testid="input-end-date"
                      />
                    </div>
                  </div>
                </>
              )}


              <div>
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  placeholder="Any additional information for the letter"
                  data-testid="textarea-notes"
                />
              </div>

              <div className="flex space-x-4">
                <Button
                  type="submit"
                  disabled={singleLetterMutation.isPending}
                  className="flex-1"
                  data-testid="button-generate-single-letter"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  {singleLetterMutation.isPending ? "Generating..." : "Generate Letter"}
                </Button>
              </div>

            </form>
          </CardContent>
        </Card>
      )}

    </div>
  );
}
