function FinanceEmpty({ title, copy }) {
  return (
    <section className="finance-workspace">
      <div className="finance-heading">
        <div><span className="section-kicker">FINANCE</span><h2>{title}</h2><p>{copy}</p></div>
      </div>
      <p className="empty-feed" role="note">
        No paid orders yet, so there is nothing to report. These figures are summed from real orders and
        are deliberately left at zero rather than filled with sample numbers.
      </p>
    </section>
  );
}

export default FinanceEmpty;
