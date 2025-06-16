import { 
  contractTemplates, 
  contracts, 
  users,
  type ContractTemplate, 
  type Contract, 
  type InsertContract,
  type InsertContractTemplate,
  type User, 
  type InsertUser 
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Contract template methods
  getContractTemplates(): Promise<ContractTemplate[]>;
  getContractTemplate(id: number): Promise<ContractTemplate | undefined>;
  createContractTemplate(template: InsertContractTemplate): Promise<ContractTemplate>;
  
  // Contract methods
  getContracts(): Promise<Contract[]>;
  getContract(id: number): Promise<Contract | undefined>;
  createContract(contract: InsertContract): Promise<Contract>;
  updateContract(id: number, contract: Partial<InsertContract>): Promise<Contract | undefined>;
  deleteContract(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private contractTemplates: Map<number, ContractTemplate>;
  private contracts: Map<number, Contract>;
  private currentUserId: number;
  private currentTemplateId: number;
  private currentContractId: number;

  constructor() {
    this.users = new Map();
    this.contractTemplates = new Map();
    this.contracts = new Map();
    this.currentUserId = 1;
    this.currentTemplateId = 1;
    this.currentContractId = 1;
    
    // Initialize with default templates
    this.initializeTemplates();
  }

  private initializeTemplates() {
    const templates: InsertContractTemplate[] = [
      {
        name: "employment",
        title: "雇用契約書",
        description: "正社員・パート・アルバイトの雇用契約に使用",
        icon: "fas fa-briefcase",
        estimatedTime: "約10分",
        fieldCount: 15,
        template: `<div class="contract-document">
          <h1 class="contract-title">雇用契約書</h1>
          
          <div class="contract-parties">
            <div class="employer-info">
              <h3>雇用者：</h3>
              <p>{{employer.companyName}}</p>
              <p>代表取締役 {{employer.representativeName}}</p>
              <p>住所：{{employer.address}}</p>
            </div>
            
            <div class="employee-info">
              <h3>従業員：</h3>
              <p>{{employee.name}}</p>
              <p>生年月日：{{employee.birthDate}}</p>
              <p>住所：{{employee.address}}</p>
            </div>
          </div>
          
          <p class="contract-intro">上記当事者間において、下記条件にて雇用契約を締結する。</p>
          
          <div class="contract-clauses">
            <div class="clause">
              <h4>第1条（雇用）</h4>
              <p>雇用者は従業員を{{employment.position}}として雇用し、従業員はこれを承諾する。</p>
            </div>
            
            <div class="clause">
              <h4>第2条（雇用期間）</h4>
              <p>雇用期間は{{employment.startDate}}から開始する{{employment.type}}とする。</p>
              {{#if employment.probationPeriod}}
              <p>試用期間を{{employment.probationPeriod}}とする。</p>
              {{/if}}
            </div>
            
            <div class="clause">
              <h4>第3条（勤務時間）</h4>
              <p>勤務時間は{{employment.workStartTime}}から{{employment.workEndTime}}までとする。</p>
            </div>
            
            <div class="clause">
              <h4>第4条（賃金）</h4>
              <p>基本給は月額{{employment.salary}}円とし、毎月{{employment.paymentDate}}に支払う。</p>
            </div>
          </div>
          
          <div class="contract-footer">
            <p>以上、契約成立の証として本書2通を作成し、当事者各自1通ずつ保有する。</p>
            <div class="signature-section">
              <div class="date">契約締結日：{{contractDate}}</div>
            </div>
          </div>
        </div>`,
        fields: [
          { id: "employer.companyName", label: "会社名", type: "text", placeholder: "株式会社サンプル", required: true },
          { id: "employer.representativeName", label: "代表者名", type: "text", placeholder: "田中 太郎", required: true },
          { id: "employer.address", label: "会社住所", type: "text", placeholder: "東京都渋谷区...", required: true },
          { id: "employee.name", label: "従業員氏名", type: "text", placeholder: "山田 花子", required: true },
          { id: "employee.birthDate", label: "生年月日", type: "date", required: true },
          { id: "employee.address", label: "従業員住所", type: "text", placeholder: "東京都新宿区...", required: true },
          { id: "employment.type", label: "雇用形態", type: "select", required: true, options: [
            { value: "正社員", label: "正社員" },
            { value: "パートタイム", label: "パートタイム" },
            { value: "契約社員", label: "契約社員" },
            { value: "臨時雇用", label: "臨時雇用" }
          ]},
          { id: "employment.position", label: "職種", type: "text", placeholder: "ソフトウェアエンジニア", required: true },
          { id: "employment.startDate", label: "雇用開始日", type: "date", required: true },
          { id: "employment.probationPeriod", label: "試用期間", type: "select", required: false, options: [
            { value: "", label: "なし" },
            { value: "1ヶ月", label: "1ヶ月" },
            { value: "3ヶ月", label: "3ヶ月" },
            { value: "6ヶ月", label: "6ヶ月" }
          ]},
          { id: "employment.salary", label: "基本給", type: "number", placeholder: "300000", required: true },
          { id: "employment.paymentDate", label: "給与支払日", type: "select", required: true, options: [
            { value: "毎月25日", label: "毎月25日" },
            { value: "月末", label: "月末" },
            { value: "毎月15日", label: "毎月15日" }
          ]},
          { id: "employment.workStartTime", label: "勤務開始時間", type: "time", required: true },
          { id: "employment.workEndTime", label: "勤務終了時間", type: "time", required: true },
          { id: "contractDate", label: "契約締結日", type: "date", required: true }
        ]
      },
      {
        name: "service",
        title: "業務委託契約書",
        description: "フリーランス・外注業務の委託契約に使用",
        icon: "fas fa-handshake",
        estimatedTime: "約15分",
        fieldCount: 12,
        template: `<div class="contract-document">
          <h1 class="contract-title">業務委託契約書</h1>
          
          <div class="contract-parties">
            <div class="client-info">
              <h3>委託者：</h3>
              <p>{{client.companyName}}</p>
              <p>代表者：{{client.representativeName}}</p>
              <p>住所：{{client.address}}</p>
            </div>
            
            <div class="contractor-info">
              <h3>受託者：</h3>
              <p>{{contractor.name}}</p>
              <p>住所：{{contractor.address}}</p>
            </div>
          </div>
          
          <p class="contract-intro">上記当事者間において、下記条件にて業務委託契約を締結する。</p>
          
          <div class="contract-clauses">
            <div class="clause">
              <h4>第1条（業務内容）</h4>
              <p>委託者は受託者に対し、{{service.description}}の業務を委託し、受託者はこれを受託する。</p>
            </div>
            
            <div class="clause">
              <h4>第2条（委託期間）</h4>
              <p>委託期間は{{service.startDate}}から{{service.endDate}}までとする。</p>
            </div>
            
            <div class="clause">
              <h4>第3条（報酬）</h4>
              <p>委託業務の報酬は{{service.paymentType}}{{service.amount}}円とし、{{service.paymentSchedule}}に支払う。</p>
            </div>
            
            <div class="clause">
              <h4>第4条（納期）</h4>
              <p>受託者は{{service.deliveryDate}}までに業務を完了し、委託者に納品するものとする。</p>
            </div>
          </div>
          
          <div class="contract-footer">
            <p>以上、契約成立の証として本書2通を作成し、当事者各自1通ずつ保有する。</p>
            <div class="signature-section">
              <div class="date">契約締結日：{{contractDate}}</div>
            </div>
          </div>
        </div>`,
        fields: [
          { id: "client.companyName", label: "委託者会社名", type: "text", placeholder: "株式会社サンプル", required: true },
          { id: "client.representativeName", label: "委託者代表者名", type: "text", placeholder: "田中 太郎", required: true },
          { id: "client.address", label: "委託者住所", type: "text", placeholder: "東京都渋谷区...", required: true },
          { id: "contractor.name", label: "受託者氏名", type: "text", placeholder: "山田 花子", required: true },
          { id: "contractor.address", label: "受託者住所", type: "text", placeholder: "東京都新宿区...", required: true },
          { id: "service.description", label: "業務内容", type: "text", placeholder: "Webサイト制作", required: true },
          { id: "service.startDate", label: "委託開始日", type: "date", required: true },
          { id: "service.endDate", label: "委託終了日", type: "date", required: true },
          { id: "service.paymentType", label: "報酬形態", type: "select", required: true, options: [
            { value: "一括", label: "一括" },
            { value: "月額", label: "月額" },
            { value: "時給", label: "時給" }
          ]},
          { id: "service.amount", label: "報酬金額", type: "number", placeholder: "500000", required: true },
          { id: "service.paymentSchedule", label: "支払時期", type: "text", placeholder: "納品後30日以内", required: true },
          { id: "service.deliveryDate", label: "納期", type: "date", required: true },
          { id: "contractDate", label: "契約締結日", type: "date", required: true }
        ]
      },
      {
        name: "rental",
        title: "賃貸借契約書",
        description: "不動産・物件の賃貸借契約に使用",
        icon: "fas fa-home",
        estimatedTime: "約20分",
        fieldCount: 25,
        template: `<div class="contract-document">
          <h1 class="contract-title">賃貸借契約書</h1>
          <p>貸主と借主は、以下の通り賃貸借契約を締結する。</p>
        </div>`,
        fields: []
      },
      {
        name: "nda",
        title: "秘密保持契約書",
        description: "機密情報の保護に関する契約書",
        icon: "fas fa-user-secret",
        estimatedTime: "約8分",
        fieldCount: 12,
        template: `<div class="contract-document">
          <h1 class="contract-title">秘密保持契約書</h1>
          <p>開示者と受領者は、以下の通り秘密保持契約を締結する。</p>
        </div>`,
        fields: []
      }
    ];

    templates.forEach(template => {
      this.createContractTemplate(template);
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Contract template methods
  async getContractTemplates(): Promise<ContractTemplate[]> {
    return Array.from(this.contractTemplates.values());
  }

  async getContractTemplate(id: number): Promise<ContractTemplate | undefined> {
    return this.contractTemplates.get(id);
  }

  async createContractTemplate(insertTemplate: InsertContractTemplate): Promise<ContractTemplate> {
    const id = this.currentTemplateId++;
    const template: ContractTemplate = { ...insertTemplate, id };
    this.contractTemplates.set(id, template);
    return template;
  }

  // Contract methods
  async getContracts(): Promise<Contract[]> {
    return Array.from(this.contracts.values());
  }

  async getContract(id: number): Promise<Contract | undefined> {
    return this.contracts.get(id);
  }

  async createContract(insertContract: InsertContract): Promise<Contract> {
    const id = this.currentContractId++;
    const now = new Date();
    const contract: Contract = { 
      ...insertContract, 
      id,
      createdAt: now,
      updatedAt: now
    };
    this.contracts.set(id, contract);
    return contract;
  }

  async updateContract(id: number, updateData: Partial<InsertContract>): Promise<Contract | undefined> {
    const existing = this.contracts.get(id);
    if (!existing) return undefined;

    const updated: Contract = {
      ...existing,
      ...updateData,
      updatedAt: new Date()
    };
    this.contracts.set(id, updated);
    return updated;
  }

  async deleteContract(id: number): Promise<boolean> {
    return this.contracts.delete(id);
  }
}

export const storage = new MemStorage();
