function SocialSignInDivider() {
  return <div className="social-divider" aria-hidden="true"><span>or continue with</span></div>;
}

function PageHeader({ eyebrow, title, copy, action }) {
  return <div className="page-header"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="page-copy">{copy}</p></div>{action}</div>;
}

function ReportActions({ downloadReport }) {
  return <section className="report-actions"><span><strong>Intervention reporting</strong><small>Export demand and deployment data for partners and internal planning.</small></span><button className="outline-button" type="button" onClick={() => downloadReport('Regional demand report')}>Download JSON report</button><button className="primary-button" type="button" onClick={() => downloadReport('Partner intervention brief')}>Create partner brief</button></section>;
}

export { SocialSignInDivider, PageHeader, ReportActions };
