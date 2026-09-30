import { Alert, Button, Empty, Spin } from "antd";
import { Navigate } from "react-router-dom";
import { usePlatform } from "./PlatformState.js";

export function PlatformPage({ title, subtitle, actions, children }) {
  return (
    <main className="platformPage">
      <header className="platformPageHeader">
        <div><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>
        {actions && <div className="platformActions">{actions}</div>}
      </header>
      {children}
    </main>
  );
}

export function ErrorNotice({ error, retry }) {
  if (!error) return null;
  return (
    <Alert
      type="error"
      showIcon
      title={error.message || "Something went wrong."}
      description={error.requestId ? `Request: ${error.requestId}` : undefined}
      action={retry ? <Button onClick={retry}>Try again</Button> : undefined}
    />
  );
}

export function Resource({ resource, children }) {
  if (resource.loading) return <div className="platformLoading"><Spin size="large" /></div>;
  if (resource.error) return <ErrorNotice error={resource.error} retry={resource.reload} />;
  return children(resource.data);
}

export function EmptyPanel({ description }) {
  return <div className="platformPanel"><Empty description={description} /></div>;
}

export function RequireSession({ children }) {
  const { user, loading, sessionError, loadSession } = usePlatform();
  if (loading) return <div className="platformLoading"><Spin size="large" /></div>;
  if (sessionError) return <ErrorNotice error={sessionError} retry={loadSession} />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
