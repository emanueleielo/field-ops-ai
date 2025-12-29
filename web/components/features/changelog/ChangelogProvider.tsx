"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { ChangelogModal, type ChangelogData } from "./ChangelogModal";
import changelogData from "@/data/changelog.json";

const STORAGE_KEY = "fieldops_changelog_version";

interface ChangelogContextType {
  showChangelog: () => void;
  hideChangelog: () => void;
  hasUnseenChanges: boolean;
  currentVersion: string;
}

const ChangelogContext = createContext<ChangelogContextType | undefined>(
  undefined
);

export function useChangelog() {
  const context = useContext(ChangelogContext);
  if (!context) {
    throw new Error("useChangelog must be used within a ChangelogProvider");
  }
  return context;
}

interface ChangelogProviderProps {
  children: ReactNode;
}

export function ChangelogProvider({ children }: ChangelogProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnseenChanges, setHasUnseenChanges] = useState(false);
  const changelog = changelogData as ChangelogData;

  // Check if user has seen the current version
  useEffect(() => {
    const seenVersion = localStorage.getItem(STORAGE_KEY);
    const hasNewChanges = seenVersion !== changelog.version;

    setHasUnseenChanges(hasNewChanges);

    // Auto-show modal if there are unseen changes
    if (hasNewChanges) {
      // Small delay to let the dashboard render first
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [changelog.version]);

  const showChangelog = useCallback(() => {
    setIsOpen(true);
  }, []);

  const hideChangelog = useCallback(() => {
    setIsOpen(false);
    // Mark current version as seen
    localStorage.setItem(STORAGE_KEY, changelog.version);
    setHasUnseenChanges(false);
  }, [changelog.version]);

  return (
    <ChangelogContext.Provider
      value={{
        showChangelog,
        hideChangelog,
        hasUnseenChanges,
        currentVersion: changelog.version,
      }}
    >
      {children}
      <ChangelogModal
        changelog={changelog}
        isOpen={isOpen}
        onClose={hideChangelog}
      />
    </ChangelogContext.Provider>
  );
}
