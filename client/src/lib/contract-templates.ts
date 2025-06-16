import type { ContractField } from "@shared/schema";

export const templateFieldSections = {
  employment: {
    employer: [
      { id: "employer.companyName", section: "employer" },
      { id: "employer.representativeName", section: "employer" },
      { id: "employer.address", section: "employer" },
    ],
    employee: [
      { id: "employee.name", section: "employee" },
      { id: "employee.birthDate", section: "employee" },
      { id: "employee.address", section: "employee" },
    ],
    employment: [
      { id: "employment.type", section: "employment" },
      { id: "employment.position", section: "employment" },
      { id: "employment.startDate", section: "employment" },
      { id: "employment.probationPeriod", section: "employment" },
      { id: "employment.salary", section: "employment" },
      { id: "employment.paymentDate", section: "employment" },
      { id: "employment.workStartTime", section: "employment" },
      { id: "employment.workEndTime", section: "employment" },
    ],
    other: [
      { id: "contractDate", section: "other" },
    ]
  }
};

export const getFieldsBySection = (fields: ContractField[], section: string) => {
  return fields.filter(field => field.id.startsWith(`${section}.`));
};

export const formatFieldValue = (field: ContractField, value: any): string => {
  if (!value) return "";
  
  switch (field.type) {
    case "date":
      return new Date(value).toLocaleDateString('ja-JP');
    case "number":
      return value.toLocaleString('ja-JP');
    case "select":
      const option = field.options?.find(opt => opt.value === value);
      return option?.label || value;
    default:
      return String(value);
  }
};
