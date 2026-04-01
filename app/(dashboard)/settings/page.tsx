"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import SignatureCanvas from "react-signature-canvas";
import { Loader2, Upload, X, ImageIcon, Check, ArrowLeft, PenLine, Type, RotateCcw } from "lucide-react";
import Link from "next/link";
import type { BusinessProfile } from "@/lib/types";

function PhotoUpload({
  label,
  photoUrl,
  photoPreview,
  nameValue,
  namePlaceholder,
  onFileSelect,
  onRemove,
  onNameChange,
  inputRef,
}: {
  label: string;
  photoUrl: string | null;
  photoPreview: string | null;
  nameValue: string;
  namePlaceholder: string;
  onFileSelect: (file: File | null) => void;
  onRemove: () => void;
  onNameChange: (name: string) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
      </label>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onFileSelect(e.target.files?.[0] || null)}
      />
      {photoPreview || photoUrl ? (
        <div className="relative w-full h-28 border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
          <img
            src={photoPreview || photoUrl || ""}
            alt={label}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-1.5 right-1.5 flex gap-1">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="p-1 bg-white rounded-full shadow-sm border border-gray-200 hover:bg-gray-50"
              title="Change photo"
            >
              <Upload className="w-3 h-3 text-gray-500" />
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="p-1 bg-white rounded-full shadow-sm border border-gray-200 hover:bg-gray-50"
              title="Remove photo"
            >
              <X className="w-3 h-3 text-gray-500" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full h-28 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center gap-1.5 hover:border-gray-300 hover:bg-gray-50 transition-colors"
        >
          <ImageIcon className="w-5 h-5 text-gray-400" />
          <span className="text-xs text-gray-400">Upload photo</span>
        </button>
      )}
      <input
        type="text"
        value={nameValue}
        onChange={(e) => onNameChange(e.target.value)}
        placeholder={namePlaceholder}
        className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
      />
    </div>
  );
}

