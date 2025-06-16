import { Button } from "@/components/ui/button";
import { File, HelpCircle, User } from "lucide-react";

export default function AppHeader() {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <File className="text-primary text-2xl" />
              <h1 className="text-xl font-semibold text-gray-900 font-inter">
                ContractBuilder
              </h1>
            </div>
            <span className="text-sm text-gray-500">契約書作成システム</span>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
              <HelpCircle className="h-5 w-5" />
            </Button>
            <Button className="bg-primary text-white hover:bg-blue-700 font-medium">
              <User className="h-4 w-4 mr-2" />
              ログイン
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
