import { useResource } from "./useResource.js";
import { useRef, useState } from "react";
import { Alert, Button, Progress } from "antd";
import { ArrowLeft, Trophy } from "lucide-react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { api } from "../api/platform.js";
import { useApp } from "./state.js";
import {
  EmptyState,
  ErrorNotice,
  PageTitle,
  Resource,
  SectionTitle,
  Status,
} from "./ui.jsx";
import { Game } from "./Game.jsx";
import { gameTitle, remainingItems, resultPayload } from "./game-model.js";
export function HistoryList({ attempts }) {
  const { t, date } = useApp();
  return attempts.length ? (
    <div className="list-panel">
      {attempts.map((a) => (
        <Link to={`/attempts/${a.id}`} className="list-row" key={a.id}>
          <div className="grow">
            <h3>
              {t("Started")} {date(a.startedAt)}
            </h3>
            <p>
              {a.results.length} / {a.items.length} {t("activities")}
            </p>
          </div>
          <Status value={a.status} />
          <strong>
            {a.totalScore} / {a.maxScore}
          </strong>
        </Link>
      ))}
    </div>
  ) : (
    <EmptyState
      title="No attempts yet"
      description="Progress will appear here after an activity is started."
    />
  );
}
export function LegacyWorksheetEntry() {
  const { worksheetId } = useParams();
  const resource = useResource(async () => {
    try {
      await api.worksheet(worksheetId);
      return null;
    } catch (error) {
      if (error.status !== 404) throw error;
      const assignments = await api.assignments();
      const assignment = assignments.find(
        (a) => a.worksheet.id === Number(worksheetId) && !a.revokedAt,
      );
      if (!assignment) throw error;
      return assignment.id;
    }
  }, [worksheetId]);
  return (
    <Resource resource={resource}>
      {(assignmentId) =>
        assignmentId ? (
          <Navigate to={`/assignments/${assignmentId}`} replace />
        ) : (
          <AssignmentDetail personal />
        )
      }
    </Resource>
  );
}
export function AssignmentDetail({ personal = false }) {
  const params = useParams();
  const id = params.id || params.worksheetId;
  const { t, user } = useApp();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const lock = useRef(false);
  const resource = useResource(async () => {
    const [entry, history] = await Promise.all([
      personal ? api.worksheet(id) : api.assignment(id),
      api.history(id, personal),
    ]);
    return { entry, history };
  }, [id, personal]);
  async function start() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError(null);
    try {
      const history = await api.history(id, personal);
      const current =
        history.find((a) => a.status === "IN_PROGRESS") ||
        (await api.start(id, personal));
      navigate(`/attempts/${current.id}`);
    } catch (e) {
      setError(e);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <Resource resource={resource}>
      {({ entry, history }) => {
        const worksheet = personal ? entry : entry.worksheet;
        const canPlay =
          personal || (entry.userId === user.id && !entry.revokedAt);
        return (
          <>
            <PageTitle
              eyebrow={personal ? "Personal practice" : "Assignments"}
              title={worksheet.name}
              literalTitle
              subtitle={
                personal
                  ? undefined
                  : `${t("Assigned by")} ${entry.teacherName}`
              }
            >
              <Status
                value={entry.revokedAt ? "REVOKED" : entry.status || "ACTIVE"}
              />
            </PageTitle>
            <ErrorNotice error={error} />
            <div className="panel assignment-summary">
              <div>
                <h2>
                  {worksheet.items.length} {t("activities")}
                </h2>
                <p className="muted">
                  {t(
                    "Saved activities stay completed. An unfinished activity restarts when you return.",
                  )}
                </p>
              </div>
              {canPlay && (
                <Button
                  type="primary"
                  size="large"
                  loading={busy}
                  onClick={start}
                >
                  {t(
                    history.some((a) => a.status === "IN_PROGRESS")
                      ? "Continue learning"
                      : history.length
                        ? "Try again"
                        : "Start learning",
                  )}
                </Button>
              )}
            </div>
            <SectionTitle title="Activity collection" />
            <div className="list-panel">
              {worksheet.items.map((item, i) => (
                <div className="list-row" key={item.id}>
                  <span className="step-number">{i + 1}</span>
                  <h3>{gameTitle(item.definition, t)}</h3>
                </div>
              ))}
            </div>
            <SectionTitle title="History" />
            <HistoryList attempts={history} />
          </>
        );
      }}
    </Resource>
  );
}
export function AttemptPage() {
  const { id } = useParams();
  const resource = useResource(() => api.attempt(id), [id]);
  return (
    <Resource resource={resource}>
      {(attempt) => <AttemptContent key={id} initial={attempt} />}
    </Resource>
  );
}
function AttemptContent({ initial }) {
  const { t, user } = useApp();
  const [attempt, setAttempt] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const lock = useRef(false);
  const pending = remainingItems(attempt);
  const item = pending[0];
  const readOnly =
    attempt.status !== "IN_PROGRESS" ||
    (attempt.assignmentId && user.role !== "USER");
  const back = attempt.assignmentId
    ? `/assignments/${attempt.assignmentId}`
    : `/kids/${attempt.worksheetId}`;
  async function save(result) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError(null);
    try {
      const saved = await api.result(attempt.id, item.id, result);
      setAttempt((a) => ({
        ...a,
        results: [
          ...a.results.filter((r) => r.revisionItemId !== item.id),
          saved,
        ],
      }));
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
      lock.current = false;
    }
  }
  async function finish() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError(null);
    try {
      setAttempt(await api.complete(attempt.id));
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
      lock.current = false;
    }
  }
  return (
    <div className="attempt-layout">
      <div className="attempt-header">
        <Link to={back}>
          <ArrowLeft size={17} />
          {t("Back")}
        </Link>
        <Status value={attempt.status} />
      </div>
      <ErrorNotice error={error} />
      {readOnly ? (
        <>
          <div className="panel results-hero">
            <span className="success-orb">
              <Trophy size={34} />
            </span>
            <h1>
              {t(attempt.status === "COMPLETED" ? "Well done!" : "Results")}
            </h1>
            <p>{t("Your work is saved. Every small step counts.")}</p>
            <p className="result-number">
              {attempt.totalScore}
              <span> / {attempt.maxScore}</span>
            </p>
          </div>
          <div className="list-panel">
            {attempt.items.map((activity, i) => {
              const result = attempt.results.find(
                (r) => r.revisionItemId === activity.id,
              );
              return (
                <div className="list-row" key={activity.id}>
                  <span className="step-number">{i + 1}</span>
                  <div className="grow">
                    <h3>{gameTitle(activity.definition, t)}</h3>
                    {result && <Status value={result.outcome} />}
                  </div>
                  <strong>
                    {result ? `${result.score} / ${result.maxScore}` : "—"}
                  </strong>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <div className="attempt-progress">
            <span>
              {attempt.results.length} / {attempt.items.length}{" "}
              {t("activities")}
            </span>
            <Progress
              percent={Math.round(
                (attempt.results.length / attempt.items.length) * 100,
              )}
              showInfo={false}
              strokeColor="#256b60"
            />
          </div>
          {item ? (
            <>
              <div className="panel play-surface">
                <Game key={item.id} item={item} onComplete={save} busy={busy} />
              </div>
              <div className="play-footer">
                <p>
                  {t(
                    "Saved activities stay completed. An unfinished activity restarts when you return.",
                  )}
                </p>
                <Button
                  disabled={busy}
                  onClick={() =>
                    save(
                      resultPayload(
                        0,
                        item.configuration.exerciseCount ||
                          item.configuration.animals?.length ||
                          5,
                        0,
                        "SKIPPED",
                      ),
                    )
                  }
                >
                  {t("Skip activity")}
                </Button>
              </div>
            </>
          ) : (
            <div className="panel results-hero">
              <Alert
                type="success"
                title={t("All activities are saved. Ready to finish?")}
              />
              <Button
                size="large"
                type="primary"
                onClick={finish}
                loading={busy}
              >
                {t("Finish worksheet")}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
