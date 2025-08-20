import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Award, FileText, Search, Filter, Eye, Download, LayersIcon } from "lucide-react";
import { generateCertificatePDF } from "@/lib/certificate-pdf-generator";
import { generateLetterPDF } from "@/lib/letter-pdf-generator";
import { ZipDownloader } from "@/lib/zip-downloader";
import { CertificatePreviewModal } from "@/components/certificate-preview-modal";

const PAGE_SIZE = 20;

export default function ViewDocuments() {
  const [activeTab, setActiveTab] = useState<"certificates" | "letters" | "batches">("certificates");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [previewCert, setPreviewCert] = useState<any>(null);

  const [certPage, setCertPage] = useState(0);
  const [letterPage, setLetterPage] = useState(0);
  const [batchPage, setBatchPage] = useState(0);

  const fetchDocuments = async (url: string, page: number) => {
    const offset = page * PAGE_SIZE;
    const res = await fetch(`/apiv1${url}&limit=${PAGE_SIZE}&offset=${offset}`);
    if (!res.ok) throw new Error("Failed to fetch documents");
    return res.json();
  };

  const { data: certificates, isLoading: certLoading } = useQuery({
    queryKey: ["/api/certificates", search, certPage],
    queryFn: () => fetchDocuments(`/api/certificates?search=${encodeURIComponent(search)}`, certPage),
  });

  const { data: letters, isLoading: letterLoading } = useQuery({
    queryKey: ["/api/letters", search, letterPage],
    queryFn: () => fetchDocuments(`/api/letters?search=${encodeURIComponent(search)}`, letterPage),
  });

  const { data: batchesData, isLoading: batchLoading } = useQuery({
    queryKey: ["/api/batches", batchPage],
    queryFn: async () => {
      const offset = batchPage * PAGE_SIZE;
      const res = await fetch(`/apiv1/api/batches?limit=${PAGE_SIZE}&offset=${offset}`);
      if (!res.ok) throw new Error("Failed to fetch batches");
      return res.json();
    },
  });

  const filteredCertificates = (certificates || []).filter(
    (cert: any) => typeFilter === "all" || typeFilter === "certificate"
  );

  const filteredLetters = (letters || []).filter((letter: any) => {
    if (typeFilter === "all") return true;
    if (typeFilter === "certificate") return false;
    return letter.letterType === typeFilter;
  });

  const handleNextPage = () => {
    if (activeTab === "certificates") setCertPage(prev => prev + 1);
    else if (activeTab === "letters") setLetterPage(prev => prev + 1);
    else setBatchPage(prev => prev + 1);
  };

  const handlePrevPage = () => {
    if (activeTab === "certificates") setCertPage(prev => Math.max(prev - 1, 0));
    else if (activeTab === "letters") setLetterPage(prev => Math.max(prev - 1, 0));
    else setBatchPage(prev => Math.max(prev - 1, 0));
  };

  const handleDownloadCertificate = async (certificate: any) => {
    try {
      const pdfBlob = await generateCertificatePDF(certificate);
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${certificate.certificateId}_${certificate.recipientName}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download certificate:", error);
    }
  };

  const handleDownloadLetter = async (letter: any) => {
    try {
      const pdfBlob = await generateLetterPDF(letter);
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${letter.letterType}_${letter.recipientName}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download letter:", error);
    }
  };

  const handleDownloadBatch = async (batch: any) => {
    try {
      const zipDownloader = new ZipDownloader();

      if (batch.type === "certificate") {
        const response = await fetch(`/apiv1/api/batches/${batch.id}/certificates`);
        const certificates = await response.json();
        for (const cert of certificates) {
          await zipDownloader.addCertificatePDF(cert);
        }
        await zipDownloader.downloadZip(`${batch.name}_certificates.zip`);
      } else {
        const response = await fetch(`/apiv1/api/batches/${batch.id}/letters`);
        const letters = await response.json();
        for (const letter of letters) {
          await zipDownloader.addLetterPDF(letter);
        }
        await zipDownloader.downloadZip(`${batch.name}_letters.zip`);
      }
    } catch (error) {
      console.error("Failed to download batch:", error);
    }
  };

  const getBatchNumber = (items: any[], itemId: string) => {
    const sortedAsc = [...items].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    return sortedAsc.findIndex(i => i.id === itemId) + 1;
  };



  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">View Documents</h2>
        <p className="text-sm text-gray-500 mt-1">Browse, search, and download generated documents</p>
      </div>

      {/* Search & Filter */}
      <Card className="shadow-material">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by name, ID, course, or department..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex space-x-3">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="certificate">Certificates</SelectItem>
                  <SelectItem value="offer">Offer Letters</SelectItem>
                  <SelectItem value="completion">Completion Letters</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon"><Filter className="h-4 w-4" /></Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card className="shadow-material">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button className={`py-4 border-b-2 font-medium ${activeTab === "certificates" ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-700"}`} onClick={() => setActiveTab("certificates")}>
              <Award className="inline h-4 w-4 mr-2" /> Certificates ({filteredCertificates.length})
            </button>
            <button className={`py-4 border-b-2 font-medium ${activeTab === "letters" ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-700"}`} onClick={() => setActiveTab("letters")}>
              <FileText className="inline h-4 w-4 mr-2" /> Letters ({filteredLetters.length})
            </button>
            <button className={`py-4 border-b-2 font-medium ${activeTab === "batches" ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-700"}`} onClick={() => setActiveTab("batches")}>
              <LayersIcon className="inline h-4 w-4 mr-2" /> Batches ({batchesData?.data?.length || 0})
            </button>
          </nav>
        </div>

        {/* Certificates */}
        {activeTab === "certificates" && (
          <CardContent className="p-6">
            {certLoading ? (
              <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="animate-pulse border p-4 rounded-lg"></div>)}</div>
            ) : filteredCertificates.length > 0 ? (
              <div className="space-y-4">
                {[...filteredCertificates].sort((a,b)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime())
                  .map(cert => (
                    <div key={cert.id} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center"><Award className="h-5 w-5 text-primary" /></div>
                        <div>
                          <h4 className="font-medium text-gray-900">{cert.recipientName}</h4>
                          <p className="text-sm text-gray-500">{cert.certificateId}</p>
                          <p className="text-xs text-gray-400">{cert.course} • {cert.college}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className="bg-green-100 text-green-800">Generated</Badge>
                        <div className="flex space-x-1">
                          <Button variant="ghost" size="icon" onClick={() => setPreviewCert(cert)} title="Preview"><Eye className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDownloadCertificate(cert)} title="Download"><Download className="h-4 w-4" /></Button>
                        </div>
                      </div>
                    </div>
                  ))}
                <div className="flex justify-between mt-4">
                  <Button onClick={handlePrevPage} disabled={certPage === 0}>Previous</Button>
                  <Button onClick={handleNextPage} disabled={filteredCertificates.length < PAGE_SIZE}>Next</Button>
                </div>
              </div>
            ) : <p className="text-center py-12">No certificates found</p>}
          </CardContent>
        )}

        {/* Letters */}
        {activeTab === "letters" && (
          <CardContent className="p-6">
            {letterLoading ? (
              <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="animate-pulse border p-4 rounded-lg"></div>)}</div>
            ) : filteredLetters.length > 0 ? (
              <div className="space-y-4">
                {[...filteredLetters].sort((a,b)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime())
                  .map(letter => (
                    <div key={letter.id} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md">
                      <div className="flex items-center space-x-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${letter.letterType === "offer" ? "bg-green-100" : "bg-purple-100"}`}>
                          {letter.letterType === "offer" ? <FileText className="h-5 w-5 text-green-600" /> : <Award className="h-5 w-5 text-purple-600" />}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{letter.recipientName}</h4>
                          <p className="text-sm text-gray-500">{letter.letterType === "offer" ? "Offer Letter" : "Completion Letter"}</p>
                          <p className="text-xs text-gray-400">{letter.department} • {letter.position || letter.courseName}</p>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => handleDownloadLetter(letter)} title="Download"><Download className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  ))}
                <div className="flex justify-between mt-4">
                  <Button onClick={handlePrevPage} disabled={letterPage === 0}>Previous</Button>
                  <Button onClick={handleNextPage} disabled={filteredLetters.length < PAGE_SIZE}>Next</Button>
                </div>
              </div>
            ) : <p className="text-center py-12">No letters found</p>}
          </CardContent>
        )}

        {/* Batches */}
        {activeTab === "batches" && (
          <CardContent className="p-6">
            {batchLoading ? (
              <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="animate-pulse border p-4 rounded-lg"></div>)}</div>
            ) : batchesData?.data?.length > 0 ? (
              <div className="space-y-4">
                {[...batchesData.data].sort((a,b)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime())
                  .map(batch => {
                    const number = getBatchNumber(batchesData.data, batch.id);
                    return (
                      <div key={batch.id} className="border rounded-lg p-4 mb-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${batch.type==="certificate"?"bg-primary":"bg-accent"}`}>B{number}</div>
                            <div>
                              <h4 className="font-medium text-gray-900">{batch.name}</h4>
                              <p className="text-sm text-gray-500">Generated on {new Date(batch.createdAt).toLocaleDateString()} • {batch.totalDocuments} {batch.type}s</p>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Badge className={batch.type==="certificate"?"bg-blue-100 text-blue-800":"bg-green-100 text-green-800"}>{batch.totalDocuments} {batch.type}s</Badge>
                            <Button variant="ghost" size="icon" onClick={()=>handleDownloadBatch(batch)}><Download className="h-4 w-4"/></Button>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">CSV File: {batch.csvFileName}</div>
                      </div>
                    );
                  })}
                <div className="flex justify-between mt-4">
                  <Button onClick={handlePrevPage} disabled={batchPage===0}>Previous</Button>
                  <Button onClick={handleNextPage} disabled={(batchPage+1)*PAGE_SIZE >= (batchesData.total||0)}>Next</Button>
                </div>
              </div>
            ) : <p className="text-center py-12">No batches found</p>}
          </CardContent>
        )}
      </Card>

      {/* Preview Modal */}
      {previewCert && <CertificatePreviewModal certificate={previewCert} isOpen={!!previewCert} onClose={() => setPreviewCert(null)} />}
    </div>
  );
}
