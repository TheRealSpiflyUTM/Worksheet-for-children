import { useState } from "react";
import { Button, Popconfirm, message } from "antd";
import { DeleteOutlined, ReadOutlined, TeamOutlined } from "@ant-design/icons";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { platformApi } from "../api/platform.js";
import PathBreadcrumb from "../Home/PathBreadcrumb.jsx";
import { usePlatform } from "./PlatformState.js";
import {
  EmptyPanel,
  ErrorNotice,
  PlatformPage,
  Resource,
} from "./PlatformUI.jsx";
import StatusBadge from "./StatusBadge.jsx";
import { useResource } from "./useResource.js";
import { groupAssignmentReport } from "./assignmentReport.js";
import "./TeacherAssignments.css";
import SortHeading from "./SortHeading.jsx";
import { useSorting } from "./useSorting.js";
import { dateValue, scorePercent, sortRows } from "./sorting.js";

export default function TeacherAssignments() {
  const { t, language } = usePlatform();
  const { classId, revisionId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const includeRemoved = searchParams.get("history") === "1";
  const historyQuery = includeRemoved ? "?history=1" : "";
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const sorting = useSorting("name");
  const sortValues = {
    name: (row) => row.userName,
    assigned: (row) => dateValue(row.assignedAt),
    completed: (row) => dateValue(row.completedAt),
    score: (row) => scorePercent(row.totalScore, row.maxScore),
  };
  const resource = useResource(async () => {
    const [classes, rows] = await Promise.all([
      platformApi.classes(),
      platformApi.assignmentReport(includeRemoved),
    ]);
    return groupAssignmentReport(
      includeRemoved ? [] : classes,
      includeRemoved ? rows.filter((row) => row.removedAt != null) : rows,
    );
  }, [includeRemoved]);

  async function removeHomework(worksheet) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await platformApi.deleteAssignmentGroup(classId, worksheet.id);
      resource.reload();
      if (revisionId) navigate(`/assignments/classes/${classId}`);
      message.success(t("Homework deleted."));
    } catch (requestError) {
      setError(requestError);
    } finally {
      setBusy(false);
    }
  }

  function deleteButton(worksheet) {
    if (worksheet.removed)
      return <span className="platformMuted">{t("Deleted")}</span>;
    return (
      <Popconfirm
        title={t("Delete this homework?")}
        description={t(
          "Student access will stop. Saved results remain available in history.",
        )}
        onConfirm={() => removeHomework(worksheet)}
        okText={t("Delete")}
        okButtonProps={{ "aria-label": t("Delete") }}
        cancelText={t("Cancel")}
      >
        <Button
          danger
          type="text"
          icon={<DeleteOutlined />}
          disabled={busy}
          aria-label={t("Delete homework {name}, version {version}", {
            name: worksheet.worksheetName,
            version: worksheet.revisionNumber,
          })}
        />
      </Popconfirm>
    );
  }

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
          {
            label: t("Assignments"),
            to: classId ? `/assignments${historyQuery}` : undefined,
          },
        ];
        if (classroom)
          breadcrumbs.push({
            label: name(classroom),
            to: revisionId ? `${classUrl}${historyQuery}` : undefined,
          });
        if (worksheet) breadcrumbs.push({ label: worksheet.worksheetName });

        return (
          <PlatformPage
            actions={
              <Button
                onClick={() => {
                  const next = new URLSearchParams(searchParams);
                  if (includeRemoved) next.delete("history");
                  else next.set("history", "1");
                  setSearchParams(next);
                }}
              >
                {t(
                  includeRemoved
                    ? "Hide deleted homework"
                    : "Show deleted homework",
                )}
              </Button>
            }
            title={
              worksheet?.worksheetName ||
              (classroom ? name(classroom) : t("Assignments"))
            }
          >
            <ErrorNotice error={error} />
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
                  {deleteButton(worksheet)}
                </div>
                <div className="assignmentTableScroll">
                  <table className="assignmentResultsTable">
                    <caption>{t("Latest completed score")}</caption>
                    <thead>
                      <tr>
                        <SortHeading
                          table
                          label={t("Student")}
                          column="name"
                          sorting={sorting}
                        />
                        <SortHeading
                          table
                          label={t("Assigned")}
                          column="assigned"
                          sorting={sorting}
                        />
                        <th scope="col">{t("Status")}</th>
                        <SortHeading
                          table
                          label={t("Score")}
                          column="score"
                          sorting={sorting}
                        />
                        <SortHeading
                          table
                          label={t("Completed on")}
                          column="completed"
                          sorting={sorting}
                        />
                        <th scope="col">{t("History")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortRows(
                        worksheet.recipients,
                        sortValues[sorting.key],
                        sorting.direction,
                        language,
                        (row) => row.userId,
                      ).map((student) => (
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
                      {deleteButton(entry)}
                      <Link
                        className="assignmentWorksheetLink"
                        to={`${classUrl}/worksheets/${entry.id}${historyQuery}`}
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
                    to={`/assignments/classes/${entry.id}${historyQuery}`}
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
              <EmptyPanel
                description={t(
                  includeRemoved ? "No deleted homework." : "No classes yet.",
                )}
              />
            )}
          </PlatformPage>
        );
      }}
    </Resource>
  );
}
