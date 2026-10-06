import { Button, message } from "antd";
import { ReadOutlined, TeamOutlined } from "@ant-design/icons";
import { Link, useParams } from "react-router-dom";
import { platformApi } from "../api/platform.js";
import PathBreadcrumb from "../Home/PathBreadcrumb.jsx";
import { usePlatform } from "./PlatformState.js";
import { EmptyPanel, PlatformPage, Resource } from "./PlatformUI.jsx";
import StatusBadge from "./StatusBadge.jsx";
import { useResource } from "./useResource.js";
import { groupAssignmentReport } from "./assignmentReport.js";
import "./TeacherAssignments.css";

export default function TeacherAssignments() {
  const { t, language } = usePlatform();
  const { classId, revisionId } = useParams();
  const resource = useResource(async () => {
    const [classes, rows] = await Promise.all([
      platformApi.classes(),
      platformApi.assignmentReport(),
    ]);
    return groupAssignmentReport(classes, rows);
  });

  async function copy(code) {
    try {
      await navigator.clipboard.writeText(code);
      message.success(t("Code copied!"));
    } catch {
      message.error(t("Could not copy the code. You can select it manually."));
    }
  }

  function date(value) {
    return value
      ? new Date(value).toLocaleDateString(
          language === "ro" ? "ro-RO" : "en-GB",
        )
      : "—";
  }

  const name = (classroom) =>
    classroom.id === "direct" ? t("Direct assignments") : classroom.name;
  const codeLabel = (worksheet) =>
    t(
      worksheet.codeStatus === "VERSION_CHANGED"
        ? "Code replaced"
        : "No active code",
    );

  return (
    <Resource resource={resource}>
      {(classes) => {
        const classroom = classes.find((entry) => entry.id === classId);
        const worksheet = classroom?.worksheets.find(
          (entry) => entry.id === revisionId,
        );
        const classUrl = `/assignments/classes/${classId}`;
        const breadcrumbs = [
          { label: t("Assignments"), to: classId ? "/assignments" : undefined },
        ];
        if (classroom)
          breadcrumbs.push({
            label: name(classroom),
            to: revisionId ? classUrl : undefined,
          });
        if (worksheet) breadcrumbs.push({ label: worksheet.worksheetName });

        return (
          <PlatformPage
            title={
              worksheet?.worksheetName ||
              (classroom ? name(classroom) : t("Assignments"))
            }
          >
            {classId && <PathBreadcrumb items={breadcrumbs} />}
            {classId && !classroom ? (
              <EmptyPanel description={t("Class not found.")} />
            ) : revisionId && !worksheet ? (
              <EmptyPanel description={t("Assignment not found.")} />
            ) : worksheet ? (
              <section className="platformPanel assignmentResults">
                <div className="assignmentResultsHeader">
                  <div className="assignmentCodeBlock">
                    <span>{t("Worksheet code")}</span>
                    {worksheet.worksheetCode ? (
                      <div className="assignmentCodeActions">
                        <code>{worksheet.worksheetCode}</code>
                        <Button
                          size="small"
                          onClick={() => copy(worksheet.worksheetCode)}
                        >
                          {t("Copy code")}
                        </Button>
                      </div>
                    ) : (
                      <strong>{codeLabel(worksheet)}</strong>
                    )}
                  </div>
                  <strong>
                    {t("{completed} / {total} completed", {
                      completed: worksheet.completedCount,
                      total: worksheet.recipients.length,
                    })}
                  </strong>
                </div>
                <div className="assignmentTableScroll">
                  <table className="assignmentResultsTable">
                    <caption>{t("Latest completed score")}</caption>
                    <thead>
                      <tr>
                        <th scope="col">{t("Student")}</th>
                        <th scope="col">{t("Assigned")}</th>
                        <th scope="col">{t("Status")}</th>
                        <th scope="col">{t("Score")}</th>
                        <th scope="col">{t("Completed on")}</th>
                        <th scope="col">{t("History")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...worksheet.recipients]
                        .sort((a, b) =>
                          a.userName.localeCompare(b.userName, language),
                        )
                        .map((student) => (
                          <tr key={student.userId}>
                            <th scope="row">{student.userName}</th>
                            <td data-label={t("Assigned")}>
                              {date(student.assignedAt)}
                            </td>
                            <td data-label={t("Status")}>
                              <StatusBadge value={student.status} />
                            </td>
                            <td
                              className="assignmentScore"
                              data-label={t("Score")}
                            >
                              {student.totalScore == null ? (
                                "—"
                              ) : student.attemptId ? (
                                <Link
                                  aria-label={t("View {name}'s result", {
                                    name: student.userName,
                                  })}
                                  to={`/attempts/${student.attemptId}`}
                                >
                                  {student.totalScore} / {student.maxScore}
                                </Link>
                              ) : (
                                `${student.totalScore} / ${student.maxScore}`
                              )}
                            </td>
                            <td data-label={t("Completed on")}>
                              {date(student.completedAt)}
                            </td>
                            <td className="assignmentHistory">
                              <Link
                                to={`/assignments/${student.assignmentId}`}
                                aria-label={t("View {name}'s history", {
                                  name: student.userName,
                                })}
                              >
                                {t("History")}
                              </Link>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ) : classroom ? (
              classroom.worksheets.length ? (
                <section className="platformPanel assignmentWorksheets">
                  {classroom.worksheets.map((entry) => (
                    <div className="assignmentWorksheetRow" key={entry.id}>
                      <Link
                        className="assignmentWorksheetLink"
                        to={`${classUrl}/worksheets/${entry.id}`}
                      >
                        <ReadOutlined aria-hidden="true" />
                        <div>
                          <h2>{entry.worksheetName}</h2>
                          <span className="platformMuted">
                            {t("Version {number}", {
                              number: entry.revisionNumber,
                            })}
                          </span>
                        </div>
                        <span className="assignmentCompletion">
                          {t("{completed} / {total} completed", {
                            completed: entry.completedCount,
                            total: entry.recipients.length,
                          })}
                        </span>
                      </Link>
                      <div className="assignmentWorksheetCode">
                        <span>{t("Worksheet code")}</span>
                        {entry.worksheetCode ? (
                          <div className="assignmentCodeActions">
                            <code>{entry.worksheetCode}</code>
                            <Button
                              size="small"
                              aria-label={t("Copy {name}'s worksheet code", {
                                name: entry.worksheetName,
                              })}
                              onClick={() => copy(entry.worksheetCode)}
                            >
                              {t("Copy")}
                            </Button>
                          </div>
                        ) : (
                          <strong>{codeLabel(entry)}</strong>
                        )}
                      </div>
                    </div>
                  ))}
                </section>
              ) : (
                <EmptyPanel description={t("No assignments yet.")} />
              )
            ) : classes.length ? (
              <div className="platformGrid assignmentClasses">
                {classes.map((entry) => (
                  <Link
                    className="platformCard assignmentClassCard"
                    to={`/assignments/classes/${entry.id}`}
                    key={entry.id}
                  >
                    <span className="assignmentClassIcon">
                      <TeamOutlined aria-hidden="true" />
                    </span>
                    <h2>{name(entry)}</h2>
                    <span className="platformMuted">
                      {t(
                        entry.worksheets.length === 1
                          ? "{count} worksheet"
                          : "{count} worksheets",
                        { count: entry.worksheets.length },
                      )}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyPanel description={t("No classes yet.")} />
            )}
          </PlatformPage>
        );
      }}
    </Resource>
  );
}
