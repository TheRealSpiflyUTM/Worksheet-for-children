import { Link, useParams } from "react-router-dom";
import { Card, Typography } from "antd";
import { platformApi } from "../../api/platform.js";
import { useResource } from "../../platform/useResource.js";
import { EmptyPanel, Resource } from "../../platform/PlatformUI.jsx";
import PathBreadcrumb from "../PathBreadcrumb.jsx";
import "../Menu.css";
import "../Classpage.css";
import "./KidPage.css";

export default function KidPage() {
  const { id, userId } = useParams();
  const resource = useResource(async () => {
    const [classroom, students, tests] = await Promise.all([
      platformApi.classroom(id),
      platformApi.members(id),
      platformApi.studentTests(id, userId),
    ]);
    const student = students.find((entry) => entry.userId === Number(userId));
    if (!student) throw new Error("Elevul nu mai este în această clasă.");
    return { classroom, student, tests };
  }, [id, userId]);

  return (
    <section className="class-menu">
      <PathBreadcrumb
        items={[
          { label: "Clase", to: "/classes" },
          { label: "Elevi", to: `/classes/${id}` },
          { label: "Teste" },
        ]}
      />
      <Resource resource={resource}>
        {({ classroom, student, tests }) => (
          <Card>
            <Typography.Title level={2}>{student.name}</Typography.Title>
            <p>{classroom.name}</p>
            {tests.length ? (
              <>
                <div className="test-grid student-head">
                  <span>Test</span>
                  <span>Rezultat</span>
                  <span>Data</span>
                  <span>Stare</span>
                </div>
                {tests.map((test) => (
                  <Card
                    className="student-block"
                    size="small"
                    key={test.attemptId}
                  >
                    <div className="test-grid">
                      <Link
                        to={`/classes/${id}/children/${userId}/tests/${test.attemptId}`}
                      >
                        {test.name}
                      </Link>
                      <span>
                        {test.status === "COMPLETED"
                          ? `${test.totalScore} / ${test.maxScore}`
                          : "—"}
                      </span>
                      <span>
                        {new Date(
                          test.completedAt || test.startedAt,
                        ).toLocaleDateString("ro-RO")}
                      </span>
                      <span>
                        {test.status === "COMPLETED"
                          ? "Finalizat"
                          : test.status === "IN_PROGRESS"
                            ? "În desfășurare"
                            : "Oprit"}
                      </span>
                    </div>
                  </Card>
                ))}
              </>
            ) : (
              <EmptyPanel description="Elevul nu a început încă niciun test." />
            )}
          </Card>
        )}
      </Resource>
    </section>
  );
}
