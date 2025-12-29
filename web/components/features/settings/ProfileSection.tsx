"use client";

import { useState } from "react";
import { User, Mail, Building2, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ProfileData {
  name: string;
  email: string;
  company?: string;
}

interface ProfileSectionProps {
  profile: ProfileData;
  onUpdate: (data: Partial<ProfileData>) => Promise<void>;
}

export function ProfileSection({ profile, onUpdate }: ProfileSectionProps) {
  const [name, setName] = useState(profile.name);
  const [company, setCompany] = useState(profile.company || "");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const hasChanges = name !== profile.name || company !== (profile.company || "");

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await onUpdate({ name, company: company || undefined });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to save profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-industrial-200">
        <div className="w-10 h-10 rounded-lg bg-industrial-100 flex items-center justify-center">
          <User className="w-5 h-5 text-industrial-600" />
        </div>
        <div>
          <h3 className="font-semibold text-industrial-900">Profile Information</h3>
          <p className="text-sm text-industrial-500">
            Update your personal details
          </p>
        </div>
      </div>

      {/* Form Fields */}
      <div className="grid gap-6">
        {/* Name Field */}
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-industrial-400" />
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="pl-10"
            />
          </div>
        </div>

        {/* Email Field (readonly) */}
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-industrial-400" />
            <Input
              id="email"
              value={profile.email}
              disabled
              className="pl-10 bg-industrial-50 cursor-not-allowed"
            />
          </div>
          <p className="text-xs text-industrial-400">
            Contact support to change your email address
          </p>
        </div>

        {/* Company Field */}
        <div className="space-y-2">
          <Label htmlFor="company">Company Name</Label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-industrial-400" />
            <Input
              id="company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Your company (optional)"
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-between pt-4 border-t border-industrial-100">
        <div className="text-sm">
          {saveSuccess && (
            <span className="text-success-600 font-medium">
              Profile updated successfully
            </span>
          )}
        </div>
        <Button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className="min-w-[120px]"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
