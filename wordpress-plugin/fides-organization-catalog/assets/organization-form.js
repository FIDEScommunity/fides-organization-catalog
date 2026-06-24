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
  const fieldHelp = config.fieldHelp && typeof config.fieldHelp === "object" ? config.fieldHelp : {};
  const countries = Array.isArray(config.countries) ? config.countries : [];
  const selfDeclaredCertifications = Array.isArray(config.selfDeclaredCertifications)
    ? config.selfDeclaredCertifications
    : [];
  const diaccComponents = Array.isArray(config.diaccComponents) ? config.diaccComponents : [];
  const sectionIntro = String(config.sectionIntro || "").trim();
  let selectedOrgId = mode === "update" ? String(config.preselectOrgId || "").trim() : "";
  let selectedOrgLabel = "";

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
        "Self-declared certifications",
        helpText("certificationsIntro") ||
          "Select certifications your organization holds. These are self-declared and may be reviewed before publication.",
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
    const singleSelect = mode === "create";
    const inputType = singleSelect ? "radio" : "checkbox";
    const inputName = singleSelect ? "sector" : "sectors";
    return sectors
      .map(
        (entry) => `
        <label class="fides-form-choice">
          <input type="${inputType}" name="${inputName}" value="${escapeHtml(entry.code)}" />
          <span>${escapeHtml(entry.label || entry.code)}</span>
        </label>`
      )
      .join("");
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
          <span class="fides-form-label" id="fides-org-sectors-label">${mode === "create" ? "Sector *" : "Sectors *"}</span>
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
            <label for="fides-org-website">Website</label>
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
        <div class="fides-form-row">
          <label for="fides-org-description">Description *</label>
          ${helpHtml("description")}
          <textarea id="fides-org-description" name="description" required maxlength="2000" placeholder="Technology company building digital identity and wallet products based on open standards."></textarea>
        </div>
        <div class="fides-form-row">
          <label for="fides-org-tags">Tags</label>
          ${helpHtml("tags")}
          <input id="fides-org-tags" name="tags" type="text" placeholder="wallet, identity" />
        </div>
        <div class="fides-form-grid fides-form-grid-pair">
          <div class="fides-form-row">
            <label for="fides-org-contact-public-email">Public contact email</label>
            ${helpHtml("contactPublicEmail")}
            <input id="fides-org-contact-public-email" name="contactPublicEmail" type="email" placeholder="contact@example.com" />
          </div>
          <div class="fides-form-row">
            <label for="fides-org-contact-support">Public support URL</label>
            ${helpHtml("contactSupport")}
            <input id="fides-org-contact-support" name="contactSupport" type="url" placeholder="https://…/support" />
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
              </div>
              <button type="button" class="fides-secondary-btn" id="fides-org-change">Choose different</button>
            </div>
          </div>`
              : ""
          }
          ${formFieldsHtml()}
        </section>
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

  function setMessage(text, type) {
    if (!messageEl) return;
    messageEl.textContent = text || "";
    messageEl.className = `fides-form-message ${type ? `is-${type}` : ""}`.trim();
  }

  function getCheckedSectors() {
    if (mode === "create") {
      const selected = form.querySelector('input[name="sector"]:checked');
      return selected ? [String(selected.value)] : [];
    }
    return Array.from(form.querySelectorAll('input[name="sectors"]:checked')).map((el) => String(el.value));
  }

  function setCheckedSectors(values) {
    const list = (values || []).map(String);
    if (mode === "create") {
      const selected = list[0] || "";
      form.querySelectorAll('input[name="sector"]').forEach((el) => {
        el.checked = String(el.value) === selected;
      });
      return;
    }
    const set = new Set(list);
    form.querySelectorAll('input[name="sectors"]').forEach((el) => {
      el.checked = set.has(String(el.value));
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
    if (root.querySelector("#fides-org-description")) root.querySelector("#fides-org-description").value = payload.description || "";
    if (root.querySelector("#fides-org-tags")) {
      const tags = Array.isArray(payload.tags) ? payload.tags.join(", ") : "";
      root.querySelector("#fides-org-tags").value = tags;
    }
    const idents = payload.identifiers && typeof payload.identifiers === "object" ? payload.identifiers : {};
    IDENTIFIER_FIELDS.forEach((field) => {
      const el = root.querySelector(`#${field.id}`);
      if (!el) return;
      el.value = idents[field.key] ? String(idents[field.key]) : "";
    });
    const supportEl = root.querySelector("#fides-org-contact-support");
    const publicEmailEl = root.querySelector("#fides-org-contact-public-email");
    if (publicEmailEl) {
      publicEmailEl.value =
        payload.contact && payload.contact.email ? String(payload.contact.email) : "";
    }
    if (supportEl) {
      const support =
        payload.contact && payload.contact.support ? String(payload.contact.support) : "";
      supportEl.value = support;
    }
    const manifestoEl = root.querySelector("#fides-org-manifesto-supporter");
    if (manifestoEl) manifestoEl.checked = payload.fidesManifestoSupporter === true;
    fillCertificationsFromPayload(payload.certifications);
    setCheckedSectors(payload.sectors || []);
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
    };
    const identifiers = buildIdentifiersFromForm();
    if (Object.keys(identifiers).length) {
      payload.identifiers = identifiers;
    }
    const supportEl = root.querySelector("#fides-org-contact-support");
    const publicEmailEl = root.querySelector("#fides-org-contact-public-email");
    const support = supportEl ? String(supportEl.value || "").trim() : "";
    const publicEmail = publicEmailEl ? String(publicEmailEl.value || "").trim() : "";
    const contact = {};
    if (publicEmail) contact.email = publicEmail;
    if (support) contact.support = support;
    if (Object.keys(contact).length) payload.contact = contact;
    const manifestoEl = root.querySelector("#fides-org-manifesto-supporter");
    payload.fidesManifestoSupporter = Boolean(manifestoEl && manifestoEl.checked);
    payload.certifications = buildCertificationsFromForm();
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
  }

  function revealFields(show) {
    if (fieldsWrap) fieldsWrap.hidden = !show;
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
    setMessage("", "");
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
      setMessage(mode === "create" ? "Select a sector." : "Select at least one sector.", "error");
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
