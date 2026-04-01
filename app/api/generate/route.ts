import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { anthropic, PROPOSAL_SYSTEM_PROMPT } from "@/lib/anthropic";
import { SERVICES_AGREEMENT_HTML } from "@/lib/agreement";
import type { BusinessProfile, ProposalStructuredContent } from "@/lib/types";

function structuredToHtml(s: ProposalStructuredContent): string {
  let html = "";

  html += `<h2>1. Opening</h2><p>${s.opening}</p>`;

  html += `<h2>2. Your Problem Areas</h2><p>${s.problemContext}</p>`;
  for (const p of s.problems) {
    html += `<h3>${p.title}</h3><p>${p.description}</p><p><strong>${p.consequence}</strong></p>`;
  }

  html += `<h2>3. Your Solution</h2><p>${s.solutionOverview}</p>`;
  for (const c of s.solutionComponents) {
    html += `<h3>${c.name}</h3><p>${c.description}</p><p>${c.benefit}</p>`;
  }

  html += `<h2>4. Why Us</h2><p>${s.whyUsStatement}</p>`;
  for (const b of s.proofBlocks) {
    html += `<h3>${b.headline}</h3><p>${b.description}</p>`;
  }

  html += `<h2>5. Why That Matters to You</h2><ul>`;
  for (const m of s.whyMatters) {
    html += `<li>${m}</li>`;
  }
  html += `</ul><p>${s.whyMattersClosing}</p>`;

  html += `<h2>6. Our Team</h2><p>${s.teamStory}</p>`;

  html += `<h2>7. What Working With Us Looks Like</h2>`;
  for (const t of s.timeline) {
    html += `<h3>${t.step}. ${t.title}</h3><p>${t.description}</p><p>${t.why}</p>`;
  }

  html += `<h2>8. Investment</h2>`;
  html += `<table><thead><tr><th>Item</th><th>Amount</th></tr></thead><tbody>`;
  for (const i of s.investmentItems) {
    html += `<tr><td>${i.item}</td><td>${i.amount}</td></tr>`;
  }
  html += `</tbody></table>`;
  html += `<p>${s.investmentRoi}</p>`;

  html += `<h2>9. Services Agreement</h2>${s.agreement}`;

  return html;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServiceClient();

    const body = await request.json();
    const {
      title,
      clientName,
      clientEmail,
      inputMode,
      description,
      transcript,
      paymentType,
      totalAmount,
      depositAmount,
      milestones,
    } = body;

    const inputText = inputMode === "transcript" ? transcript : description;
    if (!inputText) {
      return NextResponse.json(
        {
          error:
            inputMode === "transcript"
              ? "Call transcript is required"
              : "Project description is required",
        },
        { status: 400 }
      );
    }

    // Fetch business profile
    const { data: profileData } = await supabase
      .from("business_profiles")
      .select("*")
      .limit(1)
      .single();

    const profile = profileData as unknown as BusinessProfile | null;

    // Build company profile context
    let companyContext = "";
    if (profile) {
      const parts: string[] = [];
      if (profile.company_name) parts.push(`Company Name: ${profile.company_name}`);
      if (profile.company_description) parts.push(`What We Do: ${profile.company_description}`);
      if (profile.years_in_business) parts.push(`Years in Business: ${profile.years_in_business}`);
      if (profile.team_description) parts.push(`Our Team: ${profile.team_description}`);
      if (profile.key_differentiators) parts.push(`Differentiators: ${profile.key_differentiators}`);
      if (profile.notable_clients) parts.push(`Notable Clients: ${profile.notable_clients}`);
      if (profile.industry_focus) parts.push(`Industries: ${profile.industry_focus}`);
      if (parts.length > 0) {
        companyContext = `\n\nCOMPANY PROFILE (Service Provider):\n${parts.join("\n")}`;
      }
    }

    // Build pricing context
    let pricingContext = "";
    const hasManualPricing = totalAmount || depositAmount ||
      (milestones && milestones.some((m: { amount: number | null }) => m.amount));

    if (hasManualPricing) {
      pricingContext += "\n\nPRICING (FINAL - use these exact numbers, do not change):";
    }
    if (totalAmount) {
      pricingContext += `\nTotal Amount: $${(totalAmount / 100).toLocaleString()}`;
    }
    if (depositAmount && paymentType === "deposit_milestone") {
      pricingContext += `\nDeposit: $${(depositAmount / 100).toLocaleString()}`;
    }
    if (milestones && milestones.length > 0) {
      const milestonesWithPricing = milestones
        .map(
          (m: { name: string; amount: number | null }, i: number) =>
            `  ${i + 1}. ${m.name}${m.amount ? ` - $${(m.amount / 100).toLocaleString()}` : " - TBD"}`
        )
        .join("\n");
      pricingContext += `\nMilestones:\n${milestonesWithPricing}`;
    }
    if (paymentType) {
      pricingContext += `\nPayment Structure: ${paymentType.replace(/_/g, " ")}`;
    }

    const noPricingProvided =
      !totalAmount &&
      !depositAmount &&
      (!milestones || milestones.every((m: { amount: number | null }) => !m.amount));

    let userPrompt: string;

    if (inputMode === "transcript") {
      userPrompt = `Analyze this sales call transcript and generate a structured proposal.
${companyContext}

${title ? `Proposal title: "${title}"` : "Suggest a title."}
${clientName ? `Client: "${clientName}"` : "Extract from transcript."}
${pricingContext || (noPricingProvided ? "\nNo pricing provided — suggest market-rate pricing." : "")}

TRANSCRIPT:
---
${transcript}
---

Respond with the JSON structure specified in the system prompt.`;
    } else {
      userPrompt = `Generate a structured proposal from this description.
${companyContext}

${title ? `Proposal title: "${title}"` : "Suggest a title."}
${clientName ? `Client: "${clientName}"` : "Infer client name or use placeholder."}

Description:
${description}
${pricingContext || (noPricingProvided ? "\nNo pricing provided — suggest market-rate pricing." : "")}

Respond with the JSON structure specified in the system prompt.`;
    }

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 16384,
      system: PROPOSAL_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const rawResponse =
      message.content[0].type === "text" ? message.content[0].text : "";

    let finalTitle = title || "Untitled Proposal";
    let finalClientName = clientName || null;
    let structuredContent: ProposalStructuredContent | null = null;
    let generatedHtml = "";

    try {
      // Strip markdown code fences if present
      let cleanResponse = rawResponse.trim();
      const codeBlockMatch = rawResponse.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) {
        cleanResponse = codeBlockMatch[1].trim();
      }

      // Try parsing the clean response directly first, then fall back to regex extraction
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let parsed: any = null;
      try {
        parsed = JSON.parse(cleanResponse);
      } catch {
        const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        }
      }

      if (parsed) {
        if (!title && parsed.title) finalTitle = parsed.title;
        if (!clientName && parsed.clientName) finalClientName = parsed.clientName;

        // Support both nested content and flat structure
        const contentData = parsed.content || parsed;

        if (contentData.opening && contentData.problems) {
          structuredContent = {
            ...contentData,
            agreement: SERVICES_AGREEMENT_HTML,
            providerCompany: contentData.providerCompany || profile?.company_name || "",
            logoUrl: profile?.logo_url || undefined,
            teamPhotoUrl: undefined,
            providerSignerName: profile?.provider_signer_name || undefined,
            providerSignerTitle: profile?.provider_signer_title || undefined,
            providerSignatureData: profile?.provider_signature_data || undefined,
            teamMember1PhotoUrl: profile?.team_member1_photo_url || undefined,
            teamMember1Name: profile?.team_member1_name || undefined,
            teamMember2PhotoUrl: profile?.team_member2_photo_url || undefined,
            teamMember2Name: profile?.team_member2_name || undefined,
            proposalDate: new Date().toISOString(),
          };
          generatedHtml = structuredToHtml(structuredContent!);
          console.log("Structured content parsed successfully");
        } else if (parsed.html) {
          generatedHtml = parsed.html;
          console.log("Fallback to parsed.html");
        } else {
          console.log("JSON parsed but no structured content found. Keys:", Object.keys(parsed));
          console.log("Content keys:", contentData ? Object.keys(contentData) : "no content");
          generatedHtml = rawResponse;
        }
      } else {
        console.log("No JSON found in response. First 200 chars:", rawResponse.substring(0, 200));
        generatedHtml = rawResponse;
      }
    } catch (parseError) {
      console.error("JSON parsing failed:", parseError);
      console.log("Raw response first 500 chars:", rawResponse.substring(0, 500));
      generatedHtml = rawResponse;
    }

    // Calculate total - manual pricing always prevails
    let finalTotalAmount = totalAmount;
    let finalDepositAmount = depositAmount;

    // If manual pricing was provided via milestones, calculate total from those
    if (!finalTotalAmount && paymentType === "deposit_milestone") {
      const milestonesTotal = milestones
        ? milestones.reduce((sum: number, m: { amount: number | null }) => sum + (m.amount || 0), 0)
        : 0;
      if (milestonesTotal > 0 || (depositAmount && depositAmount > 0)) {
        finalTotalAmount = (depositAmount || 0) + milestonesTotal;
      }
    }

    // If still no total, extract from AI-generated investment items
    if (!finalTotalAmount && structuredContent?.investmentItems) {
      // Try to find a "Total" line item
      const totalItem = structuredContent.investmentItems.find(
        (item: { item: string; amount: string }) => /total/i.test(item.item)
      );
      if (totalItem) {
        const amountParsed = parseFloat(totalItem.amount.replace(/[^0-9.]/g, ""));
        if (!isNaN(amountParsed) && amountParsed > 0) {
          finalTotalAmount = Math.round(amountParsed * 100);
        }
      }

      // If no "Total" item, sum all items
      if (!finalTotalAmount) {
        let sum = 0;
        for (const item of structuredContent.investmentItems) {
          const amountParsed = parseFloat(item.amount.replace(/[^0-9.]/g, ""));
          if (!isNaN(amountParsed)) sum += amountParsed;
        }
        if (sum > 0) {
          finalTotalAmount = Math.round(sum * 100);
        }
      }

      // For deposit_milestone with AI pricing, set deposit to the first line item amount
      if (finalTotalAmount && paymentType === "deposit_milestone" && !finalDepositAmount) {
        const firstItem = structuredContent.investmentItems[0];
        if (firstItem) {
          const firstAmount = parseFloat(firstItem.amount.replace(/[^0-9.]/g, ""));
          if (!isNaN(firstAmount) && firstAmount > 0) {
            finalDepositAmount = Math.round(firstAmount * 100);
          }
        }
        // Fallback to 50% if parsing failed
        if (!finalDepositAmount) {
          finalDepositAmount = Math.round(finalTotalAmount / 2);
        }
      }
    }

    const content = structuredContent
      ? { type: "structured", structured: structuredContent, html: generatedHtml }
      : { type: "html", html: generatedHtml, structured: null };

    const { data: proposal, error: dbError } = await supabase
      .from("proposals")
      .insert({
        user_id: (profileData as any)?.user_id || null,
        title: finalTitle,
        client_name: finalClientName,
        client_email: clientEmail || null,
        content,
        status: "draft",
        payment_type: paymentType,
        total_amount: finalTotalAmount || null,
        deposit_amount: finalDepositAmount || null,
      })
      .select("id")
      .single();

    if (dbError) {
      console.error("Database error:", JSON.stringify(dbError, null, 2));
      return NextResponse.json(
        { error: `Failed to save proposal: ${dbError.message || dbError.code}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ proposalId: proposal.id });
  } catch (error) {
    console.error("Generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate proposal" },
      { status: 500 }
    );
  }
}
