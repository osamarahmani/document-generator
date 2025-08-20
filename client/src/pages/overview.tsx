import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Award, FileText, Upload, Download, Plus } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";


export default function Overview() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/stats"],
    queryFn: () => fetch(`/apiv1/api/stats`).then(res => res.json()),
  });

  const { data: certificates } = useQuery({
    queryKey: ["/api/certificates"],
    queryFn: () =>
      fetch(`/apiv1/api/certificates?limit=5`).then(res => res.json()),
  });

  const [showBanner, setShowBanner] = useState(true);


  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (

    <div className="p-6 space-y-8">
      <div
        className="bg-yellow-200 border border-yellow-400 text-yellow-900 px-4 py-3 rounded relative mb-6 animate-pulse"
        role="alert"
      >
        <strong className="font-bold">Under Development! </strong>
        <span className="block sm:inline">
          Check all functions. For improvements or discussions, contact:{" "}
          <a
            href="mailto:osama.rahmani.dev@gmail.com"
            className="underline hover:text-yellow-700"
          >
            osama.rahmani.dev@gmail.com
          </a>
        </span>
        <button
          onClick={() => setShowBanner(false)}
          className="absolute top-0 bottom-0 right-0 px-4 py-3"
          aria-label="Close alert"
        >
          {/* close icon SVG */}
        </button>
      </div>







      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900" data-testid="page-title">Overview</h2>
        <p className="text-sm text-gray-500 mt-1" data-testid="page-subtitle">
          Manage certificates and letters efficiently
        </p>
      </div>

      {/* Stats Cards */}
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-material">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Award className="h-6 w-6 text-primary" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Certificates</p>
                <p className="text-2xl font-semibold text-gray-900" data-testid="stat-certificates">
                  {(stats as any)?.totalCertificates || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-material">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <FileText className="h-6 w-6 text-accent" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Letters</p>
                <p className="text-2xl font-semibold text-gray-900" data-testid="stat-letters">
                  {(stats as any)?.totalLetters || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-material">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Upload className="h-6 w-6 text-orange-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Bulk Batches</p>
                <p className="text-2xl font-semibold text-gray-900" data-testid="stat-batches">
                  {(stats as any)?.totalBatches || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>


      {/* Recent Activity and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-material">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Certificates</h3>
            <div className="space-y-4">
              {certificates && certificates.length > 0 ? (
                certificates.map((cert: any) => (
                  <div key={cert.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900" data-testid={`cert-name-${cert.id}`}>
                        {cert.recipientName}
                      </p>
                      <p className="text-sm text-gray-500" data-testid={`cert-id-${cert.id}`}>
                        {cert.certificateId}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500" data-testid={`cert-course-${cert.id}`}>
                        {cert.course}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(cert.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Award className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No certificates generated yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-material">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Button
                asChild
                className="w-full justify-between bg-primary hover:bg-blue-700"
                data-testid="button-generate-certificate"
              >
                <Link href="/certificate-generator">
                  <div className="flex items-center space-x-3">
                    <Plus className="h-4 w-4" />
                    <span>Generate New Certificate</span>
                  </div>
                  <span>→</span>
                </Link>
              </Button>

              <Button
                asChild
                variant="secondary"
                className="w-full justify-between bg-accent hover:bg-green-600 text-white"
                data-testid="button-bulk-upload"
              >
                <Link href="/certificate-generator">
                  <div className="flex items-center space-x-3">
                    <Upload className="h-4 w-4" />
                    <span>Bulk Upload CSV</span>
                  </div>
                  <span>→</span>
                </Link>
              </Button>

              <Button
                asChild
                variant="secondary"
                className="w-full justify-between bg-gray-600 hover:bg-gray-700 text-white"
                data-testid="button-create-letter"
              >
                <Link href="/letter-generator">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-4 w-4" />
                    <span>Create Letter</span>
                  </div>
                  <span>→</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
