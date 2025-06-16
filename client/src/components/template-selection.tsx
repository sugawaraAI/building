import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ArrowRight, Check } from "lucide-react";
import type { ContractTemplate } from "@shared/schema";

interface TemplateSelectionProps {
  templates: ContractTemplate[];
  selectedTemplateId: number | null;
  onTemplateSelect: (templateId: number) => void;
  onStartCreation: () => void;
}

export default function TemplateSelection({
  templates,
  selectedTemplateId,
  onTemplateSelect,
  onStartCreation,
}: TemplateSelectionProps) {
  return (
    <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
      <CardHeader className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          契約書テンプレート
        </h2>
        <p className="text-sm text-gray-600">
          作成したい契約書の種類を選択してください
        </p>
      </CardHeader>
      
      <CardContent className="p-4 space-y-3">
        {templates.map((template) => (
          <div
            key={template.id}
            className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
              selectedTemplateId === template.id
                ? "border-primary bg-blue-50"
                : "border-gray-200 hover:border-primary hover:bg-blue-50"
            }`}
            onClick={() => onTemplateSelect(template.id)}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <i className={`${template.icon} ${
                  selectedTemplateId === template.id ? "text-primary" : "text-gray-400"
                } text-lg mt-1`}></i>
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{template.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                <div className="flex items-center mt-2 text-xs text-gray-500">
                  <span>所要時間: {template.estimatedTime}</span>
                  <span className="mx-2">•</span>
                  <span>{template.fieldCount}項目</span>
                </div>
              </div>
              <div className="flex-shrink-0">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedTemplateId === template.id
                    ? "border-primary bg-primary"
                    : "border-gray-300"
                }`}>
                  {selectedTemplateId === template.id && (
                    <Check className="h-3 w-3 text-white" />
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>

      <div className="p-6 border-t border-gray-200">
        <Button
          className="w-full bg-primary text-white py-3 hover:bg-blue-700 font-medium"
          onClick={onStartCreation}
          disabled={!selectedTemplateId}
        >
          <ArrowRight className="h-4 w-4 mr-2" />
          契約書作成を開始
        </Button>
      </div>
    </Card>
  );
}
