"use client";

import { useState } from "react";
import { Settings, User, Lock, Phone, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  ProfileSection,
  PasswordSection,
  PhoneNumbersSection,
  DangerZone,
} from "@/components/features/settings";
import { cn } from "@/lib/utils";

// Mock user data - replace with real data from auth/API
type UserTier = "basic" | "professional" | "enterprise";

const mockUser = {
  name: "Marco Rossi",
  email: "marco.rossi@example.com",
  company: "Heavy Machines SpA",
  tier: "professional" as UserTier,
};

// Mock phone numbers for Enterprise
const mockPhoneNumbers = [
  {
    id: "1",
    number: "+393331234567",
    label: "Main Support Line",
    isPrimary: true,
    createdAt: "2024-01-15T10:00:00Z",
  },
  {
    id: "2",
    number: "+393339876543",
    label: "Field Team",
    isPrimary: false,
    createdAt: "2024-02-20T14:30:00Z",
  },
];

type SettingsTab = "profile" | "password" | "phone" | "danger";

const TABS: { id: SettingsTab; label: string; icon: typeof User; enterprise?: boolean }[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "password", label: "Password", icon: Lock },
  { id: "phone", label: "Phone Numbers", icon: Phone, enterprise: true },
  { id: "danger", label: "Danger Zone", icon: AlertTriangle },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [user, setUser] = useState(mockUser);
  const [phoneNumbers, setPhoneNumbers] = useState(mockPhoneNumbers);

  const isEnterprise = user.tier === "enterprise";

  // Filter tabs based on tier
  const visibleTabs = TABS.filter((tab) => !tab.enterprise || isEnterprise);

  // Handlers (mock implementations)
  const handleUpdateProfile = async (data: { name?: string; company?: string }) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setUser((prev) => ({ ...prev, ...data }));
  };

  const handleChangePassword = async (currentPassword: string, newPassword: string) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    console.log("Password changed:", { currentPassword, newPassword });
  };

  const handleAddPhoneNumber = async (number: string, label?: string) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const newPhone = {
      id: Date.now().toString(),
      number,
      label: label || "",
      isPrimary: phoneNumbers.length === 0,
      createdAt: new Date().toISOString(),
    };
    setPhoneNumbers((prev) => [...prev, newPhone]);
  };

  const handleRemovePhoneNumber = async (id: string) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 800));
    setPhoneNumbers((prev) => prev.filter((p) => p.id !== id));
  };

  const handleDeleteAccount = async () => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));
    // In real implementation, redirect to landing page after deletion
    console.log("Account deleted");
    window.location.href = "/";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-industrial-100 flex items-center justify-center">
          <Settings className="w-6 h-6 text-industrial-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-industrial-900">
            Account Settings
          </h2>
          <p className="text-sm text-industrial-500">
            Manage your profile, security, and preferences
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <Card className="industrial-panel">
            <CardContent className="p-2">
              <nav className="space-y-1">
                {visibleTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  const isDanger = tab.id === "danger";

                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors",
                        isActive
                          ? isDanger
                            ? "bg-danger-100 text-danger-900"
                            : "bg-industrial-100 text-industrial-900"
                          : isDanger
                            ? "text-danger-600 hover:bg-danger-50"
                            : "text-industrial-600 hover:bg-industrial-50"
                      )}
                    >
                      <Icon
                        className={cn(
                          "w-5 h-5",
                          isActive
                            ? isDanger
                              ? "text-danger-600"
                              : "text-industrial-700"
                            : isDanger
                              ? "text-danger-400"
                              : "text-industrial-400"
                        )}
                      />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </CardContent>
          </Card>

          {/* User Info Summary */}
          <Card className="industrial-panel mt-4">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-warning-100 flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl font-bold text-warning-700">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <p className="font-semibold text-industrial-900">{user.name}</p>
                <p className="text-sm text-industrial-500">{user.email}</p>
                <div className="mt-3 pt-3 border-t border-industrial-100">
                  <span
                    className={cn(
                      "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider",
                      user.tier === "enterprise"
                        ? "bg-warning-100 text-warning-800"
                        : user.tier === "professional"
                          ? "bg-industrial-100 text-industrial-800"
                          : "bg-industrial-50 text-industrial-600"
                    )}
                  >
                    {user.tier}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <Card
            className={cn(
              "industrial-panel",
              activeTab === "danger" && "border-danger-200"
            )}
          >
            <CardContent className="p-6">
              {activeTab === "profile" && (
                <ProfileSection
                  profile={{
                    name: user.name,
                    email: user.email,
                    company: user.company,
                  }}
                  onUpdate={handleUpdateProfile}
                />
              )}

              {activeTab === "password" && (
                <PasswordSection onChangePassword={handleChangePassword} />
              )}

              {activeTab === "phone" && (
                <PhoneNumbersSection
                  phoneNumbers={phoneNumbers}
                  isEnterprise={isEnterprise}
                  maxNumbers={5}
                  onAdd={handleAddPhoneNumber}
                  onRemove={handleRemovePhoneNumber}
                />
              )}

              {activeTab === "danger" && (
                <DangerZone
                  userEmail={user.email}
                  onDeleteAccount={handleDeleteAccount}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
