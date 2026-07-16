"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  X, Send, Eye, Search, Plus, Trash2, Edit3,
  Phone, Mail, Check,
} from "lucide-react";
import { wrapEmailHtml, renderTemplateVars, SAMPLE_PREVIEW_VARS } from "@/lib/emailWrapper";

// Types
interface TemplateRecord {
  id: string; name: string; type: string; subject: string | null; body: string; isActive: boolean;
}
interface GuestRecord {
  id: string; firstName: string; lastName: string; email: string; phone: string | null;
  emailOptIn: boolean; smsOptIn: boolean; doNotContact: boolean;
}
interface CtaLink {
  id: string; label: string; url: string; description: string | null; isActive: boolean;
}

const stripHtml = (html: string) => html.replace(/<[^>]+>/g, "");

// ── CTA Link Manager (inline) ──
function CtaLinkManager({ ctaLinks, onRefresh }: { ctaLinks: CtaLink[]; onRefresh: () => void }) {
  const [editing, setEditing] = useState<Partial<CtaLink> | null>(null);
  const [saving, setSaving] = useState(false);
  const activeLinks = ctaLinks.filter(l => l.isActive);

  const save = async () => {
    if (!editing || !editing.label?.trim() || !editing.url?.trim()) return;
    setSaving(true);
    const isNew = !editing.id;
    const url = isNew ? "/api/admin/cta-links" : `/api/admin/cta-links/${editing.id}`;
    const method = isNew ? "POST" : "PUT";
    try {
      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: editing.label, url: editing.url, description: editing.description || null, isActive: true }),
      });
      setEditing(null);
      onRefresh();
    } catch { /* ignore */ }
    setSaving(false);
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this CTA link?")) return;
    try { await fetch(`/api/admin/cta-links/${id}`, { method: "DELETE" }); onRefresh(); } catch { /* ignore */ }
  };

  return (
    <div className="border border-light-gray bg-cream/50 p-3">
      <p className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium mb-3">Call-to-Action Links</p>
      {activeLinks.length > 0 && (
        <div className="space-y-1.5 mb-3 max-h-32 overflow-y-auto">
          {activeLinks.map(link => (
            <div key={link.id} className="flex items-center justify-between text-xs bg-white border border-light-gray px-2 py-1.5 group">
              <div className="min-w-0 flex-1">
                <p className="text-charcoal truncate font-medium">{link.label}</p>
                <p className="text-[10px] text-warm-gray truncate">{link.url}</p>
              </div>
              <div className="flex items-center gap-1 ml-2 shrink-0 opacity-0 group-hover:opacity-100 transition">
                <button onClick={() => setEditing({ id: link.id, label: link.label, url: link.url, description: link.description, isActive: link.isActive })} className="text-warm-gray hover:text-charcoal p-1" title="Edit"><Edit3 size={11} /></button>
                <button onClick={() => remove(link.id)} className="text-warm-gray hover:text-red-600 p-1" title="Delete"><Trash2 size={11} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
      {editing ? (
        <div className="space-y-2">
          <input value={editing.label || ""} onChange={e => setEditing(p => ({ ...p!, label: e.target.value }))} placeholder="Button text e.g. 'Book Now'" className="w-full border border-light-gray text-[11px] px-2.5 py-2 outline-none focus:border-charcoal/40" />
          <input value={editing.url || ""} onChange={e => setEditing(p => ({ ...p!, url: e.target.value }))} placeholder="https://..." className="w-full border border-light-gray text-[11px] px-2.5 py-2 outline-none focus:border-charcoal/40" />
          <div className="flex gap-2">
            <button onClick={save} disabled={saving} className="bg-charcoal text-white text-[10px] tracking-[0.1em] uppercase font-medium px-3 py-2 disabled:opacity-50">{saving ? "Saving..." : editing.id ? "Update" : "Add Link"}</button>
            <button onClick={() => setEditing(null)} className="border border-light-gray text-[10px] tracking-[0.1em] uppercase px-3 py-2 hover:bg-cream">Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setEditing({ label: "", url: "", description: "", isActive: true })} className="text-[10px] tracking-[0.1em] uppercase text-charcoal/60 hover:text-charcoal flex items-center gap-1"><Plus size={11} /> Add CTA Link</button>
      )}
    </div>
  );
}

// ── Main Modal ──
export default function SendCommunicationModal({ open, onClose, templates }: { open: boolean; onClose: () => void; templates: TemplateRecord[] }) {
  const [channel, setChannel] = useState<"email" | "sms">("email");
  const [guestSearch, setGuestSearch] = useState("");
  const [guests, setGuests] = useState<GuestRecord[]>([]);
  const [selectedGuest, setSelectedGuest] = useState<GuestRecord | null>(null);
  const [guestDropdownOpen, setGuestDropdownOpen] = useState(false);
  const [loadingGuests, setLoadingGuests] = useState(false);
  const [templateId, setTemplateId] = useState("");
  const [ctaLinks, setCtaLinks] = useState<CtaLink[]>([]);
  const [selectedCtaId, setSelectedCtaId] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (!open) return; fetch("/api/admin/cta-links").then(r => r.ok ? r.json() : []).then(setCtaLinks).catch(() => {}); }, [open]);

  useEffect(() => {
    if (!guestSearch.trim() || guestSearch.length < 2) { setGuests([]); return; }
    const t = setTimeout(async () => {
      setLoadingGuests(true);
      try { const res = await fetch(`/api/admin/guests?search=${encodeURIComponent(guestSearch)}&limit=15`); if (res.ok) setGuests(await res.json()); } catch { }
      setLoadingGuests(false);
    }, 300);
    return () => clearTimeout(t);
  }, [guestSearch]);

  const channelTemplates = useMemo(() => templates.filter(t => t.isActive && t.type === channel), [templates, channel]);
  const selectedTemplate = templates.find(t => t.id === templateId);
  const selectedCta = ctaLinks.find(c => c.id === selectedCtaId);

  const buildPreviewBody = () => {
    let body = selectedTemplate?.body || "No template selected.";
    if (selectedCta) {
      body += channel === "email"
        ? `<div style="text-align:center;margin-top:24px;"><a href="${selectedCta.url}" style="display:inline-block;padding:12px 28px;background:#1a1a1a;color:#fff;text-decoration:none;font-size:13px;font-weight:600;border-radius:2px;">${selectedCta.label}</a></div>`
        : `\n\n${selectedCta.label}: ${selectedCta.url}`;
    }
    return renderTemplateVars(body, selectedGuest ? {
      guestName: [selectedGuest.firstName, selectedGuest.lastName].filter(Boolean).join(" ") || selectedGuest.email,
      firstName: selectedGuest.firstName || "", lastName: selectedGuest.lastName || "",
      fullName: [selectedGuest.firstName, selectedGuest.lastName].filter(Boolean).join(" ") || selectedGuest.email,
      guestEmail: selectedGuest.email, guestPhone: selectedGuest.phone || "",
      listingTitle: "The Main Home", propertyName: "The Main Home",
      checkIn: "Fri, Aug 15, 2026", checkOut: "Mon, Aug 18, 2026", nights: "3", guestCount: "2",
      totalPrice: "$2,331.90", confirmationCode: "AVX-7F314F28",
      portalLink: "https://avenue10.net/checkin", website: "https://avenue10.net", companyName: "Avenue10",
      accessCode: "4829", today: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", weekday: "short" }),
    } : SAMPLE_PREVIEW_VARS);
  };

  const handleSend = async () => {
    if (!selectedGuest || !selectedTemplate) return;
    setError(null); setSending(true);
    try {
      const res = await fetch("/api/admin/send-communication", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ channel, guestId: selectedGuest.id, templateId: selectedTemplate.id, ctaLinkId: selectedCtaId || null }) });
      if (res.ok) { setSent(true); setTimeout(() => { onClose(); setSent(false); reset(); }, 2000); }
      else { const data = await res.json(); setError(data.error || "Send failed."); }
    } catch { setError("Network error. Try again."); }
    setSending(false);
  };

  const reset = () => { setChannel("email"); setGuestSearch(""); setGuests([]); setSelectedGuest(null); setTemplateId(""); setSelectedCtaId(""); setPreviewOpen(false); setError(null); };
  if (!open) return null;

  if (sent) {
    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
        <div className="relative bg-white p-8 text-center shadow-xl border border-light-gray max-w-sm w-full">
          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3"><Check size={24} className="text-emerald-600" /></div>
          <p className="text-lg font-serif text-charcoal mb-1">Sent!</p>
          <p className="text-xs text-warm-gray">{channel === "email" ? "Email" : "SMS"} to {selectedGuest?.firstName || selectedGuest?.email}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[70] flex justify-center items-start py-8 px-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full max-w-lg shadow-xl border border-light-gray">
        <div className="sticky top-0 bg-white border-b border-light-gray p-4 flex items-center justify-between z-10">
          <div>
            <p className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium">Send Communication</p>
            <h2 className="font-serif text-lg text-charcoal">Instant Message</h2>
          </div>
          <button onClick={onClose} className="text-warm-gray hover:text-charcoal"><X size={18} /></button>
        </div>

        <div className="p-4 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Channel */}
          <div>
            <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-2">Channel</label>
            <div className="inline-flex border border-light-gray bg-white">
              <button onClick={() => { setChannel("email"); setTemplateId(""); }} className={`text-[9px] tracking-[0.15em] uppercase font-medium px-4 py-2.5 transition flex items-center gap-1.5 ${channel === "email" ? "bg-charcoal text-white" : "text-charcoal/60 hover:text-charcoal"}`}><Mail size={11} /> Email</button>
              <button onClick={() => { setChannel("sms"); setTemplateId(""); }} className={`text-[9px] tracking-[0.15em] uppercase font-medium px-4 py-2.5 transition flex items-center gap-1.5 ${channel === "sms" ? "bg-charcoal text-white" : "text-charcoal/60 hover:text-charcoal"}`}><Phone size={11} /> SMS</button>
            </div>
          </div>

          {/* Guest */}
          <div>
            <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-2">Guest *</label>
            {selectedGuest ? (
              <div className="flex items-center justify-between border border-charcoal/40 bg-cream px-3 py-2">
                <div className="min-w-0">
                  <p className="text-xs text-charcoal font-medium truncate">{[selectedGuest.firstName, selectedGuest.lastName].filter(Boolean).join(" ") || selectedGuest.email}</p>
                  <p className="text-[10px] text-warm-gray truncate">{channel === "email" ? selectedGuest.email : selectedGuest.phone || "No phone"}</p>
                </div>
                <button onClick={() => { setSelectedGuest(null); setGuestSearch(""); }} className="text-warm-gray hover:text-red-600 p-1 shrink-0 ml-2"><X size={14} /></button>
              </div>
            ) : (
              <div className="relative">
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray" />
                  <input value={guestSearch} onChange={e => { setGuestSearch(e.target.value); setGuestDropdownOpen(true); }} onFocus={() => setGuestDropdownOpen(true)} onBlur={() => setTimeout(() => setGuestDropdownOpen(false), 200)} placeholder="Search guests by name or email..." className="w-full border border-light-gray pl-8 pr-3 py-2.5 text-xs text-charcoal outline-none focus:border-charcoal/40" />
                  {loadingGuests && <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-warm-gray">...</div>}
                </div>
                {guestDropdownOpen && guests.length > 0 && (
                  <div className="absolute z-20 w-full bg-white border border-light-gray shadow-lg max-h-52 overflow-y-auto mt-1">
                    {guests.map(g => (
                      <button key={g.id} onMouseDown={() => { setSelectedGuest(g); setGuestSearch(""); setGuestDropdownOpen(false); }} className={`w-full text-left px-3 py-2.5 hover:bg-cream transition border-b border-light-gray/50 last:border-0 ${g.doNotContact ? "opacity-50" : ""}`}>
                        <p className="text-xs text-charcoal font-medium truncate">{[g.firstName, g.lastName].filter(Boolean).join(" ") || g.email}{g.doNotContact && <span className="text-[10px] text-red-600 ml-2">DNC</span>}</p>
                        <p className="text-[10px] text-warm-gray truncate">{g.email}{g.phone ? ` · ${g.phone}` : ""}</p>
                      </button>
                    ))}
                  </div>
                )}
                {guestDropdownOpen && guestSearch.length >= 2 && !loadingGuests && guests.length === 0 && (
                  <div className="absolute z-20 w-full bg-white border border-light-gray shadow-lg p-3 text-center text-xs text-warm-gray mt-1">No guests found</div>
                )}
              </div>
            )}
          </div>

          {/* Template */}
          <div>
            <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-2">Template *</label>
            {channelTemplates.length === 0 ? (
              <p className="text-xs text-warm-gray italic">No {channel} templates. Create one in the Templates tab.</p>
            ) : (
              <select value={templateId} onChange={e => setTemplateId(e.target.value)} className="w-full border border-light-gray text-xs px-3 py-2.5 outline-none focus:border-charcoal/40 bg-white">
                <option value="">Select a template...</option>
                {channelTemplates.map(t => (<option key={t.id} value={t.id}>{t.name}{t.subject ? ` — ${t.subject}` : ""}</option>))}
              </select>
            )}
          </div>

          {/* CTA */}
          <div>
            <CtaLinkManager ctaLinks={ctaLinks} onRefresh={async () => { try { const res = await fetch("/api/admin/cta-links"); if (res.ok) setCtaLinks(await res.json()); } catch { } }} />
            {ctaLinks.filter(l => l.isActive).length > 0 && (
              <div className="mt-2">
                <label className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium block mb-1">Attach CTA</label>
                <select value={selectedCtaId} onChange={e => setSelectedCtaId(e.target.value)} className="w-full border border-light-gray text-xs px-3 py-2.5 outline-none focus:border-charcoal/40 bg-white">
                  <option value="">None</option>
                  {ctaLinks.filter(l => l.isActive).map(link => (<option key={link.id} value={link.id}>{link.label}</option>))}
                </select>
              </div>
            )}
          </div>

          {error && (<div className="bg-red-50 border border-red-200 p-3"><p className="text-xs text-red-700">{error}</p></div>)}

          <div className="flex gap-2 pt-2">
            <button onClick={() => setPreviewOpen(true)} disabled={!selectedTemplate} className="flex-1 border border-light-gray text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-cream transition px-4 py-3 disabled:opacity-40 flex items-center justify-center gap-1.5"><Eye size={12} /> Preview</button>
            <button onClick={handleSend} disabled={!selectedGuest || !selectedTemplate || sending} className="flex-1 bg-charcoal text-white text-[10px] tracking-[0.15em] uppercase font-medium hover:bg-stone transition px-4 py-3 disabled:opacity-40 flex items-center justify-center gap-1.5"><Send size={12} /> {sending ? "Sending..." : channel === "email" ? "Send Email" : "Send SMS"}</button>
          </div>
        </div>

        {/* Preview Modal */}
        {previewOpen && selectedTemplate && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={() => setPreviewOpen(false)} />
            <div className="relative bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl border border-light-gray">
              <div className="sticky top-0 bg-white border-b border-light-gray p-4 flex items-center justify-between z-10">
                <div><p className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium">{channel === "sms" ? "SMS Preview" : "Email Preview"}</p><h2 className="font-serif text-lg text-charcoal">{selectedTemplate.name}</h2></div>
                <button onClick={() => setPreviewOpen(false)} className="text-warm-gray hover:text-charcoal"><X size={18} /></button>
              </div>
              <div className="p-4">
                {channel === "sms" ? (
                  <div className="border border-light-gray rounded-3xl p-4 max-w-sm mx-auto bg-white">
                    <p className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium text-center mb-3">Avenue10</p>
                    <div className="max-w-[280px] rounded-2xl bg-gray-200 text-sm p-3 whitespace-pre-wrap">{stripHtml(buildPreviewBody())}</div>
                    {selectedCta && <div className="mt-3 text-center"><span className="text-[10px] text-blue-600 underline">{selectedCta.label}: {selectedCta.url}</span></div>}
                  </div>
                ) : (
                  <>
                    <div className="mb-3"><p className="text-[9px] tracking-[0.15em] uppercase text-warm-gray font-medium mb-1">Subject</p><p className="text-sm">{renderTemplateVars(selectedTemplate.subject || "", SAMPLE_PREVIEW_VARS) || <span className="text-warm-gray">(no subject)</span>}</p></div>
                    <iframe title="Email preview" sandbox="" srcDoc={wrapEmailHtml(buildPreviewBody())} className="w-full bg-white border border-light-gray h-[520px]" />
                  </>
                )}
                {selectedGuest && (
                  <div className="mt-3 bg-cream/50 border border-light-gray p-3 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-charcoal/10 flex items-center justify-center text-xs font-medium text-charcoal">{(selectedGuest.firstName || "?")[0]}{(selectedGuest.lastName || "")[0]}</div>
                    <div className="text-xs"><p className="font-medium">{[selectedGuest.firstName, selectedGuest.lastName].filter(Boolean).join(" ") || selectedGuest.email}</p><p className="text-warm-gray">{channel === "email" ? selectedGuest.email : selectedGuest.phone || "No phone"}</p></div>
                    {selectedGuest.doNotContact && <span className="text-[9px] tracking-[0.1em] uppercase font-medium px-2 py-0.5 text-red-700 bg-red-50 ml-auto">DNC</span>}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
