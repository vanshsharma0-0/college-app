import React, { useState, useEffect } from "react";
import { ExternalLink, Instagram, Linkedin, Database, ShieldCheck } from "lucide-react";
import { DeveloperAdminModal } from "./DeveloperAdminModal";
import { AnswerSubmission } from "../types";
import { getSubmissions } from "../services/storage";

interface DeveloperCardProps {
  isDarkMode?: boolean;
  submissions?: AnswerSubmission[];
  onRefreshData?: () => Promise<void>;
}

export const DeveloperCard: React.FC<DeveloperCardProps> = ({
  isDarkMode = false,
  submissions: propSubmissions,
  onRefreshData: propOnRefreshData,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [internalSubmissions, setInternalSubmissions] = useState<AnswerSubmission[]>([]);

  const loadSubmissions = async () => {
    try {
      const subs = await getSubmissions();
      setInternalSubmissions(subs);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (!propSubmissions) {
      loadSubmissions();
    }
  }, [propSubmissions]);

  const activeSubmissions = propSubmissions || internalSubmissions;

  const handleRefresh = async () => {
    if (propOnRefreshData) {
      await propOnRefreshData();
    }
    await loadSubmissions();
  };

  return (
    <>
      <div
        className={`border rounded-lg p-3 text-xs shadow-sm transition-colors ${
          isDarkMode
            ? "bg-[#141C2E] border-slate-800 text-slate-300"
            : "bg-slate-50 border-slate-200 text-slate-700"
        }`}
      >
        <div className="flex items-center justify-between mb-1 gap-2">
          <div className={`font-semibold text-sm ${isDarkMode ? "text-white" : "text-slate-900"}`}>
            About the Developer
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#EA580C]/10 text-[#EA580C] hover:bg-[#EA580C] hover:text-white border border-[#EA580C]/30 transition-all cursor-pointer shadow-2xs"
            title="Open Developer & Storage Management Console (PIN Protected)"
          >
            <Database className="w-3 h-3" />
            <span>Admin / Storage</span>
          </button>
        </div>

        <div className={`mb-2 ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
          Developed by <span className={`font-medium ${isDarkMode ? "text-slate-200" : "text-slate-900"}`}>Vansh Sharma</span>
        </div>

        <div className={`flex items-center gap-2 pt-1.5 border-t ${isDarkMode ? "border-slate-800" : "border-slate-200"}`}>
          <a
            href="https://www.linkedin.com/in/vansh-sharma-9404a6437"
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1 px-2 py-1 border rounded transition-colors ${
              isDarkMode
                ? "bg-[#0F172A] border-slate-700 text-slate-200 hover:text-[#EA580C] hover:border-[#EA580C]"
                : "bg-white border-slate-200 text-slate-700 hover:text-[#EA580C] hover:border-[#EA580C]"
            }`}
            title="Vansh Sharma on LinkedIn"
          >
            <Linkedin className="w-3.5 h-3.5 text-[#0A66C2]" />
            <span>LinkedIn</span>
            <ExternalLink className="w-2.5 h-2.5 opacity-60" />
          </a>

          <a
            href="https://www.instagram.com/truly_vansh/?hl=en"
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1 px-2 py-1 border rounded transition-colors ${
              isDarkMode
                ? "bg-[#0F172A] border-slate-700 text-slate-200 hover:text-[#EA580C] hover:border-[#EA580C]"
                : "bg-white border-slate-200 text-slate-700 hover:text-[#EA580C] hover:border-[#EA580C]"
            }`}
            title="Vansh Sharma on Instagram"
          >
            <Instagram className="w-3.5 h-3.5 text-[#E4405F]" />
            <span>Instagram</span>
            <ExternalLink className="w-2.5 h-2.5 opacity-60" />
          </a>
        </div>
      </div>

      {/* Developer PIN & Storage Cleanup Console Modal */}
      <DeveloperAdminModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        submissions={activeSubmissions}
        onRefreshData={handleRefresh}
        isDarkMode={isDarkMode}
      />
    </>
  );
};
