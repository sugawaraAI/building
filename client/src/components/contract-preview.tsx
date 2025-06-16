import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { X, RefreshCw, FileText, Download, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Contract, ContractTemplate } from "@shared/schema";
import { cn } from "@/lib/utils";

interface ContractPreviewProps {
  contractId: number | null;
  template?: ContractTemplate;
  onClose: () => void;
  className?: string;
}

export default function ContractPreview({ 
  contractId, 
  template, 
  onClose, 
  className 
}: ContractPreviewProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  const { data: contract, refetch } = useQuery<Contract>({
    queryKey: ["/api/contracts", contractId],
    enabled: !!contractId,
  });

  const generatePdfMutation = useMutation({
    mutationFn: async () => {
      if (!contractId) throw new Error("No contract ID");
      const response = await apiRequest("POST", `/api/contracts/${contractId}/pdf`);
      return response.blob();
    },
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contract-${contractId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "PDF生成完了",
        description: "契約書のPDFファイルをダウンロードしました。",
      });
    },
    onError: () => {
      toast({
        title: "エラー",
        description: "PDF生成に失敗しました。",
        variant: "destructive",
      });
    },
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  const renderPreviewContent = () => {
    if (!contract || !template) {
      return (
        <div className="text-center py-8 text-gray-500">
          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>契約書のデータがありません</p>
          <p className="text-sm">フォームに入力すると、ここにプレビューが表示されます。</p>
        </div>
      );
    }

    const data = contract.data as Record<string, any>;

    // Simple template rendering (replace placeholders with actual data)
    let previewHtml = template.template;
    for (const [key, value] of Object.entries(data)) {
      if (value) {
        const placeholder = `{{${key}}}`;
        previewHtml = previewHtml.replace(
          new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), 
          String(value)
        );
      }
    }

    // Remove any remaining placeholders
    previewHtml = previewHtml.replace(/\{\{[^}]+\}\}/g, '___');

    return (
      <div 
        className="text-xs text-gray-600 leading-relaxed space-y-3"
        dangerouslySetInnerHTML={{ __html: previewHtml }}
      />
    );
  };

  return (
    <Card className={cn(
      "fixed right-4 top-24 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50",
      className
    )}>
      <CardHeader className="p-4 border-b border-gray-200 flex flex-row items-center justify-between space-y-0">
        <h3 className="font-medium text-gray-900">プレビュー</h3>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="text-gray-400 hover:text-gray-600 h-8 w-8 p-0"
          >
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 max-h-96 overflow-y-auto">
        {renderPreviewContent()}
      </CardContent>
      
      <div className="p-4 border-t border-gray-200">
        <Button
          className="w-full bg-accent text-white hover:bg-orange-600 font-medium text-sm"
          onClick={() => generatePdfMutation.mutate()}
          disabled={!contractId || generatePdfMutation.isPending}
        >
          {generatePdfMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <FileText className="h-4 w-4 mr-2" />
          )}
          {generatePdfMutation.isPending ? "生成中..." : "PDF生成"}
        </Button>
      </div>
    </Card>
  );
}
