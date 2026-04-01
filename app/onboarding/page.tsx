"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Building2, ArrowRight, Upload, X, ImageIcon } from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const teamPhotoInputRef = useRef<HTMLInputElement>(null);

  const [companyName, setCompanyName] = useState("");
  const [companyDescription, setCompanyDescription] = useState("");
  const [yearsInBusiness, setYearsInBusiness] = useState("");
  const [teamDescription, setTeamDescription] = useState("");
  const [keyDifferentiators, setKeyDifferentiators] = useState("");
  const [notableClients, setNotableClients] = useState("");
  const [industryFocus, setIndustryFocus] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [teamPhotoFile, setTeamPhotoFile] = useState<File | null>(null);
  const [teamPhotoPreview, setTeamPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  async function uploadFile(file: File, userId: string, prefix: string): Promise<string | null> {
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }

    // Upload images if provided
    let logoUrl: string | null = null;
    let teamPhotoUrl: string | null = null;

    if (logoFile) {
      logoUrl = await uploadFile(logoFile, user.id, "logo");
    }
    if (teamPhotoFile) {
      teamPhotoUrl = await uploadFile(teamPhotoFile, user.id, "team");
    }

    const { error: dbError } = await supabase
      .from("business_profiles")
      .upsert({
        user_id: user.id,
        company_name: companyName || null,
        company_description: companyDescription || null,
        years_in_business: yearsInBusiness || null,
        team_description: teamDescription || null,
        key_differentiators: keyDifferentiators || null,
        notable_clients: notableClients || null,
        industry_focus: industryFocus || null,
        website_url: websiteUrl || null,
        logo_url: logoUrl,
        team_photo_url: teamPhotoUrl,
      });

    if (dbError) {
      setError("Failed to save profile. Please try again.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  function handleSkip() {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("business_profiles").upsert({
          user_id: user.id,
        });
      }
      router.push("/dashboard");
      router.refresh();
    })();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-50 rounded-2xl mb-4">
            <Building2 className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Tell us about your business
          </h1>
          <p className="text-gray-500 mt-2 max-w-lg mx-auto">
            This helps AI craft compelling &ldquo;Why Us&rdquo; and &ldquo;Our
            Team&rdquo; sections in every proposal. Write naturally — a few
            sentences per field is perfect.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8 space-y-6"
        >
          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Logo & Team Photo uploads */}
          <div className="grid grid-cols-2 gap-4">
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
              {logoPreview ? (
                <div className="relative w-full h-28 border border-gray-200 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="max-h-24 max-w-full object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setLogoFile(null);
                      setLogoPreview(null);
                    }}
                    className="absolute top-1.5 right-1.5 p-1 bg-white rounded-full shadow-sm border border-gray-200 hover:bg-gray-50"
                  >
                    <X className="w-3 h-3 text-gray-500" />
                  </button>
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Team Photo
              </label>
              <input
                ref={teamPhotoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) =>
                  handleFileSelect(
                    e.target.files?.[0] || null,
                    setTeamPhotoFile,
                    setTeamPhotoPreview
                  )
                }
              />
              {teamPhotoPreview ? (
                <div className="relative w-full h-28 border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                  <img
                    src={teamPhotoPreview}
                    alt="Team preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setTeamPhotoFile(null);
                      setTeamPhotoPreview(null);
                    }}
                    className="absolute top-1.5 right-1.5 p-1 bg-white rounded-full shadow-sm border border-gray-200 hover:bg-gray-50"
                  >
                    <X className="w-3 h-3 text-gray-500" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => teamPhotoInputRef.current?.click()}
                  className="w-full h-28 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center gap-1.5 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  <ImageIcon className="w-5 h-5 text-gray-400" />
                  <span className="text-xs text-gray-400">Upload team photo</span>
                </button>
              )}
            </div>
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
              placeholder="We build high-converting websites and AI-powered systems for B2B SaaS companies. Our focus is on design-led development that drives measurable revenue growth."
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">
              Services, specialties, what makes you great at what you do.
            </p>
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
              placeholder="Founded by two ex-Google engineers with 15 years of combined experience. Our team of 8 includes senior designers, full-stack developers, and a dedicated project manager."
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">
              Background, expertise, founding story — anything that builds trust.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              What makes you different?
            </label>
            <textarea
              value={keyDifferentiators}
              onChange={(e) => setKeyDifferentiators(e.target.value)}
              rows={3}
              placeholder="We combine deep AI expertise with conversion-focused design. Every project gets a dedicated strategist. We've generated over $10M in pipeline for our clients."
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">
              Key differentiators, unique approach, competitive advantages.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Notable clients or results
            </label>
            <textarea
              value={notableClients}
              onChange={(e) => setNotableClients(e.target.value)}
              rows={2}
              placeholder="Worked with Shopify, Notion, and 50+ funded startups. Helped a Series A company 3x their demo bookings in 90 days."
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

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
              Save & Continue
            </button>
            <button
              type="button"
              onClick={handleSkip}
              className="px-6 py-3 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Skip for now
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
