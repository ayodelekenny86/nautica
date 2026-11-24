function LiveAgentCard({ role, driverUpdate, refreshDriverUpdate, showNotice }) {
  const buyer = role === 'buyer';
  return <section className="live-agent-card panel"><div className="live-agent-head"><span className="ai-label">? LIVE AGENT AI</span><span className="agent-online">Online</span></div><strong>{buyer ? driverUpdate : 'Your route is clear.'}</strong><p>{buyer ? 'Updates are shared by the assigned seller. Ask for help at any time.' : 'I can prepare job notes from your active queue and warn you about late-delivery risk.'}</p><div className="live-agent-actions">{buyer ? <button type="button" onClick={refreshDriverUpdate}>Refresh position</button> : <button type="button" onClick={() => showNotice('There are no active jobs to build a route brief from.')}>Prepare route brief</button>}<button type="button" onClick={() => showNotice('Live agent is reviewing this request.')}>Talk to agent</button></div></section>;
}

export default LiveAgentCard;
