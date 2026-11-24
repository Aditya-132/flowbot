import { useState } from "react";
import { api, setToken } from "./api.js";

/* ============================================================
   Auth — login / signup. Renders as a full page, or as a modal
   (modal + onClose props) when a guest hits a login-only action:
   saving a bot, saving a custom block, exporting code, activating.
   On success stores the bearer token and hands the user up.
   ============================================================ */

export default function AuthPage({ onAuth, modal = false, onClose }) {
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [countryName, setCountryName] = useState("India");
  const [countryOpen, setCountryOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res =
        mode === "signup"
          ? await api.signup({ name, email, password, countryCode, phone: phone.trim() })
          : await api.login({ email, password });
      setToken(res.token);
      onAuth(res.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const switchMode = (m) => { setMode(m); setError(null); };

  return (
    <div style={{ ...S.page, ...(modal ? S.pageModal : {}) }} onClick={modal ? onClose : undefined}>
      <div style={S.card} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
          <div style={S.logo}>⚡</div>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontWeight: 800, fontSize: 20, margin: 0 }}>FlowBot — WhatsApp Bot Builder</h1>
            <div style={{ fontSize: 11, color: "#64748b" }}>drag & drop flowchart → live WhatsApp bot · no code, no AI</div>
          </div>
          {modal && <button style={S.closeBtn} onClick={onClose} title="Keep building without an account">✕</button>}
        </div>
        {modal && (
          <div style={S.modalNote}>
            🔐 Create a free account (or log in) to save this bot, make custom blocks, export code and go live.
            Your canvas stays exactly as it is.
          </div>
        )}
        <p style={{ fontSize: 12, color: "#64748b", margin: 0, lineHeight: 1.55 }}>
          39+ ready blocks, hotel/restaurant/bank/store templates, a Block Lab to invent your own
          blocks, a live simulator — go live on Meta, Twilio, Green API or Whapi, or export your
          bot's full code as a ZIP.
        </p>

        <div style={S.tabs}>
          <button style={{ ...S.tab, ...(mode === "login" ? S.tabActive : {}) }} onClick={() => switchMode("login")}>
            Log in
          </button>
          <button style={{ ...S.tab, ...(mode === "signup" ? S.tabActive : {}) }} onClick={() => switchMode("signup")}>
            Sign up
          </button>
        </div>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {mode === "signup" && (
            <label style={S.label}>
              Name
              <input style={S.input} value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Your name" autoComplete="name" />
            </label>
          )}
          {mode === "signup" && (
            <label style={S.label}>
              Phone Number
              <div style={S.phoneRow}>
                <div style={S.countryPicker}>
                  <button
                    type="button"
                    style={S.countryCode}
                    onClick={() => setCountryOpen((open) => !open)}
                    aria-label="Select country calling code"
                    aria-expanded={countryOpen}
                  >
                    {countryName} ({countryCode}) <span aria-hidden="true">▾</span>
                  </button>
                  {countryOpen && (
                    <div style={S.countryList} role="listbox" aria-label="Country calling codes">
                      {COUNTRY_CODES.map((country, index) => (
                        <button
                          type="button"
                          key={`${country.name}-${index}`}
                          role="option"
                          aria-selected={country.name === countryName}
                          style={{ ...S.countryOption, ...(country.name === countryName ? S.countryOptionActive : {}) }}
                          onClick={() => { setCountryCode(country.code); setCountryName(country.name); setCountryOpen(false); }}
                        >
                          {country.name} ({country.code})
                        </button>
                      ))}
                    <div style={S.countryList} aria-label="Country calling codes">
                      <input
                        style={S.countrySearch}
                        type="search"
                        value={countrySearch}
                        onChange={(e) => setCountrySearch(e.target.value)}
                        placeholder="Search country..."
                        aria-label="Search countries"
                        autoFocus
                      />
                      <div style={S.countryOptions} role="listbox" aria-label="Country calling codes">
                        {COUNTRY_CODES
                          .filter((country) =>
                            `${country.name} ${country.code}`.toLowerCase().includes(countrySearch.trim().toLowerCase())
                          )
                          .map((country) => (
                            <button
                              type="button"
                              key={`${country.name}-${country.code}`}
                              role="option"
                              aria-selected={country.name === countryName}
                              style={{ ...S.countryOption, ...(country.name === countryName ? S.countryOptionActive : {}) }}
                              onClick={() => {
                                setCountryCode(country.code);
                                setCountryName(country.name);
                                setCountryOpen(false);
                                setCountrySearch("");
                              }}
                            >
                              {country.name} ({country.code})
                            </button>
                          ))}
                        {COUNTRY_CODES.filter((country) =>
                          `${country.name} ${country.code}`.toLowerCase().includes(countrySearch.trim().toLowerCase())
                        ).length === 0 && (
                          <div style={S.noCountryResults}>No countries found</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <input style={{ ...S.input, flex: 1, minWidth: 0 }} type="tel" required value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="Phone number" autoComplete="tel-national" inputMode="numeric" />
              </div>
            </label>
          )}
          <label style={S.label}>
            Email
            <input style={S.input} type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com" autoComplete="email" />
          </label>
          <label style={S.label}>
            Password
            <input style={S.input} type="password" required minLength={6} value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "signup" ? "At least 6 characters" : "Your password"}
              autoComplete={mode === "signup" ? "new-password" : "current-password"} />
          </label>

          {error && <div style={S.error}>{error}</div>}

          <button type="submit" style={{ ...S.primaryBtn, opacity: busy ? 0.6 : 1 }} disabled={busy}>
            {busy ? "Please wait…" : mode === "signup" ? "Create account" : "Log in"}
          </button>
        </form>

        <div style={{ fontSize: 12, color: "#64748b", textAlign: "center", marginTop: 4 }}>
          {mode === "login" ? (
            <>New here?{" "}
              <button style={S.linkBtn} onClick={() => switchMode("signup")}>Create an account</button>
            </>
          ) : (
            <>Already have an account?{" "}
              <button style={S.linkBtn} onClick={() => switchMode("login")}>Log in</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const COUNTRY_CODES = [
  { name: "India", code: "+91" }, { name: "United States", code: "+1" },
  { name: "United Kingdom", code: "+44" }, { name: "United Arab Emirates", code: "+971" },
  { name: "Australia", code: "+61" }, { name: "Canada", code: "+1" },
  { name: "Singapore", code: "+65" }, { name: "Pakistan", code: "+92" },
  { name: "Bangladesh", code: "+880" }, { name: "Nepal", code: "+977" },
  { name: "Sri Lanka", code: "+94" }, { name: "Germany", code: "+49" },
  { name: "France", code: "+33" }, { name: "Saudi Arabia", code: "+966" },
  { name: "South Africa", code: "+27" }, { name: "Japan", code: "+81" },
  { name: "China", code: "+86" }, { name: "New Zealand", code: "+64" },
  { name: "India", code: "+91" },
  { name: "Afghanistan", code: "+93" },
  { name: "Albania", code: "+355" },
  { name: "Algeria", code: "+213" },
  { name: "American Samoa", code: "+1684" },
  { name: "Andorra", code: "+376" },
  { name: "Angola", code: "+244" },
  { name: "Anguilla", code: "+1264" },
  { name: "Antigua and Barbuda", code: "+1268" },
  { name: "Argentina", code: "+54" },
  { name: "Armenia", code: "+374" },
  { name: "Aruba", code: "+297" },
  { name: "Australia", code: "+61" },
  { name: "Austria", code: "+43" },
  { name: "Azerbaijan", code: "+994" },
  { name: "Bahamas", code: "+1242" },
  { name: "Bahrain", code: "+973" },
  { name: "Bangladesh", code: "+880" },
  { name: "Barbados", code: "+1246" },
  { name: "Belarus", code: "+375" },
  { name: "Belgium", code: "+32" },
  { name: "Belize", code: "+501" },
  { name: "Benin", code: "+229" },
  { name: "Bermuda", code: "+1441" },
  { name: "Bhutan", code: "+975" },
  { name: "Bolivia, Plurinational State of", code: "+591" },
  { name: "Bonaire, Sint Eustatius and Saba", code: "+599" },
  { name: "Bosnia and Herzegovina", code: "+387" },
  { name: "Botswana", code: "+267" },
  { name: "Brazil", code: "+55" },
  { name: "British Indian Ocean Territory", code: "+246" },
  { name: "Brunei Darussalam", code: "+673" },
  { name: "Bulgaria", code: "+359" },
  { name: "Burkina Faso", code: "+226" },
  { name: "Burundi", code: "+257" },
  { name: "Cabo Verde", code: "+238" },
  { name: "Cambodia", code: "+855" },
  { name: "Cameroon", code: "+237" },
  { name: "Canada", code: "+1" },
  { name: "Cayman Islands", code: "+1345" },
  { name: "Central African Republic", code: "+236" },
  { name: "Chad", code: "+235" },
  { name: "Chile", code: "+56" },
  { name: "China", code: "+86" },
  { name: "Christmas Island", code: "+61" },
  { name: "Cocos (Keeling) Islands", code: "+61" },
  { name: "Colombia", code: "+57" },
  { name: "Comoros", code: "+269" },
  { name: "Congo", code: "+242" },
  { name: "Congo, The Democratic Republic of the", code: "+243" },
  { name: "Cook Islands", code: "+682" },
  { name: "Costa Rica", code: "+506" },
  { name: "Croatia", code: "+385" },
  { name: "Cuba", code: "+53" },
  { name: "Curaçao", code: "+599" },
  { name: "Cyprus", code: "+357" },
  { name: "Czechia", code: "+420" },
  { name: "Côte d'Ivoire", code: "+225" },
  { name: "Denmark", code: "+45" },
  { name: "Djibouti", code: "+253" },
  { name: "Dominica", code: "+1767" },
  { name: "Dominican Republic", code: "+1809" },
  { name: "Ecuador", code: "+593" },
  { name: "Egypt", code: "+20" },
  { name: "El Salvador", code: "+503" },
  { name: "Equatorial Guinea", code: "+240" },
  { name: "Eritrea", code: "+291" },
  { name: "Estonia", code: "+372" },
  { name: "Eswatini", code: "+268" },
  { name: "Ethiopia", code: "+251" },
  { name: "Falkland Islands (Malvinas)", code: "+500" },
  { name: "Faroe Islands", code: "+298" },
  { name: "Fiji", code: "+679" },
  { name: "Finland", code: "+358" },
  { name: "France", code: "+33" },
  { name: "French Guiana", code: "+594" },
  { name: "French Polynesia", code: "+689" },
  { name: "French Southern Territories", code: "+262" },
  { name: "Gabon", code: "+241" },
  { name: "Gambia", code: "+220" },
  { name: "Georgia", code: "+995" },
  { name: "Germany", code: "+49" },
  { name: "Ghana", code: "+233" },
  { name: "Gibraltar", code: "+350" },
  { name: "Greece", code: "+30" },
  { name: "Greenland", code: "+299" },
  { name: "Grenada", code: "+1473" },
  { name: "Guadeloupe", code: "+590" },
  { name: "Guam", code: "+1671" },
  { name: "Guatemala", code: "+502" },
  { name: "Guernsey", code: "+44" },
  { name: "Guinea", code: "+224" },
  { name: "Guinea-Bissau", code: "+245" },
  { name: "Guyana", code: "+592" },
  { name: "Haiti", code: "+509" },
  { name: "Holy See (Vatican City State)", code: "+39" },
  { name: "Honduras", code: "+504" },
  { name: "Hong Kong", code: "+852" },
  { name: "Hungary", code: "+36" },
  { name: "Iceland", code: "+354" },
  { name: "Indonesia", code: "+62" },
  { name: "Iran, Islamic Republic of", code: "+98" },
  { name: "Iraq", code: "+964" },
  { name: "Ireland", code: "+353" },
  { name: "Isle of Man", code: "+44" },
  { name: "Israel", code: "+972" },
  { name: "Italy", code: "+39" },
  { name: "Jamaica", code: "+1876" },
  { name: "Japan", code: "+81" },
  { name: "Jersey", code: "+44" },
  { name: "Jordan", code: "+962" },
  { name: "Kazakhstan", code: "+76" },
  { name: "Kenya", code: "+254" },
  { name: "Kiribati", code: "+686" },
  { name: "Korea, Democratic People's Republic of", code: "+850" },
  { name: "Korea, Republic of", code: "+82" },
  { name: "Kuwait", code: "+965" },
  { name: "Kyrgyzstan", code: "+996" },
  { name: "Lao People's Democratic Republic", code: "+856" },
  { name: "Latvia", code: "+371" },
  { name: "Lebanon", code: "+961" },
  { name: "Lesotho", code: "+266" },
  { name: "Liberia", code: "+231" },
  { name: "Libya", code: "+218" },
  { name: "Liechtenstein", code: "+423" },
  { name: "Lithuania", code: "+370" },
  { name: "Luxembourg", code: "+352" },
  { name: "Macao", code: "+853" },
  { name: "Madagascar", code: "+261" },
  { name: "Malawi", code: "+265" },
  { name: "Malaysia", code: "+60" },
  { name: "Maldives", code: "+960" },
  { name: "Mali", code: "+223" },
  { name: "Malta", code: "+356" },
  { name: "Marshall Islands", code: "+692" },
  { name: "Martinique", code: "+596" },
  { name: "Mauritania", code: "+222" },
  { name: "Mauritius", code: "+230" },
  { name: "Mayotte", code: "+262" },
  { name: "Mexico", code: "+52" },
  { name: "Micronesia, Federated States of", code: "+691" },
  { name: "Moldova, Republic of", code: "+373" },
  { name: "Monaco", code: "+377" },
  { name: "Mongolia", code: "+976" },
  { name: "Montenegro", code: "+382" },
  { name: "Montserrat", code: "+1664" },
  { name: "Morocco", code: "+212" },
  { name: "Mozambique", code: "+258" },
  { name: "Myanmar", code: "+95" },
  { name: "Namibia", code: "+264" },
  { name: "Nauru", code: "+674" },
  { name: "Nepal", code: "+977" },
  { name: "Netherlands", code: "+31" },
  { name: "New Caledonia", code: "+687" },
  { name: "New Zealand", code: "+64" },
  { name: "Nicaragua", code: "+505" },
  { name: "Niger", code: "+227" },
  { name: "Nigeria", code: "+234" },
  { name: "Niue", code: "+683" },
  { name: "Norfolk Island", code: "+672" },
  { name: "North Macedonia", code: "+389" },
  { name: "Northern Mariana Islands", code: "+1670" },
  { name: "Norway", code: "+47" },
  { name: "Oman", code: "+968" },
  { name: "Pakistan", code: "+92" },
  { name: "Palau", code: "+680" },
  { name: "Palestine, State of", code: "+970" },
  { name: "Panama", code: "+507" },
  { name: "Papua New Guinea", code: "+675" },
  { name: "Paraguay", code: "+595" },
  { name: "Peru", code: "+51" },
  { name: "Philippines", code: "+63" },
  { name: "Pitcairn", code: "+64" },
  { name: "Poland", code: "+48" },
  { name: "Portugal", code: "+351" },
  { name: "Puerto Rico", code: "+1787" },
  { name: "Qatar", code: "+974" },
  { name: "Romania", code: "+40" },
  { name: "Russian Federation", code: "+7" },
  { name: "Rwanda", code: "+250" },
  { name: "Réunion", code: "+262" },
  { name: "Saint Barthélemy", code: "+590" },
  { name: "Saint Helena, Ascension and Tristan da Cunha", code: "+290" },
  { name: "Saint Kitts and Nevis", code: "+1869" },
  { name: "Saint Lucia", code: "+1758" },
  { name: "Saint Martin (French part)", code: "+590" },
  { name: "Saint Pierre and Miquelon", code: "+508" },
  { name: "Saint Vincent and the Grenadines", code: "+1784" },
  { name: "Samoa", code: "+685" },
  { name: "San Marino", code: "+378" },
  { name: "Sao Tome and Principe", code: "+239" },
  { name: "Saudi Arabia", code: "+966" },
  { name: "Senegal", code: "+221" },
  { name: "Serbia", code: "+381" },
  { name: "Seychelles", code: "+248" },
  { name: "Sierra Leone", code: "+232" },
  { name: "Singapore", code: "+65" },
  { name: "Sint Maarten (Dutch part)", code: "+1" },
  { name: "Slovakia", code: "+421" },
  { name: "Slovenia", code: "+386" },
  { name: "Solomon Islands", code: "+677" },
  { name: "Somalia", code: "+252" },
  { name: "South Africa", code: "+27" },
  { name: "South Georgia and the South Sandwich Islands", code: "+500" },
  { name: "South Sudan", code: "+211" },
  { name: "Spain", code: "+34" },
  { name: "Sri Lanka", code: "+94" },
  { name: "Sudan", code: "+249" },
  { name: "Suriname", code: "+597" },
  { name: "Svalbard and Jan Mayen", code: "+4779" },
  { name: "Sweden", code: "+46" },
  { name: "Switzerland", code: "+41" },
  { name: "Syrian Arab Republic", code: "+963" },
  { name: "Taiwan, Province of China", code: "+886" },
  { name: "Tajikistan", code: "+992" },
  { name: "Tanzania, United Republic of", code: "+255" },
  { name: "Thailand", code: "+66" },
  { name: "Timor-Leste", code: "+670" },
  { name: "Togo", code: "+228" },
  { name: "Tokelau", code: "+690" },
  { name: "Tonga", code: "+676" },
  { name: "Trinidad and Tobago", code: "+1868" },
  { name: "Tunisia", code: "+216" },
  { name: "Turkmenistan", code: "+993" },
  { name: "Turks and Caicos Islands", code: "+1" },
  { name: "Tuvalu", code: "+688" },
  { name: "Türkiye", code: "+90" },
  { name: "Uganda", code: "+256" },
  { name: "Ukraine", code: "+380" },
  { name: "United Arab Emirates", code: "+971" },
  { name: "United Kingdom", code: "+44" },
  { name: "United States", code: "+1" },
  { name: "Uruguay", code: "+598" },
  { name: "Uzbekistan", code: "+998" },
  { name: "Vanuatu", code: "+678" },
  { name: "Venezuela, Bolivarian Republic of", code: "+58" },
  { name: "Viet Nam", code: "+84" },
  { name: "Virgin Islands, British", code: "+1" },
  { name: "Virgin Islands, U.S.", code: "+1" },
  { name: "Wallis and Futuna", code: "+681" },
  { name: "Western Sahara", code: "+212" },
  { name: "Yemen", code: "+967" },
  { name: "Zambia", code: "+260" },
  { name: "Zimbabwe", code: "+263" },
  { name: "Åland Islands", code: "+358" },
];

const S = {
  page: { height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#eef2f9", color: "#0f172a", fontFamily: "'Sora','Segoe UI',system-ui,sans-serif", backgroundImage: "radial-gradient(#c6d3e8 1.2px, transparent 1.2px)", backgroundSize: "22px 22px" },
  pageModal: { position: "fixed", inset: 0, zIndex: 96, height: "auto", background: "rgba(15,23,42,.5)", backgroundImage: "none" },
  closeBtn: { border: "1px solid #dbe3ee", background: "#ffffff", color: "#64748b", borderRadius: 8, padding: "4px 9px", cursor: "pointer", fontFamily: "inherit", fontSize: 13 },
  modalNote: { fontSize: 12, color: "#047857", background: "#ecfdf5", border: "1px solid #34d399", borderRadius: 10, padding: "9px 12px", lineHeight: 1.5 },
  card: { width: 360, maxWidth: "92vw", maxHeight: "92vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: 16, background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 26, boxShadow: "0 20px 50px rgba(15,23,42,.18)" },
  logo: { width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg,#25D366,#128C7E)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, boxShadow: "0 4px 14px #25d36655" },
  tabs: { display: "flex", gap: 6, background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 10, padding: 4 },
  tab: { flex: 1, padding: "8px 0", borderRadius: 7, border: "none", background: "transparent", color: "#64748b", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" },
  tabActive: { background: "linear-gradient(135deg,#25D366,#128C7E)", color: "#ffffff", boxShadow: "0 3px 10px rgba(18,140,126,.3)" },
  label: { display: "flex", flexDirection: "column", gap: 5, fontSize: 12, fontWeight: 700, color: "#0f766e" },
  phoneRow: { display: "flex", gap: 7 },
  countryPicker: { position: "relative", width: 145, flexShrink: 0 },
  countryCode: { boxSizing: "border-box", width: "100%", minHeight: 39, padding: "9px 7px", borderRadius: 8, border: "1px solid #d6dee9", background: "#ffffff", color: "#0f172a", fontSize: 12, fontFamily: "inherit", cursor: "pointer", textAlign: "left", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  countryList: { position: "absolute", zIndex: 20, top: "calc(100% + 4px)", left: 0, width: 230, maxHeight: 190, overflowY: "scroll", overscrollBehavior: "contain", background: "#ffffff", border: "1px solid #d6dee9", borderRadius: 8, boxShadow: "0 8px 24px rgba(15,23,42,.16)", padding: 4 },
  countryList: { position: "absolute", zIndex: 20, top: "calc(100% + 4px)", left: 0, width: 250, maxHeight: 270, display: "flex", flexDirection: "column", background: "#ffffff", border: "1px solid #d6dee9", borderRadius: 8, boxShadow: "0 8px 24px rgba(15,23,42,.16)", padding: 5 },
  countrySearch: { boxSizing: "border-box", width: "100%", flexShrink: 0, padding: "9px 10px", marginBottom: 5, border: "1px solid #d6dee9", borderRadius: 6, fontSize: 12, outline: "none", fontFamily: "inherit", color: "#0f172a", background: "#ffffff" },
  countryOptions: { minHeight: 0, overflowY: "auto", overscrollBehavior: "contain" },
  noCountryResults: { padding: "10px 9px", color: "#64748b", fontSize: 12 },
  countryOption: { display: "block", width: "100%", border: "none", borderRadius: 5, background: "#ffffff", color: "#0f172a", padding: "8px 9px", fontSize: 12, textAlign: "left", cursor: "pointer", fontFamily: "inherit" },
  countryOptionActive: { background: "#e6f7f2", color: "#0f766e", fontWeight: 700 },
  input: { boxSizing: "border-box", padding: "9px 11px", borderRadius: 8, border: "1px solid #d6dee9", background: "#ffffff", color: "#0f172a", fontSize: 16, outline: "none", fontFamily: "inherit", width: "100%", fontWeight: 400 },
  error: { padding: "8px 12px", borderRadius: 8, background: "#fef2f2", border: "1px solid #ef4444", color: "#b91c1c", fontSize: 12.5, fontWeight: 700 },
  primaryBtn: { padding: "11px 18px", fontSize: 14, fontWeight: 800, borderRadius: 9, border: "none", background: "linear-gradient(135deg,#25D366,#128C7E)", color: "#ffffff", cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 14px rgba(18,140,126,.3)" },
  linkBtn: { border: "none", background: "transparent", color: "#128C7E", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit", padding: 0, textDecoration: "underline" },
};
