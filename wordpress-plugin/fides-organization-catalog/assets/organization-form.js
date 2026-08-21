(function () {
  const config = window.FIDES_ORG_FORM_CONFIG || {};
  const mode = config.mode === "update" ? "update" : "create";
  const root =
    document.getElementById(
      mode === "update" ? "fides-organization-update-form-root" : "fides-organization-submit-form-root"
    ) || document.querySelector(".fides-org-submission-root");
  if (!root) return;

  const apiBase = String(config.apiBase || "").replace(/\/$/, "");
  const restNonce = String(config.restNonce || "").trim();
  const contactEmail = String(config.contactEmail || "").trim();
  const sectors = Array.isArray(config.sectors) ? config.sectors : [];
  const ecosystemRoles = Array.isArray(config.ecosystemRoles) ? config.ecosystemRoles : [];
  const fieldHelp = config.fieldHelp && typeof config.fieldHelp === "object" ? config.fieldHelp : {};
  const countries = Array.isArray(config.countries) ? config.countries : [];
  const selfDeclaredCertifications = Array.isArray(config.selfDeclaredCertifications)
    ? config.selfDeclaredCertifications
    : [];
  const diaccComponents = Array.isArray(config.diaccComponents) ? config.diaccComponents : [];
  const sectionIntro = String(config.sectionIntro || "").trim();
  let selectedOrgId = mode === "update" ? String(config.preselectOrgId || "").trim() : "";
  let selectedOrgLabel = "";
  let planTier =
    config.planTier && typeof config.planTier === "object"
      ? { ...config.planTier }
      : { tierUiEnabled: false, tier: "Community", isPro: false, hasFullListing: false, plansUrl: "/plans/", descriptionMaxLength: 200 };
  const v2Limits = config.v2Limits && typeof config.v2Limits === "object" ? config.v2Limits : {};

  function tierUiEnabled() {
    return planTier.tierUiEnabled === true;
  }

  function fullListingFieldsEnabled() {
    return !tierUiEnabled() || !!planTier.isPro || !!planTier.hasFullListing;
  }

  const ORG_PRO_FIELD_IDS = [
    "fides-org-website",
    "fides-org-tags",
    "fides-org-offerings-input",
    "fides-org-public-contact-email",
    "fides-org-book-meeting-url",
  ];

  const ORG_OFFERINGS_MAX = 15;
  const ORG_OFFERING_MAX_LENGTH = 80;
  const offeringsSuggestions = Array.isArray(config.offeringsSuggestions) ? config.offeringsSuggestions : [];
  let offeringsValues = [];
  let offeringsSuggestionIndex = -1;

  function proBadgeHtml() {
    if (!!planTier.isPro || planTier.tier === "Pro") {
      return '<span class="fides-pro-plan-badge fides-pro-plan-badge--label">Pro plan</span>';
    }
    if (fullListingFieldsEnabled()) {
      return '<span class="fides-pro-plan-badge fides-pro-plan-badge--label">Full listing</span>';
    }
    const url = String(planTier.plansUrl || "/plans/");
    return `<a href="${escapeHtml(url)}" class="fides-pro-plan-badge" target="_blank" rel="noopener">Pro plan</a>`;
  }

  function labelWithProIfNeeded(labelText, isProField) {
    if (!tierUiEnabled() || !isProField) return labelText;
    return `${labelText} ${proBadgeHtml()}`;
  }

  function updateProFieldLabels() {
    root.querySelectorAll("[data-pro-label]").forEach((el) => {
      const text = el.getAttribute("data-pro-label");
      if (text) el.innerHTML = labelWithProIfNeeded(text, true);
    });
  }

  async function refreshPlanTier(orgId) {
    const id = String(orgId || "").trim();
    if (!id || !apiBase) {
      planTier = {
        tierUiEnabled: planTier.tierUiEnabled,
        tier: "Community",
        isPro: false,
        hasFullListing: false,
        plansUrl: planTier.plansUrl || "/plans/",
        descriptionMaxLength: 200,
      };
      applyTierFieldState();
      return;
    }
    const headers = {};
    if (restNonce) headers["X-WP-Nonce"] = restNonce;
    try {
      const response = await fetch(`${apiBase}/org-tier?orgId=${encodeURIComponent(id)}`, {
        credentials: "same-origin",
        headers,
      });
      const json = await response.json().catch(() => ({}));
      if (response.ok && json && typeof json === "object") {
        planTier = { ...planTier, ...json };
      }
    } catch (_err) {
      /* keep current tier */
    }
    applyTierFieldState();
  }

  const ORG_DESC_MAX_COMMUNITY = 200;
  const ORG_DESC_MAX_PRO = 2000;

  function updateDescriptionLimitUi() {
    const hasFullListing = fullListingFieldsEnabled();
    const maxLen = hasFullListing ? ORG_DESC_MAX_PRO : ORG_DESC_MAX_COMMUNITY;
    const descEl = root.querySelector("#fides-org-description");
    const labelEl = root.querySelector("#fides-org-description-label");
    const noticeEl = root.querySelector("#fides-org-description-limit-notice");
    if (descEl) descEl.maxLength = maxLen;
    if (labelEl) {
      labelEl.textContent = "Description *";
    }
    if (noticeEl) {
      const plansUrl = escapeHtml(String(planTier.plansUrl || "/plans/"));
      if (hasFullListing) {
        noticeEl.textContent = `You can use up to ${ORG_DESC_MAX_PRO.toLocaleString("en-US")} characters in the published catalog description.`;
      } else {
        noticeEl.innerHTML = `Community plan: maximum ${ORG_DESC_MAX_COMMUNITY} characters in the catalog. <a href="${plansUrl}" target="_blank" rel="noopener">Pro plan</a> allows up to ${ORG_DESC_MAX_PRO.toLocaleString("en-US")} characters.`;
      }
    }
    updateDescriptionCounter();
  }

  function updateDescriptionCounter() {
    const descEl = root.querySelector("#fides-org-description");
    const counterEl = root.querySelector("#fides-org-description-counter");
    if (!descEl || !counterEl) return;
    const maxLen = Number(descEl.maxLength) || ORG_DESC_MAX_COMMUNITY;
    const len = String(descEl.value || "").length;
    counterEl.textContent = `${len.toLocaleString("en-US")} / ${maxLen.toLocaleString("en-US")} characters`;
  }

  function updatePlanTierBanner() {
    const badge = root.querySelector("#fides-org-plan-tier-badge");
    if (!badge) return;
    if (!tierUiEnabled() || mode !== "update" || !selectedOrgId) {
      badge.hidden = true;
      badge.textContent = "";
      return;
    }
    const isPro = !!planTier.isPro;
    const hasFullListing = fullListingFieldsEnabled();
    badge.hidden = false;
    badge.textContent = isPro ? "Pro plan" : hasFullListing ? "Full Community listing" : "Community plan";
    badge.className = `fides-update-banner-plan ${isPro ? "fides-pro-plan-badge" : "fides-free-plan-badge"}`;
    badge.title = isPro
      ? "This organization has a linked Pro account. Extended catalog fields are enabled."
      : hasFullListing
        ? "This Community listing includes all catalog fields."
        : "Community plan limits apply to fields published in the catalog.";
  }

  function normalizeOfferingLabel(value) {
    return String(value || "")
      .trim()
      .replace(/\s+/g, " ")
      .slice(0, ORG_OFFERING_MAX_LENGTH);
  }

  function setOfferingsValues(values) {
    const next = [];
    (Array.isArray(values) ? values : []).forEach((value) => {
      const label = normalizeOfferingLabel(value);
      if (!label) return;
      if (next.some((item) => item.toLowerCase() === label.toLowerCase())) return;
      next.push(label);
    });
    offeringsValues = next.slice(0, ORG_OFFERINGS_MAX);
    renderOfferingsChips();
    updateOfferingsCounter();
  }

  function renderOfferingsChips() {
    const listEl = root.querySelector("#fides-org-offerings-chips");
    if (!listEl) return;
    const locked = !fullListingFieldsEnabled();
    listEl.innerHTML = offeringsValues
      .map(
        (label, index) =>
          `<span class="fides-chip" role="listitem">` +
          `<span>${escapeHtml(label)}</span>` +
          `<button type="button" class="fides-chip-remove" data-offering-index="${index}" aria-label="Remove ${escapeHtml(label)}"${locked ? " disabled" : ""}>&times;</button>` +
          `</span>`
      )
      .join("");
    listEl.querySelectorAll(".fides-chip-remove").forEach((btn) => {
      btn.addEventListener("click", () => {
        const idx = Number(btn.getAttribute("data-offering-index"));
        if (Number.isNaN(idx)) return;
        offeringsValues = offeringsValues.filter((_item, i) => i !== idx);
        renderOfferingsChips();
        updateOfferingsCounter();
      });
    });
  }

  function updateOfferingsCounter() {
    const counterEl = root.querySelector("#fides-org-offerings-counter");
    if (!counterEl) return;
    counterEl.textContent = `${offeringsValues.length} / ${ORG_OFFERINGS_MAX} offerings`;
  }

  function filteredOfferingsSuggestions(query) {
    const q = String(query || "").trim().toLowerCase();
    return offeringsSuggestions
      .filter((item) => {
        const label = normalizeOfferingLabel(item);
        if (!label) return false;
        if (offeringsValues.some((value) => value.toLowerCase() === label.toLowerCase())) return false;
        if (!q) return true;
        return label.toLowerCase().includes(q);
      })
      .slice(0, 8);
  }

  function hideOfferingsSuggestions() {
    const listEl = root.querySelector("#fides-org-offerings-suggestions");
    if (!listEl) return;
    listEl.hidden = true;
    listEl.innerHTML = "";
    offeringsSuggestionIndex = -1;
  }

  function renderOfferingsSuggestions(query) {
    const listEl = root.querySelector("#fides-org-offerings-suggestions");
    const inputEl = root.querySelector("#fides-org-offerings-input");
    if (!listEl || !inputEl || inputEl.disabled) return;
    const matches = filteredOfferingsSuggestions(query);
    if (matches.length === 0) {
      hideOfferingsSuggestions();
      return;
    }
    listEl.hidden = false;
    listEl.innerHTML = matches
      .map(
        (label, index) =>
          `<li><button type="button" class="fides-chip-suggestion" data-suggestion-index="${index}" role="option">${escapeHtml(label)}</button></li>`
      )
      .join("");
    listEl.querySelectorAll(".fides-chip-suggestion").forEach((btn) => {
      btn.addEventListener("mousedown", (event) => {
        event.preventDefault();
      });
      btn.addEventListener("click", () => {
        const idx = Number(btn.getAttribute("data-suggestion-index"));
        const picked = matches[idx];
        if (picked) addOffering(picked);
        inputEl.value = "";
        hideOfferingsSuggestions();
        inputEl.focus();
      });
    });
    offeringsSuggestionIndex = -1;
  }

  function addOffering(rawValue) {
    if (!fullListingFieldsEnabled()) return false;
    const label = normalizeOfferingLabel(rawValue);
    if (!label) return false;
    if (offeringsValues.some((value) => value.toLowerCase() === label.toLowerCase())) return false;
    if (offeringsValues.length >= ORG_OFFERINGS_MAX) return false;
    offeringsValues.push(label);
    renderOfferingsChips();
    updateOfferingsCounter();
    return true;
  }

  function wireOfferingsField() {
    const inputEl = root.querySelector("#fides-org-offerings-input");
    const fieldEl = root.querySelector(".fides-form-row--offerings");
    if (!inputEl || !fieldEl) return;

    inputEl.addEventListener("input", () => {
      renderOfferingsSuggestions(inputEl.value);
    });

    inputEl.addEventListener("focus", () => {
      renderOfferingsSuggestions(inputEl.value);
    });

    inputEl.addEventListener("blur", () => {
      window.setTimeout(() => hideOfferingsSuggestions(), 120);
    });

    inputEl.addEventListener("keydown", (event) => {
      const suggestions = filteredOfferingsSuggestions(inputEl.value);
      const listEl = root.querySelector("#fides-org-offerings-suggestions");
      const visible = listEl && !listEl.hidden && suggestions.length > 0;

      if (event.key === "ArrowDown" && visible) {
        event.preventDefault();
        offeringsSuggestionIndex = Math.min(offeringsSuggestionIndex + 1, suggestions.length - 1);
        listEl.querySelectorAll(".fides-chip-suggestion").forEach((btn, idx) => {
          btn.classList.toggle("is-active", idx === offeringsSuggestionIndex);
        });
        return;
      }
      if (event.key === "ArrowUp" && visible) {
        event.preventDefault();
        offeringsSuggestionIndex = Math.max(offeringsSuggestionIndex - 1, 0);
        listEl.querySelectorAll(".fides-chip-suggestion").forEach((btn, idx) => {
          btn.classList.toggle("is-active", idx === offeringsSuggestionIndex);
        });
        return;
      }
      if ((event.key === "Enter" || event.key === ",") && inputEl.value.trim()) {
        event.preventDefault();
        if (visible && offeringsSuggestionIndex >= 0 && suggestions[offeringsSuggestionIndex]) {
          addOffering(suggestions[offeringsSuggestionIndex]);
        } else {
          addOffering(inputEl.value);
        }
        inputEl.value = "";
        hideOfferingsSuggestions();
        return;
      }
      if (event.key === "Escape") {
        hideOfferingsSuggestions();
      }
    });

    document.addEventListener("click", (event) => {
      if (!fieldEl.contains(event.target)) hideOfferingsSuggestions();
    });
  }

  function applyTierFieldState() {
    const hasFullListing = fullListingFieldsEnabled();
    ORG_PRO_FIELD_IDS.forEach((fieldId) => {
      const el = root.querySelector(`#${fieldId}`);
      if (!el) return;
      el.disabled = !hasFullListing;
      el.readOnly = !hasFullListing;
      el.classList.toggle("fides-input-pro-locked", !hasFullListing);
      const row = el.closest(".fides-form-row");
      if (row) row.classList.toggle("fides-form-row--pro-locked", !hasFullListing);
    });
    const offeringsRow = root.querySelector(".fides-form-row--offerings");
    if (offeringsRow) offeringsRow.classList.toggle("fides-form-row--pro-locked", !hasFullListing);
    root.querySelectorAll(".fides-form-section--pro-tier").forEach((section) => {
      section.classList.toggle("fides-form-section--pro-locked", !hasFullListing);
    });
    const mediaSection = root.querySelector(".fides-org-media-section");
    if (mediaSection) {
      mediaSection.classList.toggle("fides-form-section--pro-locked", !hasFullListing);
      mediaSection.querySelectorAll("input, button").forEach((el) => {
        el.disabled = !hasFullListing;
      });
    }
    renderOfferingsChips();
    updateDescriptionLimitUi();
    updatePlanTierBanner();
    updateProFieldLabels();
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function helpText(key) {
    const text = fieldHelp[key];
    return typeof text === "string" ? text.trim() : "";
  }

  function helpHtml(key) {
    const text = helpText(key);
    return text ? `<p class="fides-help">${escapeHtml(text)}</p>` : "";
  }

  function slugify(text) {
    return String(text || "")
      .toLowerCase()
      .trim()
      .replace(/['"]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80);
  }

  function orgIdPreview(name) {
    const slug = slugify(name) || "organization";
    return "org:" + slug;
  }

  /** WP REST item_id route allows [a-zA-Z0-9:._-]+ — encodeURIComponent breaks colons (org%3A → 404). */
  function itemIdPathSegment(itemId) {
    const id = String(itemId || "").trim();
    if (!/^org:[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) {
      return "";
    }
    return id;
  }

  function submissionItemUrl(itemId) {
    const segment = itemIdPathSegment(itemId);
    if (!segment) return "";
    return `${apiBase}/submissions/organization/${segment}`;
  }

  function countryLabel(code) {
    const upper = String(code || "").trim().toUpperCase();
    const match = countries.find((entry) => String(entry.code || "").toUpperCase() === upper);
    return match && match.label ? String(match.label) : upper;
  }

  function countrySelectHtml(selected) {
    const selectedUpper = String(selected || "").trim().toUpperCase();
    return countries
      .map((entry) => {
        const code = String(entry.code || "").trim().toUpperCase();
        const label = String(entry.label || code).trim();
        if (!code) return "";
        const sel = selectedUpper === code ? " selected" : "";
        return `<option value="${escapeHtml(code)}"${sel}>${escapeHtml(label)} (${escapeHtml(code)})</option>`;
      })
      .join("");
  }

  const IDENTIFIER_FIELDS = [
    {
      key: "business_registration_number",
      id: "fides-org-id-business-registration",
      label: "Business registration number",
      helpKey: "identifiersBusinessRegistration",
    },
    { key: "vat_number", id: "fides-org-id-vat", label: "VAT number", helpKey: "identifiersVat" },
    { key: "lei", id: "fides-org-id-lei", label: "LEI", helpKey: "identifiersLei" },
    { key: "eori", id: "fides-org-id-eori", label: "EORI", helpKey: "identifiersEori" },
    { key: "euid", id: "fides-org-id-euid", label: "EUID", helpKey: "identifiersEuid" },
    { key: "duns", id: "fides-org-id-duns", label: "D-U-N-S", helpKey: "identifiersDuns" },
    { key: "gln", id: "fides-org-id-gln", label: "GLN", helpKey: "identifiersGln" },
    { key: "did", id: "fides-org-did", label: "DID", helpKey: "did", placeholder: "did:web:example.com" },
  ];

  function simpleCertificationOptions() {
    return selfDeclaredCertifications.filter((entry) => String(entry.code || "") !== "diacc");
  }

  function diaccCertificationLabel() {
    const match = selfDeclaredCertifications.find((entry) => String(entry.code || "") === "diacc");
    return match && match.label ? String(match.label) : "DIACC Certified";
  }

  function accordionSection(title, intro, bodyHtml) {
    const introHtml = intro ? `<p class="fides-form-section-intro">${escapeHtml(intro)}</p>` : "";
    return `
      <details class="fides-form-section fides-form-accordion">
        <summary class="fides-form-accordion-summary">
          <span class="fides-form-accordion-heading">
            <span class="fides-form-section-title">${escapeHtml(title)}</span>
            <span class="fides-form-accordion-badge">Optional</span>
          </span>
          <span class="fides-form-accordion-chevron" aria-hidden="true"></span>
        </summary>
        <div class="fides-form-accordion-panel">
          ${introHtml}
          <div class="fides-form-section-body">
            ${bodyHtml}
          </div>
        </div>
      </details>`;
  }

  function certificationEvidenceUrl(cert) {
    if (!cert || typeof cert !== "object") return "";
    const top = cert.evidence;
    if (top && top.kind === "url" && top.url) return String(top.url);
    const components = cert.details && Array.isArray(cert.details.components) ? cert.details.components : [];
    for (const component of components) {
      const ev = component && component.evidence;
      if (ev && ev.kind === "url" && ev.url) return String(ev.url);
    }
    return "";
  }

  function inlineCertRowHtml(code, label) {
    const inputId = `fides-org-cert-${code}`;
    const evidenceId = `fides-org-cert-evidence-${code}`;
    return `
      <div class="fides-org-cert-row fides-org-cert-row--inline" data-cert-code="${escapeHtml(code)}">
        <label class="fides-org-cert-inline-label" for="${escapeHtml(inputId)}">
          <input type="checkbox" name="certifications" value="${escapeHtml(code)}" id="${escapeHtml(inputId)}" class="fides-org-cert-checkbox" />
          <span class="fides-org-cert-name">${escapeHtml(label)}</span>
        </label>
        <div class="fides-form-row fides-org-cert-evidence-field">
          <input type="text" id="${escapeHtml(evidenceId)}" class="fides-org-cert-evidence" data-cert-code="${escapeHtml(code)}" inputmode="url" placeholder="Proof URL (optional)" disabled aria-label="${escapeHtml(label)} proof URL" />
        </div>
      </div>`;
  }

  function diaccComponentRowHtml(entry) {
    const code = String(entry.code || "").trim();
    if (!code) return "";
    const label = String(entry.label || code);
    const inputId = `fides-org-diacc-${code}`;
    const evidenceId = `fides-org-diacc-evidence-${code}`;
    return `
      <div class="fides-org-cert-row fides-org-cert-row--inline fides-org-diacc-component-row" data-diacc-component="${escapeHtml(code)}">
        <label class="fides-org-cert-inline-label" for="${escapeHtml(inputId)}">
          <input type="checkbox" name="diacc-components" value="${escapeHtml(code)}" id="${escapeHtml(inputId)}" class="fides-org-diacc-checkbox" />
          <span class="fides-org-cert-name">${escapeHtml(label)}</span>
        </label>
        <div class="fides-form-row fides-org-cert-evidence-field">
          <input type="text" id="${escapeHtml(evidenceId)}" class="fides-org-cert-evidence fides-org-diacc-component-evidence" data-diacc-component="${escapeHtml(code)}" inputmode="url" placeholder="Proof URL (optional)" disabled aria-label="${escapeHtml(label)} proof URL" />
        </div>
      </div>`;
  }

  function diaccGroupHtml() {
    return `
      <div class="fides-org-cert-group" data-cert-code="diacc">
        <div class="fides-org-cert-group-head">
          <span class="fides-org-cert-group-label">${escapeHtml(diaccCertificationLabel())}</span>
        </div>
        ${helpHtml("diaccComponents")}
        <div class="fides-org-diacc-components-list">
          ${diaccComponents.map((entry) => diaccComponentRowHtml(entry)).join("")}
        </div>
      </div>`;
  }

  function certificationsPanelHtml() {
    const simpleRows = simpleCertificationOptions()
      .map((entry) => inlineCertRowHtml(String(entry.code || ""), String(entry.label || entry.code || "")))
      .join("");
    return `
      <div class="fides-org-certifications-list">
        ${simpleRows}
        ${diaccGroupHtml()}
        <p class="fides-form-section-intro fides-org-certifications-note">${escapeHtml(
          helpText("certificationsPreserved") || "QTSP (eIDAS) entries are imported from the EU Trust List and cannot be edited here."
        )}</p>
      </div>`;
  }

  function identifiersPanelHtml() {
    return `<div class="fides-form-grid fides-form-grid-pair fides-org-identifiers-grid">${identifierFieldsHtml()}</div>`;
  }

  function formAccordionSectionsHtml() {
    return `
      ${accordionSection(
        "Ecosystem roles",
        helpText("ecosystemRoleCodes") ||
          "Optional roles your organization plays in the digital identity ecosystem.",
        ecosystemRolesPanelHtml()
      )}
      ${accordionSection(
        "Certifications",
        helpText("certificationsIntro") ||
          "Select certifications your organization holds. These may be reviewed before publication.",
        certificationsPanelHtml()
      )}
      ${accordionSection(
        "Business & technical identifiers",
        "Include only identifiers you want published in the catalog.",
        identifiersPanelHtml()
      )}`;
  }

  function updateSimpleCertRow(row) {
    if (!row) return;
    const checkbox = row.querySelector(".fides-org-cert-checkbox");
    const evidence = row.querySelector(".fides-org-cert-evidence");
    if (evidence) evidence.disabled = !(checkbox && checkbox.checked);
  }

  function updateDiaccComponentRow(row) {
    if (!row) return;
    const checkbox = row.querySelector(".fides-org-diacc-checkbox");
    const evidence = row.querySelector(".fides-org-diacc-component-evidence");
    if (evidence) evidence.disabled = !(checkbox && checkbox.checked);
  }

  function wireCertificationControls() {
    root.querySelectorAll(".fides-org-cert-row--inline:not(.fides-org-diacc-component-row)").forEach((row) => {
      const checkbox = row.querySelector(".fides-org-cert-checkbox");
      if (!checkbox || checkbox.dataset.wired === "1") return;
      checkbox.dataset.wired = "1";
      checkbox.addEventListener("change", () => updateSimpleCertRow(row));
      updateSimpleCertRow(row);
    });
    root.querySelectorAll(".fides-org-diacc-component-row").forEach((row) => {
      const checkbox = row.querySelector(".fides-org-diacc-checkbox");
      if (!checkbox || checkbox.dataset.wired === "1") return;
      checkbox.dataset.wired = "1";
      checkbox.addEventListener("change", () => updateDiaccComponentRow(row));
      updateDiaccComponentRow(row);
    });
  }

  function fillCertificationsFromPayload(certifications) {
    const certMap = new Map();
    if (Array.isArray(certifications)) {
      certifications.forEach((cert) => {
        if (cert && cert.code) certMap.set(String(cert.code), cert);
      });
    }

    root.querySelectorAll('.fides-org-cert-row--inline[data-cert-code]:not([data-cert-code="diacc"])').forEach((row) => {
      const code = String(row.getAttribute("data-cert-code") || "");
      const cert = certMap.get(code);
      const checkbox = row.querySelector('input[name="certifications"]');
      const evidence = row.querySelector(".fides-org-cert-evidence");
      if (checkbox) checkbox.checked = Boolean(cert);
      if (evidence) evidence.value = cert ? certificationEvidenceUrl(cert) : "";
      updateSimpleCertRow(row);
    });

    const diacc = certMap.get("diacc");
    const componentMap = new Map();
    if (diacc && diacc.details && Array.isArray(diacc.details.components)) {
      diacc.details.components.forEach((item) => {
        if (item && item.component) componentMap.set(String(item.component), item);
      });
    }
    root.querySelectorAll(".fides-org-diacc-component-row").forEach((row) => {
      const code = String(row.getAttribute("data-diacc-component") || "");
      const item = componentMap.get(code);
      const checkbox = row.querySelector(".fides-org-diacc-checkbox");
      const evidence = row.querySelector(".fides-org-diacc-component-evidence");
      if (checkbox) checkbox.checked = Boolean(item);
      if (evidence) {
        const url =
          item && item.evidence && item.evidence.kind === "url" && item.evidence.url
            ? String(item.evidence.url)
            : "";
        evidence.value = url;
      }
      updateDiaccComponentRow(row);
    });
  }

  function buildCertificationsFromForm() {
    const certifications = [];
    root.querySelectorAll('.fides-org-cert-row--inline[data-cert-code]:not([data-cert-code="diacc"])').forEach((row) => {
      const checkbox = row.querySelector('input[name="certifications"]');
      if (!checkbox || !checkbox.checked) return;
      const code = String(checkbox.value || "").trim();
      if (!code) return;
      const evidenceInput = row.querySelector(".fides-org-cert-evidence");
      const url = evidenceInput ? String(evidenceInput.value || "").trim() : "";
      const entry = { code };
      if (url) entry.evidence = { kind: "url", url };
      certifications.push(entry);
    });

    const components = [];
    root.querySelectorAll(".fides-org-diacc-component-row").forEach((row) => {
      const checkbox = row.querySelector(".fides-org-diacc-checkbox");
      if (!checkbox || !checkbox.checked) return;
      const component = String(checkbox.value || "").trim();
      if (!component) return;
      const item = { component };
      const evidenceInput = row.querySelector(".fides-org-diacc-component-evidence");
      const url = evidenceInput ? String(evidenceInput.value || "").trim() : "";
      if (url) item.evidence = { kind: "url", url };
      components.push(item);
    });
    if (components.length) {
      certifications.push({ code: "diacc", details: { components } });
    }
    return certifications;
  }

  function identifierFieldsHtml() {
    return IDENTIFIER_FIELDS.map(
      (field) => `
        <div class="fides-form-row">
          <label for="${field.id}">${escapeHtml(field.label)}</label>
          ${helpHtml(field.helpKey)}
          <input id="${field.id}" name="${escapeHtml(field.key)}" type="text" maxlength="120"${
            field.placeholder ? ` placeholder="${escapeHtml(field.placeholder)}"` : ""
          } />
        </div>`
    ).join("");
  }

  function sectorChoicesHtml() {
    return sectors
      .map(
        (entry) => `
        <label class="fides-form-choice">
          <input type="radio" name="sector" value="${escapeHtml(entry.code)}" />
          <span>${escapeHtml(entry.label || entry.code)}</span>
        </label>`
      )
      .join("");
  }

  function ecosystemRoleChoicesHtml() {
    return ecosystemRoles
      .map(
        (entry) => `
        <label class="fides-form-choice">
          <input type="checkbox" name="ecosystemRoleCodes" value="${escapeHtml(entry.code)}" />
          <span>${escapeHtml(entry.label || entry.code)}</span>
        </label>`
      )
      .join("");
  }

  function ecosystemRolesPanelHtml() {
    return `
      <div class="fides-form-row">
        <span class="fides-form-label" id="fides-org-ecosystem-roles-label">Ecosystem roles</span>
        ${helpHtml("ecosystemRoleCodes")}
        <div class="fides-form-choices fides-form-choices-stack" role="group" aria-labelledby="fides-org-ecosystem-roles-label">
          ${ecosystemRoleChoicesHtml()}
        </div>
      </div>`;
  }

  function formMediaSectionHtml() {
    return `
        <section class="fides-form-section fides-form-section--pro-tier fides-org-media-section" aria-labelledby="fides-org-media-section-title" hidden>
          <div class="fides-form-accordion-heading">
            <h3 id="fides-org-media-section-title" class="fides-form-section-title" data-pro-label="Media">${labelWithProIfNeeded("Media", true)}</h3>
          </div>
          <p class="fides-form-section-intro">Visuals shown on your public organization listing — add cover images and optional demo videos.</p>
          <div class="fides-form-section-body fides-media-section-body">
            <div class="fides-form-grid fides-media-grid">
              <div class="fides-media-col">
                <label>Cover images</label>
                <p class="fides-help fides-media-col-help">${escapeHtml(helpText("mediaImages") || "Screenshot or product image URLs.")}</p>
                <div id="fides-org-image-rows" class="fides-media-rows" aria-live="polite"></div>
              </div>
              <div class="fides-media-col">
                <label>Demo videos</label>
                <p class="fides-help fides-media-col-help">${escapeHtml(helpText("mediaVideos") || "YouTube or Vimeo links to demos.")}</p>
                <div id="fides-org-video-rows" class="fides-media-rows" aria-live="polite"></div>
              </div>
            </div>
            <p id="fides-org-image-upload-status" class="fides-lookup-hint" hidden></p>
          </div>
        </section>`;
  }

  function formFieldsHtml() {
    return `
      <div class="fides-form-section-body fides-org-fields" ${mode === "update" ? "hidden" : ""}>
        <div class="fides-form-row">
          <label for="fides-org-name">Organization name *</label>
          ${helpHtml("name")}
          <input id="fides-org-name" name="name" type="text" required maxlength="200" />
        </div>
        ${
          mode === "create"
            ? `<div class="fides-form-row">
          <span class="fides-form-label">Catalog id (preview)</span>
          ${helpHtml("catalogId")}
          <div id="fides-org-id-preview" class="fides-id-preview">org:…</div>
        </div>`
            : ""
        }
        <div class="fides-form-row">
          <span class="fides-form-label" id="fides-org-sectors-label">Sector *</span>
          ${helpHtml("sectors")}
          <div class="fides-form-choices" role="group" aria-labelledby="fides-org-sectors-label">
            ${sectorChoicesHtml()}
          </div>
        </div>
        <div class="fides-form-grid fides-form-grid-pair">
          <div class="fides-form-row">
            <label for="fides-org-country">Country *</label>
            ${helpHtml("country")}
            <select id="fides-org-country" name="country" required>
              <option value="">Select...</option>
              ${countrySelectHtml("")}
            </select>
          </div>
          <div class="fides-form-row">
            <label for="fides-org-website" data-pro-label="Website">${labelWithProIfNeeded("Website", true)}</label>
            ${helpHtml("website")}
            <input id="fides-org-website" name="website" type="url" placeholder="https://…" />
          </div>
        </div>
        <div class="fides-form-grid fides-form-grid-pair">
          <div class="fides-form-row">
            <label for="fides-org-logo">Logo URL</label>
            ${helpHtml("logo")}
            <input id="fides-org-logo" name="logo" type="url" placeholder="https://…/logo.png" />
          </div>
          <div class="fides-form-row">
            <label for="fides-org-legal-name">Legal name</label>
            ${helpHtml("legalName")}
            <input id="fides-org-legal-name" name="legalName" type="text" />
          </div>
        </div>
        <div class="fides-form-field-group fides-form-field-group--compact">
        <div class="fides-form-row">
          <label for="fides-org-description" id="fides-org-description-label">Description *</label>
          ${helpHtml("description")}
          <textarea id="fides-org-description" name="description" required maxlength="2000" placeholder="Technology company building digital identity and wallet products based on open standards."></textarea>
          <div class="fides-field-meta">
            <p class="fides-description-limit-notice fides-pro-field-notice" id="fides-org-description-limit-notice"></p>
            <p class="fides-description-counter" id="fides-org-description-counter" aria-live="polite"></p>
          </div>
        </div>
        <div class="fides-form-row fides-form-row--offerings">
          <label for="fides-org-offerings-input" data-pro-label="Offerings">${labelWithProIfNeeded("Offerings", true)}</label>
          <div class="fides-form-row-helpline">
            ${helpHtml("offerings")}
            <p class="fides-description-counter" id="fides-org-offerings-counter" aria-live="polite"></p>
          </div>
          <div id="fides-org-offerings-chips" class="fides-chip-list" role="list"></div>
          <div class="fides-chip-input-wrap">
            <input id="fides-org-offerings-input" name="offeringsInput" type="text" autocomplete="off" placeholder="Type an offering and press Enter" maxlength="${ORG_OFFERING_MAX_LENGTH}" />
            <ul id="fides-org-offerings-suggestions" class="fides-chip-suggestions" role="listbox" hidden></ul>
          </div>
        </div>
        <div class="fides-form-row">
          <label for="fides-org-tags" data-pro-label="Tags">${labelWithProIfNeeded("Tags", true)}</label>
          ${helpHtml("tags")}
          <input id="fides-org-tags" name="tags" type="text" placeholder="wallet, identity" />
        </div>
        </div>
        <div class="fides-form-grid fides-form-grid-pair">
          <div class="fides-form-row">
            <label for="fides-org-public-contact-email" data-pro-label="Contact email">${labelWithProIfNeeded("Contact email", true)}</label>
            ${helpHtml("publicContactEmail")}
            <input id="fides-org-public-contact-email" name="contactEmail" type="email" placeholder="contact@example.com" autocomplete="email" />
          </div>
          <div class="fides-form-row">
            <label for="fides-org-book-meeting-url" data-pro-label="Book a meeting URL">${labelWithProIfNeeded("Book a meeting URL", true)}</label>
            ${helpHtml("bookMeetingUrl")}
            <input id="fides-org-book-meeting-url" name="bookMeetingUrl" type="url" placeholder="https://…/book" />
          </div>
        </div>
        <div class="fides-form-row">
          <span class="fides-form-label" id="fides-org-manifesto-label">FIDES Manifesto supporter</span>
          ${helpHtml("fidesManifestoSupporter")}
          <div class="fides-form-choices fides-form-choices-inline" role="group" aria-labelledby="fides-org-manifesto-label">
            <label class="fides-form-choice">
              <input type="checkbox" id="fides-org-manifesto-supporter" name="fidesManifestoSupporter" value="1" />
              <span>Yes</span>
            </label>
          </div>
        </div>
        ${
          contactEmail
            ? `<div class="fides-form-grid fides-form-grid-pair fides-submitter-grid">
          <div class="fides-form-row">
            <label for="fides-org-contact">Your account email (for review) *</label>
            ${helpHtml("contactEmail")}
            <input id="fides-org-contact" class="fides-input-locked" type="email" value="${escapeHtml(contactEmail)}" readonly aria-readonly="true" tabindex="-1" />
          </div>
        </div>`
            : `<p class="fides-form-message is-error">Your WordPress profile must have a valid email address before you can submit.</p>`
        }
      </div>
    `;
  }

  const sectionTitle = mode === "update" ? "Suggest an update" : "Organization details";
  const sectionIntroHtml = sectionIntro
    ? `<p class="fides-form-section-intro">${escapeHtml(sectionIntro)}</p>`
    : "";

  root.innerHTML = `
    <section class="fides-use-case-card">
      <form id="fides-org-form" class="fides-use-case-form fides-org-form">
        <section class="fides-form-section fides-form-section-first" aria-labelledby="fides-org-section-title">
          <div class="fides-form-accordion-heading">
            <h3 id="fides-org-section-title" class="fides-form-section-title">${escapeHtml(sectionTitle)}</h3>
          </div>
          ${sectionIntroHtml}
          ${
            mode === "update"
              ? `<div id="fides-org-update-picker" class="fides-form-section-body fides-org-update-picker-body">
            <div id="fides-org-search-block" class="fides-linked-field">
              <label for="fides-org-search">Find organization *</label>
              ${helpHtml("search")}
              <div class="fides-linked-inputs">
                <input id="fides-org-search" type="text" autocomplete="off" placeholder="Start typing…" />
              </div>
              <div class="fides-lookup-panel">
                <p id="fides-org-lookup-hint" class="fides-lookup-hint" hidden></p>
                <ul id="fides-org-lookup-results" class="fides-lookup-results" role="listbox" aria-label="Search results"></ul>
              </div>
            </div>
            <div id="fides-org-update-banner" class="fides-update-banner-row" hidden>
              <div class="fides-update-banner">
                <span class="fides-update-banner-label">Updating:</span>
                <strong id="fides-org-update-name"></strong>
                <code id="fides-org-update-id"></code>
                <span id="fides-org-plan-tier-badge" class="fides-update-banner-plan" hidden></span>
              </div>
              <button type="button" class="fides-secondary-btn" id="fides-org-change">Choose different</button>
            </div>
          </div>`
              : ""
          }
          ${formFieldsHtml()}
        </section>
        ${formMediaSectionHtml()}
        <div class="fides-org-optional-sections"${mode === "update" ? " hidden" : ""}>
          ${formAccordionSectionsHtml()}
        </div>
        <div id="fides-org-submit-block" class="fides-org-submit-block"${mode === "update" ? " hidden" : ""}>
        <div class="fides-consent">
          <label><input type="checkbox" name="consentPublish" required /> I confirm this information may be published *</label>
        </div>
        <div class="fides-form-actions">
          <button type="submit">${mode === "update" ? "Submit update proposal" : "Submit organization"}</button>
        </div>
        </div>
        <p id="fides-org-form-message" class="fides-form-message" aria-live="polite"></p>
      </form>
    </section>
  `;

  const form = root.querySelector("#fides-org-form");
  const messageEl = root.querySelector("#fides-org-form-message");
  const fieldsWrap = root.querySelector(".fides-org-fields");
  const nameInput = root.querySelector("#fides-org-name");
  const idPreviewEl = root.querySelector("#fides-org-id-preview");
  const countrySelect = root.querySelector("#fides-org-country");
  const searchInput = root.querySelector("#fides-org-search");
  const lookupResults = root.querySelector("#fides-org-lookup-results");
  const lookupHint = root.querySelector("#fides-org-lookup-hint");
  const updateBanner = root.querySelector("#fides-org-update-banner");
  const searchBlock = root.querySelector("#fides-org-search-block");
  const updateNameEl = root.querySelector("#fides-org-update-name");
  const updateIdEl = root.querySelector("#fides-org-update-id");
  const changeBtn = root.querySelector("#fides-org-change");
  const submitBlock = root.querySelector("#fides-org-submit-block");
  const imageRowsEl = root.querySelector("#fides-org-image-rows");
  const videoRowsEl = root.querySelector("#fides-org-video-rows");
  const imageUploadStatusEl = root.querySelector("#fides-org-image-upload-status");
  const imageRowsState = [{ url: "" }];
  const videoRowsState = [{ url: "" }];

  function mediaImageMax() {
    return Number(v2Limits.mediaImages) || 10;
  }

  function mediaVideoMax() {
    return Number(v2Limits.mediaVideos) || 3;
  }

  function collectMediaUrls(state) {
    return state.map((entry) => String(entry.url || "").trim()).filter(Boolean);
  }

  function setImageUploadStatus(text) {
    if (!imageUploadStatusEl) return;
    if (!text) {
      imageUploadStatusEl.hidden = true;
      imageUploadStatusEl.textContent = "";
      return;
    }
    imageUploadStatusEl.hidden = false;
    imageUploadStatusEl.textContent = text;
  }

  function renderImageRows() {
    if (!imageRowsEl) return;
    const max = mediaImageMax();
    const lastIndex = imageRowsState.length - 1;
    imageRowsEl.innerHTML = imageRowsState
      .map((entry, index) => {
        const isLast = index === lastIndex;
        const canAdd = imageRowsState.length < max;
        let rowAction = "";
        if (isLast && canAdd) {
          rowAction = `<button type="button" class="fides-secondary-btn fides-media-action-btn" data-add-image="1">Add</button>`;
        } else if (!isLast || imageRowsState.length > 1) {
          rowAction = `<button type="button" class="fides-secondary-btn fides-media-action-btn" data-remove-image="${index}" aria-label="Remove image">Remove</button>`;
        }
        return `
          <div class="fides-media-row" data-image-index="${index}">
            <div class="fides-media-inputs fides-media-inputs--image">
              <input type="url" class="fides-media-url-input" data-image-url="${index}" value="${escapeHtml(entry.url || "")}" placeholder="https://…" inputmode="url" autocomplete="url" />
              <label class="fides-secondary-btn fides-media-action-btn fides-upload-btn">
                Upload
                <input type="file" data-image-file="${index}" accept="image/jpeg,image/png,image/webp,image/gif" hidden />
              </label>
              ${rowAction}
            </div>
            ${
              entry.url
                ? `<div class="fides-image-preview"><img src="${escapeHtml(entry.url)}" alt="Image preview" loading="lazy" /></div>`
                : ""
            }
          </div>`;
      })
      .join("");
  }

  function renderVideoRows() {
    if (!videoRowsEl) return;
    const max = mediaVideoMax();
    const lastIndex = videoRowsState.length - 1;
    videoRowsEl.innerHTML = videoRowsState
      .map((entry, index) => {
        const isLast = index === lastIndex;
        const canAdd = videoRowsState.length < max;
        let rowAction = "";
        if (isLast && canAdd) {
          rowAction = `<button type="button" class="fides-secondary-btn fides-media-action-btn" data-add-video="1">Add</button>`;
        } else if (!isLast || videoRowsState.length > 1) {
          rowAction = `<button type="button" class="fides-secondary-btn fides-media-action-btn" data-remove-video="${index}" aria-label="Remove video">Remove</button>`;
        }
        return `
          <div class="fides-media-row" data-video-index="${index}">
            <div class="fides-media-inputs fides-media-inputs--video">
              <input type="url" class="fides-media-url-input" data-video-url="${index}" value="${escapeHtml(entry.url || "")}" placeholder="https://youtube.com/…" inputmode="url" autocomplete="url" />
              ${rowAction}
            </div>
          </div>`;
      })
      .join("");
  }

  function setMediaRowsFromUrls(images, videos) {
    imageRowsState.length = 0;
    const imageUrls = (Array.isArray(images) ? images : []).slice(0, mediaImageMax());
    if (imageUrls.length) {
      imageUrls.forEach((url) => imageRowsState.push({ url: String(url) }));
    } else {
      imageRowsState.push({ url: "" });
    }
    videoRowsState.length = 0;
    const videoUrls = (Array.isArray(videos) ? videos : []).slice(0, mediaVideoMax());
    if (videoUrls.length) {
      videoUrls.forEach((url) => videoRowsState.push({ url: String(url) }));
    } else {
      videoRowsState.push({ url: "" });
    }
    renderImageRows();
    renderVideoRows();
    setImageUploadStatus("");
  }

  async function uploadImageFile(file, rowIndex) {
    if (!file || !apiBase) {
      setImageUploadStatus("Missing API configuration.");
      return;
    }
    setImageUploadStatus("Uploading…");
    const formData = new FormData();
    formData.append("file", file);
    const headers = {};
    if (restNonce) headers["X-WP-Nonce"] = restNonce;
    try {
      const response = await fetch(`${apiBase}/submissions/card-image`, {
        method: "POST",
        credentials: "same-origin",
        headers,
        body: formData,
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        setImageUploadStatus(json.message || "Image upload failed.");
        return;
      }
      const url = json.url ? String(json.url) : "";
      if (!url) {
        setImageUploadStatus("Upload succeeded but no URL was returned.");
        return;
      }
      if (imageRowsState[rowIndex]) {
        imageRowsState[rowIndex].url = url;
      }
      renderImageRows();
      applyTierFieldState();
      setImageUploadStatus("Image uploaded.");
    } catch (_err) {
      setImageUploadStatus("Image upload failed due to a network error.");
    }
  }

  function initOrgMediaControls() {
    renderImageRows();
    renderVideoRows();

    if (imageRowsEl) {
      imageRowsEl.addEventListener("input", (event) => {
        const target = event.target;
        if (!(target instanceof HTMLInputElement) || !target.hasAttribute("data-image-url")) return;
        const index = Number(target.getAttribute("data-image-url"));
        if (!Number.isFinite(index) || !imageRowsState[index]) return;
        imageRowsState[index].url = target.value.trim();
        renderImageRows();
        applyTierFieldState();
      });

      imageRowsEl.addEventListener("change", (event) => {
        const target = event.target;
        if (!(target instanceof HTMLInputElement) || !target.hasAttribute("data-image-file")) return;
        const index = Number(target.getAttribute("data-image-file"));
        const file = target.files && target.files[0];
        target.value = "";
        if (!Number.isFinite(index) || !file) return;
        uploadImageFile(file, index);
      });

      imageRowsEl.addEventListener("click", (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;
        if (target.hasAttribute("data-add-image")) {
          if (imageRowsState.length >= mediaImageMax()) return;
          imageRowsState.push({ url: "" });
          renderImageRows();
          applyTierFieldState();
          return;
        }
        const indexAttr = target.getAttribute("data-remove-image");
        if (indexAttr == null) return;
        const index = Number(indexAttr);
        if (!Number.isFinite(index) || imageRowsState.length <= 1) return;
        imageRowsState.splice(index, 1);
        renderImageRows();
        applyTierFieldState();
      });
    }

    if (videoRowsEl) {
      videoRowsEl.addEventListener("input", (event) => {
        const target = event.target;
        if (!(target instanceof HTMLInputElement) || !target.hasAttribute("data-video-url")) return;
        const index = Number(target.getAttribute("data-video-url"));
        if (!Number.isFinite(index) || !videoRowsState[index]) return;
        videoRowsState[index].url = target.value.trim();
      });

      videoRowsEl.addEventListener("click", (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;
        if (target.hasAttribute("data-add-video")) {
          if (videoRowsState.length >= mediaVideoMax()) return;
          videoRowsState.push({ url: "" });
          renderVideoRows();
          applyTierFieldState();
          return;
        }
        const indexAttr = target.getAttribute("data-remove-video");
        if (indexAttr == null) return;
        const index = Number(indexAttr);
        if (!Number.isFinite(index) || videoRowsState.length <= 1) return;
        videoRowsState.splice(index, 1);
        renderVideoRows();
        applyTierFieldState();
      });
    }
  }

  applyTierFieldState();
  wireOfferingsField();
  setOfferingsValues([]);
  initOrgMediaControls();

  const orgDescInput = root.querySelector("#fides-org-description");
  if (orgDescInput) {
    orgDescInput.addEventListener("input", updateDescriptionCounter);
  }

  function setMessage(text, type) {
    if (!messageEl) return;
    messageEl.textContent = text || "";
    messageEl.className = `fides-form-message ${type ? `is-${type}` : ""}`.trim();
  }

  function getCheckedSectors() {
    const selected = form.querySelector('input[name="sector"]:checked');
    return selected ? [String(selected.value)] : [];
  }

  function setCheckedSectors(values) {
    const selected = (values || []).map(String)[0] || "";
    form.querySelectorAll('input[name="sector"]').forEach((el) => {
      el.checked = String(el.value) === selected;
    });
  }

  function getCheckedEcosystemRoleCodes() {
    return Array.from(form.querySelectorAll('input[name="ecosystemRoleCodes"]:checked')).map((el) =>
      String(el.value)
    );
  }

  function setCheckedEcosystemRoleCodes(values) {
    const selected = new Set((values || []).map(String));
    form.querySelectorAll('input[name="ecosystemRoleCodes"]').forEach((el) => {
      el.checked = selected.has(String(el.value));
    });
  }

  function setCountryValue(value) {
    if (!countrySelect) return;
    const upper = String(value || "").trim().toUpperCase();
    if (!upper) {
      countrySelect.value = "";
      return;
    }
    const hasOption = Array.from(countrySelect.options).some((opt) => opt.value === upper);
    if (hasOption) {
      countrySelect.value = upper;
      return;
    }
    const option = document.createElement("option");
    option.value = upper;
    option.textContent = `${countryLabel(upper)} (${upper})`;
    option.selected = true;
    countrySelect.appendChild(option);
  }

  function fillForm(payload) {
    if (!payload || typeof payload !== "object") return;
    if (nameInput) nameInput.value = payload.name || "";
    setCountryValue(payload.country || "");
    if (root.querySelector("#fides-org-website")) root.querySelector("#fides-org-website").value = payload.website || "";
    if (root.querySelector("#fides-org-logo")) root.querySelector("#fides-org-logo").value = payload.logo || "";
    if (root.querySelector("#fides-org-legal-name")) root.querySelector("#fides-org-legal-name").value = payload.legalName || "";
    if (root.querySelector("#fides-org-description")) {
      root.querySelector("#fides-org-description").value = payload.description || "";
      updateDescriptionCounter();
    }
    if (root.querySelector("#fides-org-tags")) {
      const tags = Array.isArray(payload.tags) ? payload.tags.join(", ") : "";
      root.querySelector("#fides-org-tags").value = tags;
    }
    setOfferingsValues(payload.offerings || []);
    const idents = payload.identifiers && typeof payload.identifiers === "object" ? payload.identifiers : {};
    IDENTIFIER_FIELDS.forEach((field) => {
      const el = root.querySelector(`#${field.id}`);
      if (!el) return;
      el.value = idents[field.key] ? String(idents[field.key]) : "";
    });
    const publicContactEmailEl = root.querySelector("#fides-org-public-contact-email");
    const bookMeetingUrlEl = root.querySelector("#fides-org-book-meeting-url");
    if (publicContactEmailEl) {
      publicContactEmailEl.value =
        payload.contact && payload.contact.email ? String(payload.contact.email) : "";
    }
    if (bookMeetingUrlEl) {
      bookMeetingUrlEl.value =
        payload.contact && payload.contact.bookMeetingUrl ? String(payload.contact.bookMeetingUrl) : "";
    }
    const manifestoEl = root.querySelector("#fides-org-manifesto-supporter");
    if (manifestoEl) manifestoEl.checked = payload.fidesManifestoSupporter === true;
    fillCertificationsFromPayload(payload.certifications);
    setCheckedSectors(payload.sectors || []);
    setCheckedEcosystemRoleCodes(payload.ecosystemRoleCodes || []);
    const media = payload.media && typeof payload.media === "object" ? payload.media : {};
    setMediaRowsFromUrls(media.images, media.videos);
    if (mode === "create" && idPreviewEl && nameInput) {
      idPreviewEl.textContent = orgIdPreview(nameInput.value);
    }
  }

  function buildIdentifiersFromForm() {
    const identifiers = {};
    IDENTIFIER_FIELDS.forEach((field) => {
      const el = root.querySelector(`#${field.id}`);
      if (!el) return;
      const value = String(el.value || "").trim();
      if (value) identifiers[field.key] = value;
    });
    return identifiers;
  }

  function buildPayload() {
    const tagsRaw = root.querySelector("#fides-org-tags") ? String(root.querySelector("#fides-org-tags").value || "") : "";
    const payload = {
      name: nameInput ? String(nameInput.value || "").trim() : "",
      sectors: getCheckedSectors(),
      country: countrySelect ? String(countrySelect.value || "").trim().toUpperCase() : "",
      website: root.querySelector("#fides-org-website") ? String(root.querySelector("#fides-org-website").value || "").trim() : "",
      logo: root.querySelector("#fides-org-logo") ? String(root.querySelector("#fides-org-logo").value || "").trim() : "",
      legalName: root.querySelector("#fides-org-legal-name")
        ? String(root.querySelector("#fides-org-legal-name").value || "").trim()
        : "",
      description: root.querySelector("#fides-org-description")
        ? String(root.querySelector("#fides-org-description").value || "").trim()
        : "",
      tags: tagsRaw
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      offerings: offeringsValues.slice(),
    };
    const identifiers = buildIdentifiersFromForm();
    if (Object.keys(identifiers).length) {
      payload.identifiers = identifiers;
    }
    const publicContactEmailEl = root.querySelector("#fides-org-public-contact-email");
    const bookMeetingUrlEl = root.querySelector("#fides-org-book-meeting-url");
    const publicContactEmail = publicContactEmailEl ? String(publicContactEmailEl.value || "").trim() : "";
    const bookMeetingUrl = bookMeetingUrlEl ? String(bookMeetingUrlEl.value || "").trim() : "";
    const contact = {};
    if (publicContactEmail) contact.email = publicContactEmail;
    if (bookMeetingUrl) contact.bookMeetingUrl = bookMeetingUrl;
    if (Object.keys(contact).length) payload.contact = contact;
    const manifestoEl = root.querySelector("#fides-org-manifesto-supporter");
    payload.fidesManifestoSupporter = Boolean(manifestoEl && manifestoEl.checked);
    payload.certifications = buildCertificationsFromForm();
    payload.ecosystemRoleCodes = getCheckedEcosystemRoleCodes();
    const videos = collectMediaUrls(videoRowsState);
    const images = collectMediaUrls(imageRowsState);
    if (videos.length || images.length) {
      payload.media = {};
      if (videos.length) payload.media.videos = videos;
      if (images.length) payload.media.images = images;
    }
    return payload;
  }

  function showUpdateSelectionUi() {
    const hasSelection = Boolean(selectedOrgId);
    if (updateBanner) updateBanner.hidden = !hasSelection;
    if (searchBlock) searchBlock.hidden = hasSelection;
    if (submitBlock && mode === "update") submitBlock.hidden = !hasSelection;
    if (!hasSelection) {
      if (updateNameEl) updateNameEl.textContent = "";
      if (updateIdEl) updateIdEl.textContent = "";
      return;
    }
    if (updateNameEl) updateNameEl.textContent = selectedOrgLabel || selectedOrgId;
    if (updateIdEl) updateIdEl.textContent = selectedOrgId;
    updatePlanTierBanner();
  }

  function revealFields(show) {
    if (fieldsWrap) fieldsWrap.hidden = !show;
    const mediaSection = root.querySelector(".fides-org-media-section");
    if (mediaSection) mediaSection.hidden = !show;
    const optionalSections = root.querySelector(".fides-org-optional-sections");
    if (optionalSections) optionalSections.hidden = !show;
  }

  async function loadItemPayload(itemId) {
    const url = submissionItemUrl(itemId);
    if (!url) {
      setMessage("Invalid organization id.", "error");
      return;
    }
    setMessage("Loading organization details…", "");
    const headers = {};
    if (restNonce) headers["X-WP-Nonce"] = restNonce;
    try {
      const response = await fetch(url, {
        credentials: "same-origin",
        headers,
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(json.message || "Could not load organization details.", "error");
        return;
      }
      fillForm(json.payload || {});
      revealFields(true);
      applyTierFieldState();
      setMessage("", "");
    } catch (_err) {
      setMessage("Could not load organization details due to a network error.", "error");
    }
  }

  async function selectOrganization(item) {
    selectedOrgId = String(item.id || "").trim();
    selectedOrgLabel = String(item.label || selectedOrgId).trim();
    if (lookupResults) lookupResults.innerHTML = "";
    if (lookupHint) lookupHint.hidden = true;
    showUpdateSelectionUi();
    await refreshPlanTier(selectedOrgId);
    await loadItemPayload(selectedOrgId);
  }

  function resetUpdateSelection() {
    selectedOrgId = "";
    selectedOrgLabel = "";
    if (searchInput) {
      searchInput.value = "";
      searchInput.focus();
    }
    showUpdateSelectionUi();
    revealFields(false);
    fillForm({});
    setOfferingsValues([]);
    setMessage("", "");
    refreshPlanTier("");
  }

  wireCertificationControls();

  if (nameInput && idPreviewEl) {
    nameInput.addEventListener("input", () => {
      idPreviewEl.textContent = orgIdPreview(nameInput.value);
    });
    idPreviewEl.textContent = orgIdPreview(nameInput.value);
  }

  if (mode === "update" && searchInput && lookupResults) {
    showUpdateSelectionUi();
    let debounceTimer = null;

    function setLookupHint(message) {
      if (!lookupHint) return;
      if (!message) {
        lookupHint.hidden = true;
        lookupHint.textContent = "";
        return;
      }
      lookupHint.hidden = false;
      lookupHint.textContent = message;
    }

    function renderLookupOption(item, idx) {
      const title = escapeHtml(item.label || "Unnamed");
      const subtitle = item.subtitle ? escapeHtml(item.subtitle) : "";
      return (
        `<li><button type="button" class="fides-lookup-option" data-result-index="${idx}" ` +
        `aria-label="Select ${title}${subtitle ? `, ${subtitle}` : ""}">` +
        `<span class="fides-lookup-option-main">` +
        `<span class="fides-lookup-option-title">${title}</span>` +
        (subtitle ? `<span class="fides-lookup-option-subtitle">${subtitle}</span>` : "") +
        `</span>` +
        `<span class="fides-lookup-option-action">Select</span>` +
        `</button></li>`
      );
    }

    searchInput.addEventListener("input", () => {
      const query = searchInput.value.trim();
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(async () => {
        lookupResults.innerHTML = "";
        setLookupHint("");
        if (query.length < 2) return;
        if (!apiBase) {
          setLookupHint("Missing API configuration.");
          return;
        }
        const headers = {};
        if (restNonce) headers["X-WP-Nonce"] = restNonce;
        try {
          const response = await fetch(
            `${apiBase}/lookups/organization?q=${encodeURIComponent(query)}`,
            { credentials: "same-origin", headers }
          );
          const json = await response.json().catch(() => ({}));
          if (!response.ok) {
            setLookupHint(json.message || "Lookup failed.");
            return;
          }
          const items = Array.isArray(json.content) ? json.content : [];
          if (items.length === 0) {
            setLookupHint("No matches. Check the spelling or contact us if the organization is missing.");
            return;
          }
          const total = Number(json.totalMatches) || items.length;
          setLookupHint(total === 1 ? "1 match — click to select" : `${total} matches — click to select`);
          lookupResults.innerHTML = items.map((item, idx) => renderLookupOption(item, idx)).join("");
          lookupResults.querySelectorAll("button[data-result-index]").forEach((btn) => {
            btn.addEventListener("click", () => {
              const idx = Number(btn.getAttribute("data-result-index"));
              const picked = items[idx];
              if (picked) selectOrganization(picked);
            });
          });
        } catch (_err) {
          setLookupHint("Lookup failed due to a network error.");
        }
      }, 250);
    });

    if (changeBtn) {
      changeBtn.addEventListener("click", (event) => {
        event.preventDefault();
        resetUpdateSelection();
      });
    }

    if (selectedOrgId) {
      selectOrganization({ id: selectedOrgId, label: selectedOrgId.replace(/^org:/, "") });
    }
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    if (!contactEmail) {
      setMessage("Your WordPress profile must have a valid email address before submitting.", "error");
      return;
    }
    if (mode === "update" && !selectedOrgId) {
      setMessage("Select the organization you want to update.", "error");
      return;
    }

    const payload = buildPayload();
    if (!payload.name) {
      setMessage("Organization name is required.", "error");
      return;
    }
    if (!payload.sectors.length) {
      setMessage("Select a sector.", "error");
      return;
    }
    if (!payload.country) {
      setMessage("Select a country.", "error");
      return;
    }
    if (!payload.description) {
      setMessage("Description is required.", "error");
      return;
    }

    if (!apiBase) {
      setMessage("Missing API configuration.", "error");
      return;
    }

    const url = mode === "update" ? submissionItemUrl(selectedOrgId) : `${apiBase}/submissions/organization`;
    if (!url) {
      setMessage("Invalid organization id.", "error");
      return;
    }

    setMessage("Submitting…", "");
    const headers = { "Content-Type": "application/json" };
    if (restNonce) headers["X-WP-Nonce"] = restNonce;

    try {
      const response = await fetch(url, {
        method: "POST",
        credentials: "same-origin",
        headers,
        body: JSON.stringify(payload),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(json.message || "Submission failed.", "error");
        return;
      }
      const ref = json.itemId || json.id || "";
      setMessage(
        mode === "update"
          ? `Update proposal received${ref ? ` for ${ref}` : ""}. It will be reviewed before publication.`
          : `Submission received${ref ? ` (${ref})` : ""}. It will be reviewed before publication.`,
        "success"
      );
      if (mode === "create") {
        form.reset();
        if (idPreviewEl) idPreviewEl.textContent = orgIdPreview("");
        setCheckedSectors([]);
        setCountryValue("");
        setOfferingsValues([]);
      } else {
        selectedOrgId = "";
        selectedOrgLabel = "";
        if (searchInput) searchInput.value = "";
        if (lookupResults) lookupResults.innerHTML = "";
        if (lookupHint) {
          lookupHint.hidden = true;
          lookupHint.textContent = "";
        }
        revealFields(false);
        showUpdateSelectionUi();
      }
    } catch (_err) {
      setMessage("Submission failed due to a network error.", "error");
    }
  });
})();
