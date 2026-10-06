import { useParams } from "react-router-dom";
import { Card, Typography } from "antd";
import { platformApi } from "../../api/platform.js";
import { gameTitle } from "../../platform/game-model.js";
import { useResource } from "../../platform/useResource.js";
import { EmptyPanel, Resource } from "../../platform/PlatformUI.jsx";
import PathBreadcrumb from "../PathBreadcrumb.jsx";
import "../Menu.css";
import "../Classpage.css";
import "../kids/KidPage.css";

export default function TestPage() {
  const { id, userId, attemptId } = useParams();
  const resource = useResource(async () => {
    const tests = await platformApi.studentTests(id, userId);
    const test = tests.find((entry) => entry.attemptId === Number(attemptId));
    if (!test) throw new Error("Testul nu aparține acestui elev.");
    return { test, attempt: await platformApi.attempt(attemptId) };
  }, [id, userId, attemptId]);

  return (
    <section className="class-menu">
      <PathBreadcrumb
        items={[
          { label: "Clase", to: "/classes" },
          { label: "Elevi", to: `/classes/${id}` },
          { label: "Teste", to: `/classes/${id}/children/${userId}` },
          { label: "Întrebări" },
        ]}
      />
      <Resource resource={resource}>
        {({ test, attempt }) => (
          <Card>
            <Typography.Title level={2}>{test.name}</Typography.Title>
            <p>
              {attempt.totalScore} / {attempt.maxScore}
            </p>
            {attempt.items.length ? (
              <>
                <div className="question-grid student-head">
                  <span>Întrebare</span>
                  <span>Joc</span>
                  <span>Rezultat</span>
                  <span>Stare</span>
                </div>
                {attempt.items.map((item, index) => {
                  const result = attempt.results.find(
                    (entry) => entry.revisionItemId === item.id,
                  );
                  return (
                    <Card className="student-block" size="small" key={item.id}>
                      <div className="question-grid">
                        <span>Întrebarea {index + 1}</span>
                        <span>{gameTitle(item.definition)}</span>
                        <span>
                          {result
                            ? `${result.score} / ${result.maxScore}`
                            : "—"}
                        </span>
                        <span>
                          {!result
                            ? "Neînceput"
                            : result.outcome === "SKIPPED"
                              ? "Sărită"
                              : "Finalizată"}
                        </span>
                      </div>
                    </Card>
                  );
                })}
              </>
            ) : (
              <EmptyPanel description="Testul nu are întrebări." />
            )}
          </Card>
        )}
      </Resource>
    </section>
  );
}
