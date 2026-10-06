import { Alert, Button, Skeleton, Spin } from "antd";
import { ReadOutlined } from "@ant-design/icons";
import { Navigate } from "react-router-dom";
import { usePlatform } from "./PlatformState.js";

export function PlatformPage({ title, subtitle, actions, children }) {
  return (
    <main className="platformPage">
      <header className="platformPageHeader">
        <div>
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {actions && <div className="platformActions">{actions}</div>}
      </header>
      {children}
    </main>
  );
}

export function ErrorNotice({ error, retry }) {
  const { t } = usePlatform();
  if (!error) return null;
  return (
    <Alert
      type="error"
      showIcon
      title={t(error.message || "Something went wrong.")}
      description={error.requestId ? `Request: ${error.requestId}` : undefined}
      action={
        retry ? <Button onClick={retry}>{t("Try again")}</Button> : undefined
      }
    />
  );
}

export function Resource({ resource, children }) {
  if (resource.loading)
    return (
      <div className="platformLoading">
        <Skeleton active title paragraph={{ rows: 3 }} />
      </div>
    );
  if (resource.error)
    return <ErrorNotice error={resource.error} retry={resource.reload} />;
  return children(resource.data);
}

export function EmptyPanel({ description }) {
  return (
    <div className="platformPanel platformEmpty">
      <span className="platformEmptyIcon" aria-hidden="true">
        <ReadOutlined />
      </span>
      <p>{description}</p>
    </div>
  );
}

export function RequireSession({
  children,
  entry = "/login",
  teacherOnly = false,
}) {
  const { user, loading, sessionError, loadSession } = usePlatform();
  if (loading)
    return (
      <div className="platformLoading">
        <Spin size="large" />
      </div>
    );
  if (sessionError)
    return <ErrorNotice error={sessionError} retry={loadSession} />;
  if (!user) return <Navigate to={entry} replace />;
  if (teacherOnly && user.role !== "TEACHER")
    return <Navigate to="/" replace />;
  return children;
}
