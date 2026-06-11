import type { BriefData, BriefLanguage, SignalCard, PersonRow, ChampionProfile, EconomicBuyerProfile, ValueRow, OutboundItem } from './types'

function esc(s: string): string {
  return (s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function nl2br(s: string): string {
  return esc(s).replace(/\n/g, '<br>')
}

// ─── Localized chrome labels ─────────────────────────────────────────────────

const LABELS = {
  en: {
    brief_title: 'Account Intelligence Brief',
    prepared_by: 'Prepared by',
    how_money: 'How they make money:',
    total_funding: 'Total Funding',
    headcount: 'Headcount',
    open_roles: 'Open Relevant Roles',
    incumbent: 'Incumbent in Category',
    yes: 'Yes', no: 'No', yes_competitor: 'Yes (+ competitor)',
    sec_icp: 'ICP SELECTION RATIONALE',
    sec_why_anything: 'WHY ANYTHING',
    sec_why_now: 'WHY NOW',
    sec_people: 'PEOPLE MAP',
    sec_champion_shortlist: 'CHAMPION SHORTLIST',
    sec_eb: 'ECONOMIC BUYER',
    sec_value: 'VALUE MESSAGING',
    sec_outbound: 'OUTBOUND APPROACH',
    sec_discovery: 'DISCOVERY CALL PREP',
    sec_history: 'DEAL HISTORY & CURRENT STATE',
    economic_buyers: 'ECONOMIC BUYERS',
    champions: 'CHAMPIONS',
    coaches: 'COACHES',
    champion: 'Champion',
    primary: 'Primary', secondary: 'Secondary',
    why_champion: 'Why Champion', entry_angle: 'Entry Angle',
    likely_objection: 'Likely Objection', how_to_handle: 'How to Handle',
    why_them: 'Why Them', what_they_need: 'What They Need',
    th_name: 'Name', th_title: 'Title', th_role: 'Role', th_email: 'Email',
    th_persona: 'Persona', th_pain: 'Pain', th_product: 'Product + what it does concretely', th_value: 'Value delivered',
    call_objective: 'Call objective:',
    questions: 'QUESTIONS TO ASK',
    landmines: 'LANDMINES — DO NOT SAY',
    next_steps: 'NEXT STEPS',
    risks: 'RISKS TO WATCH',
    email: 'EMAIL', linkedin: 'LINKEDIN MESSAGE', subject: 'Subject:',
    footer: 'Generated with Inquiry — AI Account Intelligence',
  },
  fr: {
    brief_title: 'Account Intelligence Brief',
    prepared_by: 'Préparé par',
    how_money: 'Comment ils gagnent de l’argent :',
    total_funding: 'Levées de fonds',
    headcount: 'Effectif',
    open_roles: 'Postes ouverts pertinents',
    incumbent: 'Outil en place',
    yes: 'Oui', no: 'Non', yes_competitor: 'Oui (+ concurrent)',
    sec_icp: 'RATIONNEL DE SÉLECTION ICP',
    sec_why_anything: 'WHY ANYTHING',
    sec_why_now: 'WHY NOW',
    sec_people: 'CARTOGRAPHIE DES INTERLOCUTEURS',
    sec_champion_shortlist: 'CHAMPION SHORTLIST',
    sec_eb: 'ECONOMIC BUYER',
    sec_value: 'MESSAGES DE VALEUR',
    sec_outbound: 'APPROCHE OUTBOUND',
    sec_discovery: 'PRÉPA DISCOVERY CALL',
    sec_history: 'HISTORIQUE & ÉTAT DU DEAL',
    economic_buyers: 'ECONOMIC BUYERS',
    champions: 'CHAMPIONS',
    coaches: 'COACHES',
    champion: 'Champion',
    primary: 'Principal', secondary: 'Secondaire',
    why_champion: 'Pourquoi Champion', entry_angle: 'Angle d’entrée',
    likely_objection: 'Objection probable', how_to_handle: 'Comment répondre',
    why_them: 'Pourquoi cette personne', what_they_need: 'Ce qu’il lui faut',
    th_name: 'Nom', th_title: 'Poste', th_role: 'Rôle', th_email: 'Email',
    th_persona: 'Persona', th_pain: 'Pain', th_product: 'Produit + ce que ça fait concrètement', th_value: 'Valeur délivrée',
    call_objective: 'Objectif du call :',
    questions: 'QUESTIONS À POSER',
    landmines: 'PIÈGES — À NE PAS DIRE',
    next_steps: 'PROCHAINES ÉTAPES',
    risks: 'RISQUES À SURVEILLER',
    email: 'EMAIL', linkedin: 'MESSAGE LINKEDIN', subject: 'Objet :',
    footer: 'Généré avec Inquiry — AI Account Intelligence',
  },
}

export function buildHTML(data: BriefData, language: BriefLanguage = 'en', brandColor = '#7c3aed'): string {
  const { account_name, vendor_name, month_year, preparer_name, step1, step2, deal_history } = data
  const t = LABELS[language] ?? LABELS.en
  const s1 = step1
  const s2 = step2

  function signalCards(cards: SignalCard[]): string {
    return (cards ?? []).map(c => `
    <div class="signal">
      <div class="signal-head"><span class="signal-tag">${esc(c.tag)}</span><span class="signal-title">${esc(c.title)}</span></div>
      <div class="signal-body">${nl2br(c.body)}</div>
    </div>`).join('\n')
  }

  function peopleTable(rows: PersonRow[]): string {
    if (!rows.length) return ''
    return `
    <table class="data-table">
      <thead><tr><th>${t.th_name}</th><th>${t.th_title}</th><th>${t.th_role}</th><th>${t.th_email}</th></tr></thead>
      <tbody>
        ${rows.map((r, i) => `
        <tr${i % 2 === 1 ? ' class="alt"' : ''}>
          <td><strong>${esc(r.name)}</strong></td>
          <td>${esc(r.title)}</td>
          <td>${esc(r.role)}</td>
          <td>${r.email ? `<!--email_off-->${esc(r.email)}<!--/email_off-->` : ''}</td>
        </tr>`).join('')}
      </tbody>
    </table>`
  }

  function championProfiles(profiles: ChampionProfile[]): string {
    return (profiles ?? []).map(p => `
    <div class="sub">${t.champion} : ${esc(p.name)}, ${esc(p.title)}</div>
    <table class="profile-table">
      <tr><td>${t.why_champion}</td><td>${nl2br(p.why_champion)}</td></tr>
      <tr><td>${t.entry_angle}</td><td>${nl2br(p.entry_angle)}</td></tr>
      <tr><td>${t.likely_objection}</td><td>${nl2br(p.likely_objection)}</td></tr>
      <tr><td>${t.how_to_handle}</td><td>${nl2br(p.how_to_handle)}</td></tr>
    </table>`).join('\n')
  }

  function economicBuyerProfiles(profiles: EconomicBuyerProfile[]): string {
    return (profiles ?? []).map((p, i) => `
    <div class="sub">${i === 0 ? t.primary : t.secondary} : ${esc(p.name)}, ${esc(p.title)}</div>
    <table class="profile-table">
      <tr><td>${t.why_them}</td><td>${nl2br(p.why_them)}</td></tr>
      <tr><td>${t.what_they_need}</td><td>${nl2br(p.what_they_need)}</td></tr>
    </table>`).join('\n')
  }

  function valueMessagingTable(rows: ValueRow[]): string {
    return `
    <table class="value-table">
      <thead>
        <tr>
          <th style="width:14%">${t.th_persona}</th>
          <th style="width:29%">${t.th_pain}</th>
          <th style="width:28%">${t.th_product}</th>
          <th style="width:29%">${t.th_value}</th>
        </tr>
      </thead>
      <tbody>
        ${(rows ?? []).map((r, i) => `
        <tr${i % 2 === 1 ? ' class="alt"' : ''}>
          <td><strong>${esc(r.persona_name)}</strong><br>${esc(r.persona_title)}</td>
          <td>${nl2br(r.pain)}</td>
          <td>${nl2br(r.product_mechanism)}</td>
          <td>${nl2br(r.value_delivered)}</td>
        </tr>`).join('')}
      </tbody>
    </table>`
  }

  function outboundSection(items: OutboundItem[]): string {
    return (items ?? []).map(item => `
    <div class="sub">${esc(item.name)}, ${esc(item.title)} (${esc(item.role_in_deal)})</div>
    <div class="spacer-sm"></div>
    ${item.email ? `
    <div class="outreach">
      <div class="outreach-header">
        <span class="outreach-channel">${t.email}</span>
        <span class="outreach-subject">${t.subject} ${esc(item.email.subject)}</span>
      </div>
      <div class="outreach-body">${nl2br(item.email.body)}</div>
    </div>` : ''}
    ${item.linkedin ? `
    <div class="outreach">
      <div class="outreach-header">
        <span class="outreach-channel">${t.linkedin}</span>
      </div>
      <div class="outreach-body">${nl2br(item.linkedin.body)}</div>
    </div>` : ''}`).join('\n')
  }

  let secNum = 8

  const css = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; font-size: 13px; color: #1a1d27; background: #fff; line-height: 1.6; -webkit-font-smoothing: antialiased; }
  @media print { body { font-size: 11px; } .no-print { display: none; } }

  .page { max-width: 800px; margin: 0 auto; padding: 48px 56px; }

  /* ── Cover ── */
  .cover { max-width: 800px; margin: 0 auto; padding: 0 0 44px; }
  .cover-band { background: linear-gradient(135deg, ${brandColor} 0%, #4c1d95 100%); padding: 52px 56px 44px; color: white; }
  .cover-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 44px; }
  .cover-vendor { font-size: 13px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; opacity: 0.92; }
  .cover-date { font-size: 12px; opacity: 0.7; }
  .cover-prospect { font-size: 42px; font-weight: 900; letter-spacing: -0.03em; margin-bottom: 10px; line-height: 1.1; }
  .cover-title-row { display: flex; align-items: center; gap: 14px; }
  .cover-title { font-size: 15px; font-weight: 500; opacity: 0.85; }
  .cover-sub { font-size: 12px; opacity: 0.6; margin-top: 4px; }
  .cover-inner { padding: 36px 56px 0; }

  .metrics-row { display: flex; gap: 12px; margin-bottom: 22px; }
  .metric { flex: 1; padding: 16px 18px; border: 1px solid #E8E9EE; border-radius: 12px; background: #FAFAFC; }
  .metric-value { font-size: 19px; font-weight: 800; color: #16181f; margin-bottom: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .metric-label { font-size: 10px; font-weight: 700; color: #8B8FA3; text-transform: uppercase; letter-spacing: 0.07em; }
  .how-money { font-size: 13px; color: #3a3f51; border-left: 3px solid ${brandColor}; padding: 12px 16px; background: ${brandColor}08; border-radius: 0 8px 8px 0; }
  .how-money strong { color: #16181f; }

  /* ── Sections ── */
  .doc-header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 14px; border-bottom: 2px solid #16181f; margin-bottom: 36px; }
  .doc-header-title { font-size: 13px; font-weight: 700; color: #16181f; line-height: 1.3; }
  .doc-header-sub { font-size: 11px; color: #8B8FA3; }
  .doc-header-brand { font-size: 21px; font-weight: 900; color: ${brandColor}; letter-spacing: -0.02em; }

  .sec-title { display: flex; align-items: center; gap: 10px; margin: 44px 0 18px; }
  .sec-num { display: inline-flex; align-items: center; justify-content: center; min-width: 26px; height: 26px; border-radius: 8px; background: ${brandColor}; color: white; font-size: 12px; font-weight: 800; }
  .sec-name { font-size: 13px; font-weight: 800; color: #16181f; text-transform: uppercase; letter-spacing: 0.09em; }
  .sec-rule { flex: 1; height: 1px; background: #E8E9EE; }

  .signal { border: 1px solid #E8E9EE; border-left: 3px solid ${brandColor}; background: #FAFAFC; padding: 14px 16px; margin-bottom: 10px; border-radius: 0 10px 10px 0; }
  .signal-head { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; flex-wrap: wrap; }
  .signal-tag { display: inline-block; color: ${brandColor}; background: ${brandColor}14; font-weight: 800; font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; padding: 2px 9px; border-radius: 99px; white-space: nowrap; }
  .signal-title { font-size: 13px; font-weight: 700; color: #16181f; }
  .signal-body { font-size: 12px; color: #3a3f51; line-height: 1.65; }

  .lbl { font-size: 10.5px; font-weight: 800; color: #8B8FA3; text-transform: uppercase; letter-spacing: 0.07em; margin: 20px 0 8px; }
  .sub { font-size: 13px; font-weight: 700; color: #16181f; margin: 20px 0 8px; }
  .spacer { height: 28px; }
  .spacer-sm { height: 8px; }

  .data-table { width: 100%; border-collapse: separate; border-spacing: 0; margin-bottom: 12px; font-size: 12px; border: 1px solid #E8E9EE; border-radius: 10px; overflow: hidden; }
  .data-table thead tr { background: #16181f; color: #fff; }
  .data-table th { padding: 9px 12px; text-align: left; font-weight: 700; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.04em; }
  .data-table td { padding: 9px 12px; border-bottom: 1px solid #F0F1F5; }
  .data-table tbody tr:last-child td { border-bottom: none; }
  .data-table tbody tr:nth-child(even) { background: #FAFAFC; }

  .profile-table { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 12px; margin-bottom: 16px; border: 1px solid #E8E9EE; border-radius: 10px; overflow: hidden; }
  .profile-table td { padding: 10px 13px; border-bottom: 1px solid #F0F1F5; vertical-align: top; }
  .profile-table tr:last-child td { border-bottom: none; }
  .profile-table td:first-child { font-weight: 700; color: #16181f; width: 26%; background: #F6F7FA; white-space: nowrap; font-size: 11px; }

  .value-table { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 12px; margin-bottom: 16px; border: 1px solid #E8E9EE; border-radius: 10px; overflow: hidden; }
  .value-table thead tr { background: #16181f; color: #fff; }
  .value-table th { padding: 9px 12px; text-align: left; font-weight: 700; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.04em; }
  .value-table td { padding: 10px 12px; border-bottom: 1px solid #F0F1F5; vertical-align: top; }
  .value-table tbody tr:last-child td { border-bottom: none; }
  .value-table tr.alt td { background: #FAFAFC; }

  .outreach { margin-bottom: 16px; border: 1px solid #E8E9EE; border-radius: 12px; overflow: hidden; }
  .outreach-header { background: linear-gradient(135deg, ${brandColor}, #5b21b6); padding: 10px 16px; display: flex; align-items: center; gap: 12px; }
  .outreach-channel { font-size: 11px; font-weight: 800; color: #fff; letter-spacing: 0.05em; }
  .outreach-subject { font-size: 11px; color: rgba(255,255,255,0.85); }
  .outreach-body { padding: 16px 18px; font-size: 12px; color: #3a3f51; line-height: 1.75; white-space: pre-wrap; background: #fff; }

  .objective { font-size: 13px; color: #3a3f51; border: 1px solid ${brandColor}30; padding: 13px 16px; background: ${brandColor}0A; border-radius: 10px; margin-bottom: 16px; }
  .objective strong { color: #16181f; }

  .check-list { list-style: none; counter-reset: q; }
  .check-list li { padding: 9px 0 9px 34px; position: relative; border-bottom: 1px solid #F0F1F5; font-size: 12.5px; color: #3a3f51; line-height: 1.55; }
  .check-list li:last-child { border-bottom: none; }
  .check-list.numbered li { counter-increment: q; }
  .check-list.numbered li::before { content: counter(q); position: absolute; left: 0; top: 9px; width: 21px; height: 21px; border-radius: 7px; background: ${brandColor}14; color: ${brandColor}; font-size: 11px; font-weight: 800; display: flex; align-items: center; justify-content: center; }
  .check-list.warn li::before { content: "✕"; position: absolute; left: 0; top: 9px; width: 21px; height: 21px; border-radius: 7px; background: #fef2f2; color: #dc2626; font-size: 10px; font-weight: 800; display: flex; align-items: center; justify-content: center; }
  .check-list.arrow li::before { content: "→"; position: absolute; left: 0; top: 9px; width: 21px; height: 21px; border-radius: 7px; background: ${brandColor}14; color: ${brandColor}; font-size: 11px; font-weight: 800; display: flex; align-items: center; justify-content: center; }

  .history-item { display: flex; gap: 16px; padding: 13px 0; border-bottom: 1px solid #F0F1F5; }
  .history-meta { min-width: 130px; }
  .history-stage { display: inline-block; font-size: 9.5px; font-weight: 800; color: ${brandColor}; text-transform: uppercase; letter-spacing: 0.06em; background: ${brandColor}12; padding: 3px 9px; border-radius: 99px; margin-bottom: 4px; }
  .history-date { font-size: 11px; color: #8B8FA3; }
  .history-body { flex: 1; }
  .history-title { font-size: 12.5px; font-weight: 700; color: #16181f; margin-bottom: 3px; }
  .history-summary { font-size: 12px; color: #3a3f51; line-height: 1.6; }

  .footer { max-width: 800px; margin: 0 auto; padding: 28px 56px 40px; border-top: 1px solid #E8E9EE; display: flex; align-items: center; justify-content: space-between; }
  .footer-brand { font-size: 11px; font-weight: 700; color: ${brandColor}; }
  .footer-note { font-size: 10.5px; color: #8B8FA3; }

  p { font-size: 13px; color: #3a3f51; line-height: 1.7; margin-bottom: 12px; }
  `

  const sectionTitle = (num: string, name: string) => `
  <div class="sec-title">
    <span class="sec-num">${num}</span>
    <span class="sec-name">${name}</span>
    <span class="sec-rule"></span>
  </div>`

  const discoveryPrepSection = s2.discovery_prep ? `
  ${sectionTitle(String(++secNum).padStart(2, '0'), t.sec_discovery)}
  <div class="objective"><strong>${t.call_objective}</strong> ${esc(s2.discovery_prep.call_objective)}</div>
  <div class="lbl">${t.questions}</div>
  <ul class="check-list numbered">
    ${s2.discovery_prep.questions.map(q => `<li>${esc(q)}</li>`).join('')}
  </ul>
  ${s2.discovery_prep.landmines.length ? `
  <div class="lbl">${t.landmines}</div>
  <ul class="check-list warn">
    ${s2.discovery_prep.landmines.map(l => `<li>${esc(l)}</li>`).join('')}
  </ul>` : ''}
  ` : ''

  const dealHistorySection = deal_history && deal_history.meetings.length ? `
  ${sectionTitle(String(++secNum).padStart(2, '0'), t.sec_history)}
  ${deal_history.meetings.map(m => `
  <div class="history-item">
    <div class="history-meta">
      <div class="history-stage">${esc(m.stage)}</div>
      <div class="history-date">${esc(m.date)}</div>
    </div>
    <div class="history-body">
      <div class="history-title">${esc(m.title)}</div>
      <div class="history-summary">${nl2br(m.summary)}</div>
    </div>
  </div>`).join('')}
  ${deal_history.next_steps.length ? `
  <div class="lbl">${t.next_steps}</div>
  <ul class="check-list arrow">
    ${deal_history.next_steps.map(n => `<li>${esc(n)}</li>`).join('')}
  </ul>` : ''}
  ${deal_history.risks.length ? `
  <div class="lbl">${t.risks}</div>
  <ul class="check-list warn">
    ${deal_history.risks.map(r => `<li>${esc(r)}</li>`).join('')}
  </ul>` : ''}
  ` : ''

  return `<!DOCTYPE html>
<html lang="${language}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(account_name)} x ${esc(vendor_name)} — ${t.brief_title}</title>
<style>${css}</style>
</head>
<body>

<!-- COVER -->
<div class="cover">
  <div class="cover-band">
    <div class="cover-top">
      <div class="cover-vendor">${esc(vendor_name)}</div>
      <div class="cover-date">${esc(month_year)}</div>
    </div>
    <div class="cover-prospect">${esc(account_name)}</div>
    <div class="cover-title-row">
      <div class="cover-title">${t.brief_title}</div>
    </div>
    <div class="cover-sub">${t.prepared_by} ${esc(preparer_name)}</div>
  </div>

  <div class="cover-inner">
    <div class="metrics-row">
      <div class="metric">
        <div class="metric-value">${esc(s1.enrichment.funding || '—')}</div>
        <div class="metric-label">${t.total_funding}</div>
      </div>
      <div class="metric">
        <div class="metric-value">${esc(s1.enrichment.headcount || '—')}</div>
        <div class="metric-label">${t.headcount}</div>
      </div>
      <div class="metric">
        <div class="metric-value">${s1.enrichment.open_relevant_roles > 0 ? s1.enrichment.open_relevant_roles + '+' : '—'}</div>
        <div class="metric-label">${t.open_roles}</div>
      </div>
      <div class="metric">
        <div class="metric-value">${esc(s1.motion === 'A' ? t.yes : s1.motion === 'C' ? t.yes_competitor : t.no)}</div>
        <div class="metric-label">${t.incumbent}</div>
      </div>
    </div>

    <div class="how-money"><strong>${t.how_money}</strong> ${esc(s1.how_they_make_money)}</div>
  </div>
</div>

<!-- MAIN CONTENT -->
<div class="page">

  <div class="doc-header">
    <div>
      <div class="doc-header-brand">${esc(vendor_name)}</div>
      <div class="doc-header-title">${esc(account_name)} x ${esc(vendor_name)} | Commercial Account Intelligence</div>
      <div class="doc-header-sub">${esc(month_year)} &middot; ${t.prepared_by} ${esc(preparer_name)}</div>
    </div>
  </div>

  ${sectionTitle('00', t.sec_icp)}
  ${signalCards(s1.icp_rationale)}

  ${sectionTitle('01', t.sec_why_anything)}
  ${signalCards(s1.why_anything)}

  ${sectionTitle('02', `WHY ${esc(vendor_name.toUpperCase())}`)}
  ${signalCards(s1.why_product)}

  ${sectionTitle('03', t.sec_why_now)}
  ${signalCards(s1.why_now)}

  ${sectionTitle('04', t.sec_people)}

  ${s2.people_map.economic_buyers.length > 0 ? `
  <div class="lbl">${t.economic_buyers}</div>
  <div class="spacer-sm"></div>
  ${peopleTable(s2.people_map.economic_buyers)}` : ''}

  ${s2.people_map.champions.length > 0 ? `
  <div class="lbl">${t.champions}</div>
  <div class="spacer-sm"></div>
  ${peopleTable(s2.people_map.champions)}` : ''}

  ${s2.people_map.coaches.length > 0 ? `
  <div class="lbl">${t.coaches}</div>
  <div class="spacer-sm"></div>
  ${peopleTable(s2.people_map.coaches)}` : ''}

  <div class="spacer"></div>

  ${sectionTitle('05', t.sec_champion_shortlist)}
  ${championProfiles(s2.champion_shortlist)}

  <div class="spacer"></div>

  ${sectionTitle('06', t.sec_eb)}
  ${economicBuyerProfiles(s2.economic_buyers)}

  <div class="spacer"></div>

  ${sectionTitle('07', t.sec_value)}
  ${valueMessagingTable(s2.value_messaging)}

  <div class="spacer"></div>

  ${sectionTitle('08', t.sec_outbound)}
  ${outboundSection(s2.outbound)}

  ${discoveryPrepSection}

  ${dealHistorySection}

</div>

<div class="footer">
  <span class="footer-brand">Inquiry</span>
  <span class="footer-note">${t.footer}</span>
</div>
</body>
</html>`
}