export default function SettingsPage() {
  const supabase = createClient();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const member1InputRef = useRef<HTMLInputElement>(null);
  const member2InputRef = useRef<HTMLInputElement>(null);
  const sigCanvasRef = useRef<SignatureCanvas>(null);
  const sigContainerRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [companyName, setCompanyName] = useState("");
  const [companyDescription, setCompanyDescription] = useState("");
  const [yearsInBusiness, setYearsInBusiness] = useState("");
  const [teamDescription, setTeamDescription] = useState("");
  const [keyDifferentiators, setKeyDifferentiators] = useState("");
  const [notableClients, setNotableClients] = useState("");
  const [industryFocus, setIndustryFocus] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");

  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Team members
  const [member1Url, setMember1Url] = useState<string | null>(null);
  const [member1File, setMember1File] = useState<File | null>(null);
  const [member1Preview, setMember1Preview] = useState<string | null>(null);
  const [member1Name, setMember1Name] = useState("");

  const [member2Url, setMember2Url] = useState<string | null>(null);
  const [member2File, setMember2File] = useState<File | null>(null);
  const [member2Preview, setMember2Preview] = useState<string | null>(null);
  const [member2Name, setMember2Name] = useState("");

  // Provider signature
  const [providerSignerName, setProviderSignerName] = useState("");
  const [providerSignerTitle, setProviderSignerTitle] = useState("");
  const [providerSignatureData, setProviderSignatureData] = useState<string | null>(null);
  const [sigMode, setSigMode] = useState<"draw" | "type">("draw");
  const [sigTypedName, setSigTypedName] = useState("");
  const [sigCanvasWidth, setSigCanvasWidth] = useState(500);

  // Resize signature canvas to match container
  const updateSigCanvasWidth = useCallback(() => {
    if (sigContainerRef.current) {
      setSigCanvasWidth(sigContainerRef.current.offsetWidth - 2);
    }
  }, []);

  useEffect(() => {
    updateSigCanvasWidth();
    window.addEventListener("resize", updateSigCanvasWidth);
    return () => window.removeEventListener("resize", updateSigCanvasWidth);
  }, [updateSigCanvasWidth]);

  useEffect(() => {
    async function loadProfile() {
      const { data } = await supabase
        .from("business_profiles")
        .select("*")
        .limit(1)
        .single();

      if (data) {
        const p = data as unknown as BusinessProfile;
        setCompanyName(p.company_name || "");
        setCompanyDescription(p.company_description || "");
        setYearsInBusiness(p.years_in_business || "");
        setTeamDescription(p.team_description || "");
        setKeyDifferentiators(p.key_differentiators || "");
        setNotableClients(p.notable_clients || "");
        setIndustryFocus(p.industry_focus || "");
        setWebsiteUrl(p.website_url || "");
        setLogoUrl(p.logo_url);
        setMember1Url(p.team_member1_photo_url);
        setMember1Name(p.team_member1_name || "");
        setMember2Url(p.team_member2_photo_url);
        setMember2Name(p.team_member2_name || "");
        setProviderSignerName(p.provider_signer_name || "");
        setProviderSignerTitle(p.provider_signer_title || "");
        setProviderSignatureData(p.provider_signature_data);
      }
      setLoading(false);
    }
    loadProfile();
  }, []);

  function handleFileSelect(
    file: File | null,
    setFile: (f: File | null) => void,
    setPreview: (p: string | null) => void
  ) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("File must be under 5MB");
      return;
    }
    setFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function uploadFile(
    file: File,
    userId: string,
    prefix: string
  ): Promise<string | null> {
    const ext = file.name.split(".").pop() || "png";
    const path = `${userId}/${prefix}-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("profile-assets")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return null;
    }

    const { data } = supabase.storage
      .from("profile-assets")
      .getPublicUrl(path);

    return data.publicUrl;
  }

  function captureSignature(): string | null {
    if (sigMode === "draw") {
      if (sigCanvasRef.current && !sigCanvasRef.current.isEmpty()) {
        return sigCanvasRef.current.toDataURL("image/png");
      }
      return providerSignatureData;
    } else {
      if (!sigTypedName.trim()) return providerSignatureData;
      const canvas = document.createElement("canvas");
      canvas.width = 400;
      canvas.height = 100;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, 400, 100);
      ctx.font = "italic 36px Georgia, serif";
      ctx.fillStyle = "#1a1a2e";
      ctx.textBaseline = "middle";
      ctx.fillText(sigTypedName, 20, 50);
      return canvas.toDataURL("image/png");
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError("");

    // Get the profile ID for updates
    const { data: existingProfile } = await supabase
      .from("business_profiles")
      .select("id, user_id")
      .limit(1)
      .single();

    if (!existingProfile) {
      setError("No business profile found");
      setSaving(false);
      return;
    }

    let newLogoUrl = logoUrl;
    let newMember1Url = member1Url;
    let newMember2Url = member2Url;

    if (logoFile) {
      newLogoUrl = await uploadFile(logoFile, existingProfile.user_id, "logo");
      setLogoFile(null);
      setLogoPreview(null);
    }
    if (member1File) {
      newMember1Url = await uploadFile(member1File, existingProfile.user_id, "member1");
      setMember1File(null);
      setMember1Preview(null);
    }
    if (member2File) {
      newMember2Url = await uploadFile(member2File, existingProfile.user_id, "member2");
      setMember2File(null);
      setMember2Preview(null);
    }

    const sigData = captureSignature();

    const { error: dbError } = await supabase
      .from("business_profiles")
      .update({
        company_name: companyName || null,
        company_description: companyDescription || null,
        years_in_business: yearsInBusiness || null,
        team_description: teamDescription || null,
        key_differentiators: keyDifferentiators || null,
        notable_clients: notableClients || null,
        industry_focus: industryFocus || null,
        website_url: websiteUrl || null,
        logo_url: newLogoUrl,
        team_member1_photo_url: newMember1Url,
        team_member1_name: member1Name || null,
        team_member2_photo_url: newMember2Url,
        team_member2_name: member2Name || null,
        provider_signer_name: providerSignerName || null,
        provider_signer_title: providerSignerTitle || null,
        provider_signature_data: sigData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingProfile.id);

    if (dbError) {
      console.error("Save error:", JSON.stringify(dbError, null, 2));
      setError(`Failed to save: ${dbError.message || dbError.code || JSON.stringify(dbError)}`);
      setSaving(false);
      return;
    }

    setLogoUrl(newLogoUrl);
    setMember1Url(newMember1Url);
    setMember2Url(newMember2Url);
    setProviderSignatureData(sigData);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Business Profile
        </h1>
        <p className="text-gray-500 mt-1">
          Update your company info, logo, and team. These are used in
          every proposal you generate.
        </p>
      </div>

      <form
        onSubmit={handleSave}
        className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8 space-y-6"
      >
        {error && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Logo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Company Logo
          </label>
          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) =>
              handleFileSelect(
                e.target.files?.[0] || null,
                setLogoFile,
                setLogoPreview
              )
            }
          />
          {logoPreview || logoUrl ? (
            <div className="relative w-full h-28 border border-gray-200 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
              <img
                src={logoPreview || logoUrl || ""}
                alt="Logo"
                className="max-h-24 max-w-full object-contain"
              />
              <div className="absolute top-1.5 right-1.5 flex gap-1">
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="p-1 bg-white rounded-full shadow-sm border border-gray-200 hover:bg-gray-50"
                  title="Change logo"
                >
                  <Upload className="w-3 h-3 text-gray-500" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLogoFile(null);
                    setLogoPreview(null);
                    setLogoUrl(null);
                  }}
                  className="p-1 bg-white rounded-full shadow-sm border border-gray-200 hover:bg-gray-50"
                  title="Remove logo"
                >
                  <X className="w-3 h-3 text-gray-500" />
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              className="w-full h-28 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center gap-1.5 hover:border-gray-300 hover:bg-gray-50 transition-colors"
            >
              <Upload className="w-5 h-5 text-gray-400" />
              <span className="text-xs text-gray-400">Upload logo</span>
            </button>
          )}
        </div>

        {/* Team Members */}
        <div className="grid grid-cols-2 gap-4">
          <PhotoUpload
            label="Team Member 1"
            photoUrl={member1Url}
            photoPreview={member1Preview}
            nameValue={member1Name}
            namePlaceholder="Name & role"
            onFileSelect={(f) => handleFileSelect(f, setMember1File, setMember1Preview)}
            onRemove={() => { setMember1File(null); setMember1Preview(null); setMember1Url(null); }}
            onNameChange={setMember1Name}
            inputRef={member1InputRef}
          />
          <PhotoUpload
            label="Team Member 2"
            photoUrl={member2Url}
            photoPreview={member2Preview}
            nameValue={member2Name}
            namePlaceholder="Name & role"
            onFileSelect={(f) => handleFileSelect(f, setMember2File, setMember2Preview)}
            onRemove={() => { setMember2File(null); setMember2Preview(null); setMember2Url(null); }}
            onNameChange={setMember2Name}
            inputRef={member2InputRef}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Company Name
          </label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Acme Digital Agency"
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            What does your company do?
          </label>
          <textarea
            value={companyDescription}
            onChange={(e) => setCompanyDescription(e.target.value)}
            rows={3}
            placeholder="Describe your services and specialties..."
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Years in Business
            </label>
            <input
              type="text"
              value={yearsInBusiness}
              onChange={(e) => setYearsInBusiness(e.target.value)}
              placeholder="5+ years"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Website
            </label>
            <input
              type="url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://yourcompany.com"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Your Team
          </label>
          <textarea
            value={teamDescription}
            onChange={(e) => setTeamDescription(e.target.value)}
            rows={3}
            placeholder="Team background, expertise, founding story..."
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            What makes you different?
          </label>
          <textarea
            value={keyDifferentiators}
            onChange={(e) => setKeyDifferentiators(e.target.value)}
            rows={3}
            placeholder="Key differentiators, competitive advantages..."
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Notable clients or results
          </label>
          <textarea
            value={notableClients}
            onChange={(e) => setNotableClients(e.target.value)}
            rows={2}
            placeholder="Past clients, case studies, metrics..."
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Industries you serve
          </label>
          <input
            type="text"
            value={industryFocus}
            onChange={(e) => setIndustryFocus(e.target.value)}
            placeholder="SaaS, FinTech, E-commerce, Healthcare"
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
          />
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 pt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            Your Signature
          </h2>
          <p className="text-sm text-gray-500 mb-5">
            This signature will be pre-populated in every proposal you generate.
          </p>

          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Signer Name
              </label>
              <input
                type="text"
                value={providerSignerName}
                onChange={(e) => setProviderSignerName(e.target.value)}
                placeholder="John Smith"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Title / Role
              </label>
              <input
                type="text"
                value={providerSignerTitle}
                onChange={(e) => setProviderSignerTitle(e.target.value)}
                placeholder="CEO, Managing Director, etc."
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              />
            </div>
          </div>

          <label className="block text-sm font-medium text-gray-700 mb-2">
            Signature
          </label>

          {providerSignatureData && sigMode === "draw" && (
            <div className="mb-3 flex items-center gap-4">
              <div className="border border-gray-200 rounded-lg p-2 bg-gray-50">
                <img
                  src={providerSignatureData}
                  alt="Current signature"
                  className="h-12 object-contain"
                />
              </div>
              <button
                type="button"
                onClick={() => setProviderSignatureData(null)}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Replace signature
              </button>
            </div>
          )}

          {(!providerSignatureData || sigMode === "type") && (
            <>
              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setSigMode("draw")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    sigMode === "draw"
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  <PenLine className="w-3.5 h-3.5" />
                  Draw
                </button>
                <button
                  type="button"
                  onClick={() => setSigMode("type")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    sigMode === "type"
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  <Type className="w-3.5 h-3.5" />
                  Type
                </button>
              </div>

              {sigMode === "draw" ? (
                <div className="relative" ref={sigContainerRef}>
                  <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
                    <SignatureCanvas
                      key={sigCanvasWidth}
                      ref={sigCanvasRef}
                      penColor="#1a1a2e"
                      canvasProps={{
                        width: sigCanvasWidth,
                        height: 120,
                        style: { width: `${sigCanvasWidth}px`, height: "120px", touchAction: "none" },
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => sigCanvasRef.current?.clear()}
                    className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-gray-600 bg-white rounded-md border border-gray-200"
                    title="Clear"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <p className="text-xs text-gray-400 mt-1">
                    Draw your signature above
                  </p>
                </div>
              ) : (
                <div>
                  <input
                    type="text"
                    value={sigTypedName}
                    onChange={(e) => setSigTypedName(e.target.value)}
                    placeholder="Type your full name"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                  />
                  {sigTypedName && (
                    <div className="mt-3 border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <p
                        className="text-3xl text-gray-800"
                        style={{ fontFamily: "Georgia, serif", fontStyle: "italic" }}
                      >
                        {sigTypedName}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saved ? (
            <Check className="w-4 h-4" />
          ) : null}
          {saved ? "Saved" : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
