function InstitutionAgentCard({ showNotice }) {
  return <section className="live-agent-card panel institution-agent"><div className="live-agent-head"><span className="ai-label">? LIVE AGENT AI</span><span className="agent-online">Online</span></div><strong>No scheduling model is connected</strong><p>I cannot tell you when demand peaks or how much reserve to hold. That needs a forecasting model and your actual delivery history, and neither is connected here, so I will not recommend a schedule I cannot justify.</p><div className="live-agent-actions"><button type="button" onClick={() => showNotice('Add your real delivery history and Naut can summarise actual delivery windows from it.')}>How to enable this</button><button type="button" onClick={() => showNotice('Institution support has been notified.')}>Talk to agent</button></div></section>;
}

export default InstitutionAgentCard;
