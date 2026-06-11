import type { BriefData, SignalCard, PersonRow, ChampionProfile, EconomicBuyerProfile, ValueRow, OutboundItem } from './types'

function esc(s: string): string {
  return (s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function nl2br(s: string): string {
  return esc(s).replace(/\n/g, '<br>')
}

function signalCards(cards: SignalCard[]): string {
  return (cards ?? []).map(c => `
  <div class="signal">
    <div class="signal-title"><span class="signal-tag">${esc(c.tag)}</span> ${esc(c.title)}</div>
    <div class="signal-body">${nl2br(c.body)}</div>
  </div>`).join('\n')
}

function peopleTable(rows: PersonRow[]): string {
  if (!rows.length) return ''
  return `
  <table class="data-table">
    <thead><tr><th>Name</th><th>Title</th><th>Role</th><th>Email</th></tr></thead>
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
  <div class="sub">Champion: ${esc(p.name)}, ${esc(p.title)}</div>
  <table class="profile-table">
    <tr><td>Why Champion</td><td>${nl2br(p.why_champion)}</td></tr>
    <tr><td>Entry Angle</td><td>${nl2br(p.entry_angle)}</td></tr>
    <tr><td>Likely Objection</td><td>${nl2br(p.likely_objection)}</td></tr>
    <tr><td>How to Handle</td><td>${nl2br(p.how_to_handle)}</td></tr>
  </table>`).join('\n')
}

function economicBuyerProfiles(profiles: EconomicBuyerProfile[]): string {
  return (profiles ?? []).map((p, i) => `
  <div class="sub">${i === 0 ? 'Primary' : 'Secondary'}: ${esc(p.name)}, ${esc(p.title)}</div>
  <table class="profile-table">
    <tr><td>Why Them</td><td>${nl2br(p.why_them)}</td></tr>
    <tr><td>What They Need</td><td>${nl2br(p.what_they_need)}</td></tr>
  </table>`).join('\n')
}

function valueMessagingTable(rows: ValueRow[]): string {
  return `
  <table class="value-table">
    <thead>
      <tr>
        <th style="width:14%">Persona</th>
        <th style="width:29%">Pain</th>
        <th style="width:28%">Product + what it does concretely</th>
        <th style="width:29%">Value delivered</th>
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
      <span class="outreach-channel">EMAIL</span>
      <span class="outreach-subject">Subject: ${esc(item.email.subject)}</span>
    </div>
    <div class="outreach-body">${nl2br(item.email.body)}</div>
  </div>` : ''}
  ${item.linkedin ? `
  <div class="outreach">
    <div class="outreach-header">
      <span class="outreach-channel">LINKEDIN MESSAGE</span>
    </div>
    <div class="outreach-body">${nl2br(item.linkedin.body)}</div>
  </div>` : ''}`).join('\n')
}

export function buildHTML(data: BriefData, brandColor = '#7c3aed'): string {
  const { account_name, vendor_name, month_year, preparer_name, step1, step2, deal_history } = data
  const s1 = step1
  const s2 = step2

  let secNum = 8

  const css = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Arial', sans-serif; font-size: 13px; color: #111827; background: #fff; line-height: 1.6; }
  @media print { body { font-size: 11px; } .no-print { display: none; } }

  .page { max-width: 780px; margin: 0 auto; padding: 48px 56px; }
  .cover { max-width: 780px; margin: 0 auto; padding: 48px 56px 44px; }

  .doc-header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 14px; border-bottom: 1px solid #E5E7EB; margin-bottom: 40px; }
  .doc-header-title { font-size: 13px; font-weight: 700; color: #0D2B45; line-height: 1.3; }
  .doc-header-sub { font-size: 11px; color: #6B7280; }
  .doc-header-brand { font-size: 22px; font-weight: 900; color: ${brandColor}; letter-spacing: -0.02em; }

  .cover-top { display: flex; align-items: center; justify-content: space-between; padding-bottom: 20px; border-bottom: 1px solid #E5E7EB; margin-bottom: 0; }
  .cover-vendor { font-size: 13px; font-weight: 700; color: ${brandColor}; letter-spacing: 0.04em; text-transform: uppercase; }
  .cover-date { font-size: 12px; color: #9CA3AF; }
  .cover-accent-bar { height: 4px; background: linear-gradient(90deg, ${brandColor} 0%, ${brandColor}99 60%, transparent 100%); border-radius: 2px; margin: 28px 0 16px; width: 80px; }
  .cover-prospect { font-size: 38px; font-weight: 900; color: #0D2B45; letter-spacing: -0.03em; margin-bottom: 8px; }
  .cover-title { font-size: 16px; font-weight: 500; color: #6B7280; margin-bottom: 6px; }
  .cover-sub { font-size: 13px; color: #9CA3AF; margin-bottom: 36px; }

  .metrics-row { display: flex; gap: 0; border: 1px solid #E5E7EB; border-radius: 8px; overflow: hidden; margin-bottom: 24px; }
  .metric { flex: 1; padding: 18px 20px; border-right: 1px solid #E5E7EB; }
  .metric:last-child { border-right: none; }
  .metric-value { font-size: 20px; font-weight: 800; color: #0D2B45; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
  .metric-label { font-size: 11px; color: #6B7280; text-transform: uppercase; letter-spacing: 0.06em; }
  .how-money { font-size: 13px; color: #374151; border-left: 3px solid ${brandColor}; padding: 10px 14px; background: #F9FAFB; border-radius: 0 4px 4px 0; }
  .how-money strong { color: #0D2B45; }

  .sec-title { display: flex; align-items: baseline; gap: 8px; margin-bottom: 20px; margin-top: 40px; }
  .sec-num { font-size: 14px; font-weight: 800; color: ${brandColor}; letter-spacing: 0.01em; }
  .sec-sep { color: #D1D5DB; font-size: 14px; }
  .sec-name { font-size: 13px; font-weight: 800; color: #0D2B45; text-transform: uppercase; letter-spacing: 0.08em; }

  .signal { border-left: 3px solid ${brandColor}; background: #F9FAFB; padding: 14px 16px; margin-bottom: 12px; border-radius: 0 6px 6px 0; }
  .signal-title { font-size: 13px; font-weight: 700; color: #0D2B45; margin-bottom: 6px; }
  .signal-tag { color: ${brandColor}; font-weight: 700; margin-right: 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
  .signal-body { font-size: 12px; color: #374151; line-height: 1.65; }

  .lbl { font-size: 11px; font-weight: 700; color: #6B7280; text-transform: uppercase; letter-spacing: 0.06em; margin: 20px 0 8px; }
  .sub { font-size: 13px; font-weight: 700; color: #0D2B45; margin: 20px 0 8px; }
  .spacer { height: 32px; }
  .spacer-sm { height: 8px; }

  .data-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 12px; }
  .data-table thead tr { background: #0D2B45; color: #fff; }
  .data-table th { padding: 9px 12px; text-align: left; font-weight: 700; font-size: 11px; }
  .data-table td { padding: 9px 12px; border-bottom: 1px solid #E5E7EB; }
  .data-table tbody tr:nth-child(even), .data-table tr.alt { background: #F9FAFB; }

  .profile-table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 16px; }
  .profile-table td { padding: 9px 12px; border-bottom: 1px solid #E5E7EB; vertical-align: top; }
  .profile-table td:first-child { font-weight: 700; color: #0D2B45; width: 28%; background: #F3F4F6; white-space: nowrap; }
  .profile-table tr:nth-child(even) td:last-child { background: #FAFAFA; }

  .value-table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 16px; }
  .value-table thead tr { background: #0D2B45; color: #fff; }
  .value-table th { padding: 9px 12px; text-align: left; font-weight: 700; font-size: 11px; }
  .value-table td { padding: 9px 12px; border-bottom: 1px solid #E5E7EB; vertical-align: top; }
  .value-table tr.alt td { background: #F9FAFB; }

  .outreach { margin-bottom: 16px; border: 1px solid #E5E7EB; border-radius: 6px; overflow: hidden; }
  .outreach-header { background: ${brandColor}; padding: 10px 14px; display: flex; align-items: center; gap: 12px; }
  .outreach-channel { font-size: 12px; font-weight: 700; color: #fff; }
  .outreach-subject { font-size: 11px; color: rgba(255,255,255,0.85); }
  .outreach-body { padding: 14px 16px; font-size: 12px; color: #374151; line-height: 1.7; white-space: pre-wrap; background: #fff; }

  .check-list { list-style: none; }
  .check-list li { padding: 8px 0 8px 26px; position: relative; border-bottom: 1px solid #F3F4F6; font-size: 12px; color: #374151; }
  .check-list li::before { content: "→"; position: absolute; left: 4px; color: ${brandColor}; font-weight: 700; }

  .history-item { display: flex; gap: 14px; padding: 12px 0; border-bottom: 1px solid #F3F4F6; }
  .history-meta { min-width: 120px; }
  .history-stage { display: inline-block; font-size: 10px; font-weight: 700; color: ${brandColor}; text-transform: uppercase; letter-spacing: 0.05em; background: ${brandColor}14; padding: 2px 8px; border-radius: 99px; margin-bottom: 4px; }
  .history-date { font-size: 11px; color: #9CA3AF; }
  .history-body { flex: 1; }
  .history-title { font-size: 12px; font-weight: 700; color: #0D2B45; margin-bottom: 3px; }
  .history-summary { font-size: 12px; color: #374151; line-height: 1.6; }

  p { font-size: 13px; color: #374151; line-height: 1.7; margin-bottom: 12px; }
  `

  const sectionTitle = (num: string, name: string) => `
  <div class="sec-title">
    <span class="sec-num">${num}</span>
    <span class="sec-sep">&middot;</span>
    <span class="sec-name">${name}</span>
  </div>`

  const discoveryPrepSection = s2.discovery_prep ? `
  ${sectionTitle(String(++secNum).padStart(2, '0'), 'DISCOVERY CALL PREP')}
  <div class="how-money" style="margin-bottom:16px"><strong>Call objective:</strong> ${esc(s2.discovery_prep.call_objective)}</div>
  <div class="lbl">QUESTIONS TO ASK</div>
  <ul class="check-list">
    ${s2.discovery_prep.questions.map(q => `<li>${esc(q)}</li>`).join('')}
  </ul>
  ${s2.discovery_prep.landmines.length ? `
  <div class="lbl">LANDMINES — DO NOT SAY</div>
  <ul class="check-list">
    ${s2.discovery_prep.landmines.map(l => `<li>${esc(l)}</li>`).join('')}
  </ul>` : ''}
  ` : ''

  const dealHistorySection = deal_history && deal_history.meetings.length ? `
  ${sectionTitle(String(++secNum).padStart(2, '0'), 'DEAL HISTORY & CURRENT STATE')}
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
  <div class="lbl">NEXT STEPS</div>
  <ul class="check-list">
    ${deal_history.next_steps.map(n => `<li>${esc(n)}</li>`).join('')}
  </ul>` : ''}
  ${deal_history.risks.length ? `
  <div class="lbl">RISKS TO WATCH</div>
  <ul class="check-list">
    ${deal_history.risks.map(r => `<li>${esc(r)}</li>`).join('')}
  </ul>` : ''}
  ` : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(account_name)} x ${esc(vendor_name)} Account Intelligence Brief</title>
<style>${css}</style>
</head>
<body>

<!-- COVER -->
<div class="cover">
  <div class="cover-top">
    <div class="cover-vendor">${esc(vendor_name)}</div>
    <div class="cover-date">${esc(month_year)}</div>
  </div>
  <div class="cover-accent-bar"></div>
  <div class="cover-prospect">${esc(account_name)}</div>
  <div class="cover-title">Account Intelligence Brief</div>
  <div class="cover-sub">Prepared by ${esc(preparer_name)}</div>

  <div class="metrics-row">
    <div class="metric">
      <div class="metric-value">${esc(s1.enrichment.funding || 'Unknown')}</div>
      <div class="metric-label">Total Funding</div>
    </div>
    <div class="metric">
      <div class="metric-value">${esc(s1.enrichment.headcount || 'Unknown')}</div>
      <div class="metric-label">Headcount</div>
    </div>
    <div class="metric">
      <div class="metric-value">${s1.enrichment.open_relevant_roles > 0 ? s1.enrichment.open_relevant_roles + '+' : 'Unknown'}</div>
      <div class="metric-label">Open Relevant Roles</div>
    </div>
    <div class="metric">
      <div class="metric-value">${esc(s1.motion === 'A' ? 'Yes' : s1.motion === 'C' ? 'Yes (+ competitor)' : 'No')}</div>
      <div class="metric-label">Incumbent in Category</div>
    </div>
  </div>

  <div class="how-money"><strong>How they make money:</strong> ${esc(s1.how_they_make_money)}</div>
</div>

<!-- MAIN CONTENT -->
<div class="page">

  <div class="doc-header">
    <div>
      <div class="doc-header-brand">${esc(vendor_name)}</div>
      <div class="doc-header-title">${esc(account_name)} x ${esc(vendor_name)} | Commercial Account Intelligence</div>
      <div class="doc-header-sub">${esc(month_year)} &middot; Prepared by ${esc(preparer_name)}</div>
    </div>
  </div>

  ${sectionTitle('00', 'ICP SELECTION RATIONALE')}
  ${signalCards(s1.icp_rationale)}

  ${sectionTitle('01', 'WHY ANYTHING')}
  ${signalCards(s1.why_anything)}

  ${sectionTitle('02', `WHY ${esc(vendor_name.toUpperCase())}`)}
  ${signalCards(s1.why_product)}

  ${sectionTitle('03', 'WHY NOW')}
  ${signalCards(s1.why_now)}

  ${sectionTitle('04', 'PEOPLE MAP')}

  ${s2.people_map.economic_buyers.length > 0 ? `
  <div class="lbl">ECONOMIC BUYERS</div>
  <div class="spacer-sm"></div>
  ${peopleTable(s2.people_map.economic_buyers)}` : ''}

  ${s2.people_map.champions.length > 0 ? `
  <div class="lbl">CHAMPIONS</div>
  <div class="spacer-sm"></div>
  ${peopleTable(s2.people_map.champions)}` : ''}

  ${s2.people_map.coaches.length > 0 ? `
  <div class="lbl">COACHES</div>
  <div class="spacer-sm"></div>
  ${peopleTable(s2.people_map.coaches)}` : ''}

  <div class="spacer"></div>

  ${sectionTitle('05', 'CHAMPION SHORTLIST')}
  ${championProfiles(s2.champion_shortlist)}

  <div class="spacer"></div>

  ${sectionTitle('06', 'ECONOMIC BUYER')}
  ${economicBuyerProfiles(s2.economic_buyers)}

  <div class="spacer"></div>

  ${sectionTitle('07', 'VALUE MESSAGING')}
  ${valueMessagingTable(s2.value_messaging)}

  <div class="spacer"></div>

  ${sectionTitle('08', 'OUTBOUND APPROACH')}
  ${outboundSection(s2.outbound)}

  ${discoveryPrepSection}

  ${dealHistorySection}

</div>
</body>
</html>`
}
