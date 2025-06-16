import { useState } from "react";
import AppHeader from "@/components/app-header";
import TemplateSelection from "@/components/template-selection";
import ContractForm from "@/components/contract-form";
import ContractPreview from "@/components/contract-preview";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { ContractTemplate, Contract } from "@shared/schema";

export default function Home() {
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [currentContractId, setCurrentContractId] = useState<number | null>(null);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(true);

  const { data: templates = [] } = useQuery<ContractTemplate[]>({
    queryKey: ["/api/templates"],
  });

  const { data: contract } = useQuery<Contract>({
    queryKey: ["/api/contracts", currentContractId],
    enabled: !!currentContractId,
  });

  const { data: selectedTemplate } = useQuery<ContractTemplate>({
    queryKey: ["/api/templates", selectedTemplateId],
    enabled: !!selectedTemplateId,
  });

  const handleTemplateSelect = (templateId: number) => {
    setSelectedTemplateId(templateId);
  };

  const handleContractCreated = (contractId: number) => {
    setCurrentContractId(contractId);
  };

  const handleStartCreation = () => {
    if (selectedTemplateId) {
      // Create new contract will be handled in ContractForm
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-japanese">
      <AppHeader />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-1">
            <TemplateSelection
              templates={templates}
              selectedTemplateId={selectedTemplateId}
              onTemplateSelect={handleTemplateSelect}
              onStartCreation={handleStartCreation}
            />
          </div>

          <div className="lg:col-span-2">
            {selectedTemplateId && selectedTemplate ? (
              <ContractForm
                template={selectedTemplate}
                contractId={currentContractId}
                onContractCreated={handleContractCreated}
              />
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <div className="text-gray-400 mb-4">
                  <i className="fas fa-file-contract text-6xl"></i>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  契約書テンプレートを選択してください
                </h3>
                <p className="text-gray-600">
                  左のパネルからご希望の契約書の種類を選択して、作成を開始してください。
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Preview Panel */}
        {previewVisible && selectedTemplateId && (
          <ContractPreview
            contractId={currentContractId}
            template={selectedTemplate}
            onClose={() => setPreviewVisible(false)}
            className="hidden lg:block"
          />
        )}

        {/* Mobile Preview Toggle */}
        <Button
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg lg:hidden"
          onClick={() => setShowMobilePreview(!showMobilePreview)}
        >
          <Eye className="h-6 w-6" />
        </Button>

        {/* Mobile Preview Modal */}
        {showMobilePreview && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden">
            <div className="fixed inset-x-4 top-4 bottom-4 bg-white rounded-lg overflow-hidden">
              <ContractPreview
                contractId={currentContractId}
                template={selectedTemplate}
                onClose={() => setShowMobilePreview(false)}
                className="h-full"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
