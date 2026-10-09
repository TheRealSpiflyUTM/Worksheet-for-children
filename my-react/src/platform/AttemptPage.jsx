import { useRef, useState } from "react";
import { Alert, Button, Progress } from "antd";
import { Link, useParams } from "react-router-dom";
import { platformApi } from "../api/platform.js";
import { usePlatform } from "./PlatformState.js";
import {
  activityMaxScore,
  gameTitle,
  remainingItems,
  resultPayload,
} from "./game-model.js";
import GamePlayer from "./GamePlayer.jsx";
import { ErrorNotice, PlatformPage, Resource } from "./PlatformUI.jsx";
import { useResource } from "./useResource.js";

export default function AttemptPage() {
  const { id } = useParams();
  const resource = useResource(() => platformApi.attempt(id), [id]);
  return (
    <Resource resource={resource}>
      {(attempt) => <AttemptContent key={attempt.id} initial={attempt} />}
    </Resource>
  );
}

function AttemptContent({ initial }) {
  const { user, t } = usePlatform();
  const [attempt, setAttempt] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const saving = useRef(false);
  const pending = remainingItems(attempt);
  const item = pending[0];
  const readOnly =
    attempt.status !== "IN_PROGRESS" ||
    (attempt.assignmentId && user.role !== "USER");
  const back =
    user.role === "USER"
      ? "/"
      : attempt.assignmentId
        ? `/assignments/${attempt.assignmentId}`
        : `/kids/${attempt.worksheetId}`;

  async function save(result) {
    if (!item || busy || saving.current) return false;
    saving.current = true;
    setBusy(true);
    setError(null);
    try {
      const saved = await platformApi.result(attempt.id, item.id, result);
      setAttempt((current) => ({
        ...current,
        results: [
          ...current.results.filter(
            (entry) => entry.revisionItemId !== item.id,
          ),
          saved,
        ],
      }));
      return true;
    } catch (requestError) {
      setError(requestError);
      return false;
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }

  async function finish() {
    setBusy(true);
    setError(null);
    try {
      setAttempt(await platformApi.complete(attempt.id));
    } catch (requestError) {
      setError(requestError);
    } finally {
      setBusy(false);
    }
  }

  if (readOnly) {
    return (
      <PlatformPage
        title={attempt.status === "COMPLETED" ? t("Well done!") : t("Results")}
        actions={<Link to={back}>{t("Back")}</Link>}
      >
        <section className="platformPanel">
          <p className="platformQuestion">
            {attempt.totalScore} / {attempt.maxScore}
          </p>
          {attempt.items.map((activity, index) => {
            const result = attempt.results.find(
              (entry) => entry.revisionItemId === activity.id,
            );
            return (
              <div className="platformRow" key={activity.id}>
                <span>
                  {index + 1}. {t(gameTitle(activity.definition))}
                </span>
                <strong>
                  {result ? `${result.score} / ${result.maxScore}` : "—"}
                </strong>
              </div>
            );
          })}
        </section>
      </PlatformPage>
    );
  }

  return (
    <PlatformPage
      title={t("Worksheet activity")}
      actions={<Link to={back}>{t("Back")}</Link>}
    >
      <ErrorNotice error={error} />
      <Progress
        percent={
          attempt.items.length
            ? Math.round((attempt.results.length / attempt.items.length) * 100)
            : 100
        }
        showInfo={false}
        strokeColor="#6c5ce7"
      />
      {item ? (
        <>
          <p className="worksheetActivityProgress" role="status">
            {t("Activity {current} of {total}", {
              current: attempt.results.length + 1,
              total: attempt.items.length,
            })}
          </p>
          <GamePlayer key={item.id} item={item} onComplete={save} busy={busy} />
          <div
            className="platformActions"
            style={{ justifyContent: "center", marginTop: 20 }}
          >
            <Button
              disabled={busy}
              onClick={() =>
                save(resultPayload(0, activityMaxScore(item), 0, "SKIPPED"))
              }
            >
              {t("Skip activity")}
            </Button>
          </div>
        </>
      ) : (
        <section className="platformPanel">
          <Alert
            type="success"
            showIcon
            title={t("All activities are saved. Ready to finish?")}
          />
          <Button
            type="primary"
            size="large"
            loading={busy}
            onClick={finish}
            style={{ marginTop: 16 }}
          >
            {t("Finish worksheet")}
          </Button>
        </section>
      )}
    </PlatformPage>
  );
}
