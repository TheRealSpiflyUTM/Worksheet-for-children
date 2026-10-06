import { usePlatform } from "../../platform/PlatformState.js";
import { useParams } from "react-router-dom";
import { Card, Typography } from "antd";
import { platformApi } from "../../api/platform.js";
import { gameTitle } from "../../platform/game-model.js";
import { useResource } from "../../platform/useResource.js";
import { EmptyPanel, Resource } from "../../platform/PlatformUI.jsx";
import PathBreadcrumb from "../PathBreadcrumb.jsx";
import StatusBadge from "../../platform/StatusBadge.jsx";
import "../Menu.css";
import "../Classpage.css";
import "../kids/KidPage.css";

export default function TestPage() {
  const { t } = usePlatform();
  const { id, userId, attemptId } = useParams();
  const resource = useResource(async () => {
    const tests = await platformApi.studentTests(id, userId);
    const test = tests.find((entry) => entry.attemptId === Number(attemptId));
    if (!test) throw new Error(t("This test does not belong to this student."));
    return { test, attempt: await platformApi.attempt(attemptId) };
  }, [id, userId, attemptId]);

  return (
    <section className="class-menu">
      <PathBreadcrumb
        items={[
          { label: t("Classes"), to: "/classes" },
          { label: t("Members"), to: `/classes/${id}` },
          { label: t("Tests"), to: `/classes/${id}/children/${userId}` },
          { label: t("Questions") },
        ]}
      />
      <Resource resource={resource}>
        {({ test, attempt }) => (
          <section className="platformPanel">
            <Typography.Title level={2}>{test.name}</Typography.Title>
            <p>
              {attempt.totalScore} / {attempt.maxScore}
            </p>
            {attempt.items.length ? (
              <>
                <div className="question-grid student-head">
                  <span>{t("Question")}</span>
                  <span>{t("Game")}</span>
                  <span>{t("Result")}</span>
                  <span>{t("Status")}</span>
                </div>
                {attempt.items.map((item, index) => {
                  const result = attempt.results.find(
                    (entry) => entry.revisionItemId === item.id,
                  );
                  return (
                    <Card className="student-block" size="small" key={item.id}>
                      <div className="question-grid">
                        <span>
                          {t("Question {index}", { index: index + 1 })}
                        </span>
                        <span className="student-metric" data-label={t("Game")}>
                          {t(gameTitle(item.definition))}
                        </span>
                        <span
                          className="student-metric"
                          data-label={t("Result")}
                        >
                          {result
                            ? `${result.score} / ${result.maxScore}`
                            : "—"}
                        </span>
                        <div
                          className="student-metric"
                          data-label={t("Status")}
                        >
                          <StatusBadge
                            value={
                              !result
                                ? "NOT_STARTED"
                                : result.outcome === "SKIPPED"
                                  ? "SKIPPED"
                                  : "COMPLETED"
                            }
                          />
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </>
            ) : (
              <EmptyPanel description={t("No questions in this test.")} />
            )}
          </section>
        )}
      </Resource>
    </section>
  );
}
