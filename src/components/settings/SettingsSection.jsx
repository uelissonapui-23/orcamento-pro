export default function SettingsSection({ title, description, children, aside }) {
  return (
    <section className="settings-section">
      <div className="settings-section-head">
        <div>
          <h2>{title}</h2>
          {description ? <p>{description}</p> : null}
        </div>
        {aside ? <div className="settings-section-aside">{aside}</div> : null}
      </div>
      <div className="settings-section-body">{children}</div>
    </section>
  );
}
