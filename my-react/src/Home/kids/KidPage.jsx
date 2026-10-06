import { usePlatform } from "../../platform/PlatformState.js";
import { Link, useParams } from "react-router-dom";
import { Card, Typography } from "antd";
import { platformApi } from "../../api/platform.js";
import { useResource } from "../../platform/useResource.js";
import { EmptyPanel, Resource } from "../../platform/PlatformUI.jsx";
import PathBreadcrumb from "../PathBreadcrumb.jsx";
import StatusBadge from "../../platform/StatusBadge.jsx";
import "../Menu.css";
import "../Classpage.css";
import "./KidPage.css";

export default function KidPage() {
  const { t, language } = usePlatform();
  const { id, userId } = useParams();
  const resource = useResource(async () => {
    const [classroom, students, tests] = await Promise.all([
      platformApi.classroom(id),
      platformApi.members(id),
      platformApi.studentTests(id, userId),
    ]);
    const student = students.find((entry) => entry.userId === Number(userId));
    if (!student)
      throw new Error(t("This student is no longer in this class."));
    return { classroom, student, tests };
  }, [id, userId]);

  return (
    <section className="class-menu">
      <PathBreadcrumb
        items={[
          { label: t("Classes"), to: "/classes" },
          { label: t("Members"), to: `/classes/${id}` },
          { label: t("Tests") },
        ]}
      />
      <Resource resource={resource}>
        {({ classroom, student, tests }) => (
          <section className="platformPanel">
            <Typography.Title level={2}>{student.name}</Typography.Title>
            <p>{classroom.name}</p>
            {tests.length ? (
              <>
                <div className="test-grid student-head">
                  <span>{t("Test")}</span>
                  <span>{t("Result")}</span>
                  <span>{t("Date")}</span>
                  <span>{t("Status")}</span>
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
                      <span className="student-metric" data-label={t("Result")}>
                        {test.status === "COMPLETED"
                          ? `${test.totalScore} / ${test.maxScore}`
                          : "—"}
                      </span>
                      <span className="student-metric" data-label={t("Date")}>
                        {new Date(
                          test.completedAt || test.startedAt,
                        ).toLocaleDateString(
                          language === "ro" ? "ro-RO" : "en-GB",
                        )}
                      </span>
                      <div className="student-metric" data-label={t("Status")}>
                        <StatusBadge value={test.status} />
                      </div>
                    </div>
                  </Card>
                ))}
              </>
            ) : (
              <EmptyPanel
                description={t("This student has not started a test yet.")}
              />
            )}
          </section>
        )}
      </Resource>
    </section>
  );
}
