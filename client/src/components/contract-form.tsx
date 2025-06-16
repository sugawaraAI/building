import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Save, Building, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { ContractTemplate, Contract, ContractField } from "@shared/schema";

interface ContractFormProps {
  template: ContractTemplate;
  contractId: number | null;
  onContractCreated: (contractId: number) => void;
}

export default function ContractForm({ template, contractId, onContractCreated }: ContractFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: contract } = useQuery<Contract>({
    queryKey: ["/api/contracts", contractId],
    enabled: !!contractId,
  });

  // Create form schema based on template fields
  const createFormSchema = (fields: ContractField[]) => {
    const schemaFields: Record<string, z.ZodType> = {};
    
    // Handle case where fields might be undefined or empty
    if (!fields || !Array.isArray(fields) || fields.length === 0) {
      // Return a schema with at least one field to avoid empty object issues
      return z.object({
        _placeholder: z.string().optional()
      });
    }
    
    fields.forEach(field => {
      let fieldSchema: z.ZodType;
      
      switch (field.type) {
        case "number":
          fieldSchema = z.number().min(0);
          break;
        case "date":
          fieldSchema = z.string().min(1);
          break;
        default:
          fieldSchema = z.string();
      }
      
      if (field.required) {
        fieldSchema = fieldSchema.refine(val => val !== "" && val !== null && val !== undefined, {
          message: `${field.label}は必須項目です`,
        });
      } else {
        fieldSchema = fieldSchema.optional();
      }
      
      schemaFields[field.id] = fieldSchema;
    });
    
    return z.object(schemaFields);
  };

  const formSchema = createFormSchema(templateFields);
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: contract?.data || {},
  });

  useEffect(() => {
    if (contract?.data) {
      form.reset(contract.data as Record<string, any>);
    }
  }, [contract, form]);

  const createContractMutation = useMutation({
    mutationFn: async (data: Record<string, any>) => {
      const response = await apiRequest("POST", "/api/contracts", {
        templateId: template.id,
        title: `${template.title} - ${new Date().toLocaleDateString('ja-JP')}`,
        data,
        status: "draft",
      });
      return response.json();
    },
    onSuccess: (newContract) => {
      onContractCreated(newContract.id);
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      toast({
        title: "保存完了",
        description: "契約書の下書きを保存しました。",
      });
    },
    onError: () => {
      toast({
        title: "エラー",
        description: "契約書の保存に失敗しました。",
        variant: "destructive",
      });
    },
  });

  const updateContractMutation = useMutation({
    mutationFn: async (data: Record<string, any>) => {
      const response = await apiRequest("PUT", `/api/contracts/${contractId}`, {
        data,
        status: "draft",
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts", contractId] });
      toast({
        title: "更新完了",
        description: "契約書を更新しました。",
      });
    },
    onError: () => {
      toast({
        title: "エラー",
        description: "契約書の更新に失敗しました。",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: Record<string, any>) => {
    if (contractId) {
      updateContractMutation.mutate(data);
    } else {
      createContractMutation.mutate(data);
    }
  };

  const handleSaveAsDraft = () => {
    form.handleSubmit(onSubmit)();
  };

  const handleNextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Group fields by section for better organization
  const templateFields = (template.fields as ContractField[]) || [];
  const employerFields = templateFields.filter(field => field.id.startsWith('employer.'));
  const employeeFields = templateFields.filter(field => field.id.startsWith('employee.'));
  const employmentFields = templateFields.filter(field => field.id.startsWith('employment.'));
  const clientFields = templateFields.filter(field => field.id.startsWith('client.'));
  const contractorFields = templateFields.filter(field => field.id.startsWith('contractor.'));
  const serviceFields = templateFields.filter(field => field.id.startsWith('service.'));
  const otherFields = templateFields.filter(field => 
    !field.id.startsWith('employer.') && 
    !field.id.startsWith('employee.') && 
    !field.id.startsWith('employment.') &&
    !field.id.startsWith('client.') &&
    !field.id.startsWith('contractor.') &&
    !field.id.startsWith('service.')
  );

  const renderField = (field: ContractField) => (
    <FormField
      key={field.id}
      control={form.control}
      name={field.id}
      render={({ field: formField }) => (
        <FormItem>
          <FormLabel>
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </FormLabel>
          <FormControl>
            {field.type === "select" ? (
              <Select onValueChange={formField.onChange} value={formField.value}>
                <SelectTrigger>
                  <SelectValue placeholder="選択してください" />
                </SelectTrigger>
                <SelectContent>
                  {field.options?.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                type={field.type}
                placeholder={field.placeholder}
                {...formField}
                onChange={(e) => {
                  const value = field.type === "number" ? Number(e.target.value) : e.target.value;
                  formField.onChange(value);
                }}
              />
            )}
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {template.title}の作成
            </h2>
            <span className="text-sm text-gray-500">
              ステップ {currentStep}/{totalSteps}
            </span>
          </div>
          <Progress value={(currentStep / totalSteps) * 100} className="h-2" />
        </CardContent>
      </Card>

      {/* Form Sections */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          
          {/* Basic Information */}
          <Card>
            <CardHeader className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">基本情報</h3>
              <p className="text-sm text-gray-600 mt-1">
                契約当事者の基本情報を入力してください
              </p>
            </CardHeader>
            
            <CardContent className="p-6 space-y-6">
              {/* Employer Information */}
              {employerFields.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 flex items-center">
                    <Building className="h-5 w-5 mr-2 text-primary" />
                    雇用者情報
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {employerFields.map(renderField)}
                  </div>
                </div>
              )}

              {/* Employee Information */}
              {employeeFields.length > 0 && (
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="font-medium text-gray-900 flex items-center">
                    <User className="h-5 w-5 mr-2 text-primary" />
                    従業員情報
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {employeeFields.map(renderField)}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Employment Details */}
          {employmentFields.length > 0 && (
            <Card>
              <CardHeader className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">雇用条件</h3>
                <p className="text-sm text-gray-600 mt-1">
                  雇用に関する詳細条件を設定してください
                </p>
              </CardHeader>
              
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {employmentFields.map(renderField)}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Other Fields */}
          {otherFields.length > 0 && (
            <Card>
              <CardHeader className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">その他の項目</h3>
              </CardHeader>
              
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {otherFields.map(renderField)}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between items-center">
            <Button
              type="button"
              variant="outline"
              onClick={handlePreviousStep}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              前のステップ
            </Button>
            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleSaveAsDraft}
                disabled={createContractMutation.isPending || updateContractMutation.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                下書き保存
              </Button>
              <Button
                type="button"
                onClick={handleNextStep}
                disabled={currentStep === totalSteps}
              >
                次のステップ
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
