import { Alert, Button, Empty, Select, Spin } from "antd";
import { ArrowRight, BookOpen, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { useApp } from "./state.js";
import { ro } from "./translations.js";
export function ErrorNotice({ error, retry }) {
  const { t, language } = useApp();
  if (!error) return null;
  const fallback = {
    401: "Please sign in to continue.",
    403: "You do not have access to this action.",
    404: "This content is unavailable or no longer shared with you.",
    409: "The information has changed. Reload and try again.",
    400: "Check your information and try again.",
  };
  const message =
    language === "en" || ro[error.message]
      ? error.message
      : fallback[error.status] || "Something went wrong. Please try again.";
  return (
    <Alert
      type="error"
      showIcon
      title={t(message || "Something went wrong. Please try again.")}
      description={
        <>
          {Object.entries(error.fieldErrors || {}).map(([key, value]) => (
            <div key={key}>
              {t(key)}:{" "}
              {language === "en"
                ? String(value)
                : t("Check your information and try again.")}
            </div>
          ))}
          {error.requestId && (
            <small>
              {t("Request ID")}: {error.requestId}
            </small>
          )}
        </>
      }
      action={
        retry && (
          <Button size="small" onClick={retry}>
            {t("Retry")}
          </Button>
        )
      }
    />
  );
}
export function Loading() {
  const { t } = useApp();
  return (
    <div className="loading" role="status">
      <Spin />
      <span>{t("Loading…")}</span>
    </div>
  );
}
export function Resource({ resource, children }) {
  if (resource.loading) return <Loading />;
  if (resource.error)
    return <ErrorNotice error={resource.error} retry={resource.reload} />;
  return children(resource.data);
}
export function LanguageSwitch() {
  const { language, setLanguage, t } = useApp();
  return (
    <Select
      aria-label={t("Language")}
      value={language}
      onChange={setLanguage}
      labelRender={({ value }) => String(value).toUpperCase()}
      variant="borderless"
      popupMatchSelectWidth={130}
      options={[
        { value: "en", label: "EN · English" },
        { value: "ro", label: "RO · Română" },
      ]}
    />
  );
}
export function PageTitle({
  eyebrow,
  title,
  subtitle,
  children,
  literalTitle = false,
}) {
  const { t } = useApp();
  return (
    <header className="page-title">
      <div>
        {eyebrow && <p className="eyebrow">{t(eyebrow)}</p>}
        <h1>{literalTitle ? title : t(title)}</h1>
        {subtitle && <p className="muted">{t(subtitle)}</p>}
      </div>
      <div className="actions">{children}</div>
    </header>
  );
}
export function EmptyState({ title, description, children }) {
  const { t } = useApp();
  return (
    <div className="empty-state">
      <Empty
        image={<BookOpen size={38} strokeWidth={1.3} />}
        description={
          <>
            <h3>{t(title)}</h3>
            <p>{t(description)}</p>
          </>
        }
      />
      {children}
    </div>
  );
}
export function SectionTitle({ title, to }) {
  const { t } = useApp();
  return (
    <div className="section-title">
      <h2>{t(title)}</h2>
      {to && (
        <Link to={to}>
          {t("View all")} <ArrowRight size={15} />
        </Link>
      )}
    </div>
  );
}
export function NewButton({ children, onClick }) {
  return (
    <Button type="primary" icon={<Plus size={17} />} onClick={onClick}>
      {children}
    </Button>
  );
}
export function Status({ value }) {
  const { t } = useApp();
  const names = {
    NOT_STARTED: "Not started",
    IN_PROGRESS: "In progress",
    COMPLETED: "Completed",
    ABANDONED: "Abandoned",
    ACTIVE: "Active",
    REVOKED: "Revoked",
    SKIPPED: "Skip activity",
  };
  return (
    <span className={`status status-${value?.toLowerCase()}`}>
      {t(names[value] || value)}
    </span>
  );
}
