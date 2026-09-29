import { useResource } from "./useResource.js";
import { useRef, useState } from "react";
import { Button, Form, Input, Modal, Popconfirm, Select } from "antd";
import {
  ArrowUpRight,
  BookOpen,
  Copy,
  Plus,
  Search,
  Users,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api/platform.js";
import { useApp } from "./state.js";
import {
  EmptyState,
  ErrorNotice,
  NewButton,
  PageTitle,
  Resource,
  SectionTitle,
  Status,
  LanguageSwitch,
} from "./ui.jsx";
import { JoinForm } from "./Auth.jsx";
export function NameModal({ title, label, initial = "", onSave, onClose }) {
  const { t } = useApp();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  return (
    <Modal
      open
      title={t(title)}
      onCancel={onClose}
      footer={null}
      destroyOnHidden
    >
      <ErrorNotice error={error} />
      <Form
        layout="vertical"
        initialValues={{ name: initial }}
        onFinish={async ({ name }) => {
          setBusy(true);
          try {
            await onSave(name.trim());
            onClose();
          } catch (e) {
            setError(e);
          } finally {
            setBusy(false);
          }
        }}
      >
        <Form.Item
          label={t(label)}
          name="name"
          rules={[{ required: true, whitespace: true }]}
        >
          <Input autoFocus maxLength={150} />
        </Form.Item>
        <div className="actions end">
          <Button onClick={onClose}>{t("Cancel")}</Button>
          <Button htmlType="submit" type="primary" loading={busy}>
            {t("Save")}
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
export function ShareModal({ worksheetId, onClose }) {
  const { t } = useApp();
  // Sharing publishes a revision. StrictMode may replay the loading effect,
  // so both subscribers must observe the same publication request.
  const publication = useRef(null);
  const resource = useResource(() => {
    publication.current ??= api.share(worksheetId).catch((error) => {
      publication.current = null;
      throw error;
    });
    return publication.current;
  }, [worksheetId]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const code = resource.data?.shareCode || resource.data?.code;
  return (
    <Modal open title={t("Share worksheet")} onCancel={onClose} footer={null}>
      <Resource resource={resource}>
        {() => (
          <>
            <p>
              {t(
                "This code opens a saved snapshot. Later edits do not change it.",
              )}
            </p>
            <div className="share-code">{code}</div>
            <Button
              icon={<Copy size={16} />}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(code);
                  setCopied(true);
                } catch (e) {
                  setError(e);
                }
              }}
            >
              {t(copied ? "Copied" : "Copy code")}
            </Button>
            <hr />
            <p className="muted">
              {t(
                "The previous code will stop working. Existing assignments keep their content.",
              )}
            </p>
            <Popconfirm
              title={t("Publish latest & replace code")}
              onConfirm={async () => {
                setBusy(true);
                try {
                  resource.setData(await api.share(worksheetId, true));
                  setCopied(false);
                } catch (e) {
                  setError(e);
                } finally {
                  setBusy(false);
                }
              }}
              okText={t("Save")}
              cancelText={t("Cancel")}
            >
              <Button loading={busy}>
                {t("Publish latest & replace code")}
              </Button>
            </Popconfirm>
          </>
        )}
      </Resource>
      <ErrorNotice error={error} />
    </Modal>
  );
}
export function AssignModal({ worksheetId, onClose, initialClass }) {
  const { t } = useApp();
  const classes = useResource(api.classes);
  const [classId, setClassId] = useState(initialClass);
  const [studentId, setStudentId] = useState("all");
  const members = useResource(
    () => (classId ? api.members(classId) : Promise.resolve([])),
    [classId],
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  return (
    <Modal open title={t("Assign worksheet")} onCancel={onClose} footer={null}>
      <ErrorNotice error={error} />
      <Resource resource={classes}>
        {(items) =>
          items.length ? (
            <div className="stack">
              <label>
                {t("Choose a class")}
                <Select
                  value={classId}
                  onChange={(id) => {
                    setClassId(id);
                    setStudentId("all");
                  }}
                  options={items.map((c) => ({ value: c.id, label: c.name }))}
                />
              </label>
              <label>
                {t("Choose a student")}
                <Select
                  disabled={!classId}
                  loading={members.loading}
                  value={studentId}
                  onChange={setStudentId}
                  options={[
                    { value: "all", label: t("Whole class") },
                    ...(members.data || []).map((m) => ({
                      value: m.userId,
                      label: m.name,
                    })),
                  ]}
                />
              </label>
              <ErrorNotice error={members.error} retry={members.reload} />
              <Button
                type="primary"
                loading={busy}
                disabled={!classId || members.loading || !!members.error}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await api.assign(
                      worksheetId,
                      studentId !== "all"
                        ? { userId: studentId }
                        : { classroomId: classId },
                    );
                    onClose();
                  } catch (e) {
                    setError(e);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {t("Assign")}
              </Button>
            </div>
          ) : (
            <EmptyState
              title="No classes yet"
              description="Create a class to bring your learners together."
            >
              <Link to="/classes" onClick={onClose}>
                {t("New class")}
              </Link>
            </EmptyState>
          )
        }
      </Resource>
    </Modal>
  );
}
export function WorksheetCard({
  worksheet,
  onRename,
  onDelete,
  onShare,
  onAssign,
}) {
  const { t, date, user } = useApp();
  return (
    <article className="worksheet-card">
      <Link className="card-main" to={`/teacher/${worksheet.id}`}>
        <span className="icon-tile">
          <BookOpen size={23} />
        </span>
        <ArrowUpRight className="card-arrow" size={19} />
        <h3>{worksheet.name}</h3>
        <p>
          {worksheet.items?.length || 0} {t("activities")}
          <span>·</span>
          {date(worksheet.updatedAt)}
        </p>
      </Link>
      {onRename && (
        <div className="card-actions">
          <Button type="text" size="small" onClick={onRename}>
            {t("Rename")}
          </Button>
          {user.role === "TEACHER" && (
            <>
              <Button type="text" size="small" onClick={onShare}>
                {t("Share")}
              </Button>
              <Button type="text" size="small" onClick={onAssign}>
                {t("Assign")}
              </Button>
            </>
          )}
          <Popconfirm
            title={t("Delete worksheet?")}
            description={t("This action cannot be undone.")}
            onConfirm={onDelete}
            okText={t("Delete")}
            cancelText={t("Cancel")}
          >
            <Button type="text" size="small" danger>
              {t("Delete")}
            </Button>
          </Popconfirm>
        </div>
      )}
    </article>
  );
}
export function WorksheetLibrary() {
  const { t } = useApp();
  const navigate = useNavigate();
  const resource = useResource(api.worksheets);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [error, setError] = useState(null);
  return (
    <>
      <PageTitle
        eyebrow="Workspace"
        title="Worksheets"
        subtitle="Everything you need for the next small discovery."
      >
        <NewButton onClick={() => setModal({ type: "new" })}>
          {t("New worksheet")}
        </NewButton>
      </PageTitle>
      <Input
        className="search-input"
        prefix={<Search size={17} />}
        aria-label={t("Search worksheets")}
        placeholder={t("Search worksheets")}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <ErrorNotice error={error} />
      <Resource resource={resource}>
        {(items) => {
          const filtered = items.filter((w) =>
            w.name.toLowerCase().includes(search.toLowerCase()),
          );
          return filtered.length ? (
            <div className="card-grid">
              {filtered.map((w) => (
                <WorksheetCard
                  key={w.id}
                  worksheet={w}
                  onRename={() => setModal({ type: "rename", worksheet: w })}
                  onShare={() => setModal({ type: "share", worksheet: w })}
                  onAssign={() => setModal({ type: "assign", worksheet: w })}
                  onDelete={async () => {
                    try {
                      await api.deleteWorksheet(w.id);
                      resource.reload();
                    } catch (e) {
                      setError(e);
                    }
                  }}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title={items.length ? "No matches" : "No worksheets yet"}
              description={
                items.length
                  ? "Try another search."
                  : "Create your first worksheet and add a few activities."
              }
            />
          );
        }}
      </Resource>
      {["new", "rename"].includes(modal?.type) && (
        <NameModal
          title={modal.type === "new" ? "New worksheet" : "Rename"}
          label="Worksheet name"
          initial={modal.worksheet?.name}
          onClose={() => setModal(null)}
          onSave={async (name) => {
            if (modal.type === "new") {
              const w = await api.createWorksheet(name);
              navigate(`/teacher/${w.id}`);
            } else {
              await api.renameWorksheet(modal.worksheet.id, name);
              resource.reload();
            }
          }}
        />
      )}{" "}
      {modal?.type === "share" && (
        <ShareModal
          worksheetId={modal.worksheet.id}
          onClose={() => setModal(null)}
        />
      )}{" "}
      {modal?.type === "assign" && (
        <AssignModal
          worksheetId={modal.worksheet.id}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}
export function AssignmentList({ items }) {
  const { t, user, date } = useApp();
  return items.length ? (
    <div className="list-panel">
      {items.map((a) => (
        <Link className="list-row" key={a.id} to={`/assignments/${a.id}`}>
          <span className="icon-tile small">
            <BookOpen size={19} />
          </span>
          <div className="grow">
            <h3>{a.worksheet.name}</h3>
            <p>
              {t(user.role === "TEACHER" ? "For" : "Assigned by")}{" "}
              {user.role === "TEACHER" ? a.userName : a.teacherName} ·{" "}
              {date(a.assignedAt)}
            </p>
          </div>
          <Status value={a.revokedAt ? "REVOKED" : a.status} />
          <ArrowUpRight size={18} />
        </Link>
      ))}
    </div>
  ) : (
    <EmptyState
      title="No assignments yet"
      description="Assignments will appear here when a worksheet is shared with you."
    />
  );
}
export function Dashboard() {
  const { t, user } = useApp();
  const teacher = user.role === "TEACHER";
  const resource = useResource(async () => {
    const [worksheets, classes, assignments] = await Promise.all([
      api.worksheets(),
      api.classes(),
      api.assignments(),
    ]);
    return { worksheets, classes, assignments };
  });
  return (
    <>
      <PageTitle
        eyebrow="Your learning space"
        title={`${t("Good to see you,")} ${user.name.split(" ")[0]}`}
        subtitle={
          teacher
            ? "A little preparation. A lot of possibility."
            : "Ready for your next discovery?"
        }
      >
        <Link
          className="primary-link"
          to={teacher ? "/sheets" : "/assignments"}
        >
          {t(teacher ? "Worksheets" : "Your assignments")}
          <ArrowUpRight size={17} />
        </Link>
      </PageTitle>
      <Resource resource={resource}>
        {(data) => (
          <>
            <div className="welcome-banner">
              <div>
                <p className="eyebrow">{t("Made for curious minds")}</p>
                <h2>{t("Make progress, one discovery at a time.")}</h2>
                <p>
                  {t(
                    teacher
                      ? "Build activities that fit your learners."
                      : "Thoughtful activities. Small steps. Big discoveries.",
                  )}
                </p>
              </div>
              <div className="banner-shapes" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
            </div>
            <div className="stat-grid">
              {[
                ["Worksheets", data.worksheets.length, "/sheets"],
                ["Classes", data.classes.length, "/classes"],
                ["Assignments", data.assignments.length, "/assignments"],
              ].map(([name, count, href]) => (
                <Link className="stat-card" to={href} key={name}>
                  <span>{t(name)}</span>
                  <strong>{count}</strong>
                  <ArrowUpRight size={17} />
                </Link>
              ))}
            </div>
            <SectionTitle
              title={teacher ? "Recent worksheets" : "Your assignments"}
              to={teacher ? "/sheets" : "/assignments"}
            />
            {teacher ? (
              data.worksheets.length ? (
                <div className="card-grid">
                  {[...data.worksheets]
                    .sort(
                      (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt),
                    )
                    .slice(0, 3)
                    .map((w) => (
                      <WorksheetCard key={w.id} worksheet={w} />
                    ))}
                </div>
              ) : (
                <EmptyState
                  title="No worksheets yet"
                  description="Create your first worksheet and add a few activities."
                >
                  <Link to="/sheets">{t("New worksheet")}</Link>
                </EmptyState>
              )
            ) : (
              <AssignmentList items={data.assignments.slice(0, 5)} />
            )}
          </>
        )}
      </Resource>
    </>
  );
}
export function Classes() {
  const { t, user } = useApp();
  const teacher = user.role === "TEACHER";
  const resource = useResource(api.classes);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  return (
    <>
      <PageTitle
        eyebrow="Workspace"
        title="Classes"
        subtitle={
          teacher
            ? "Bring your class together with a simple code."
            : "Join a class using the code from your teacher."
        }
      >
        <NewButton onClick={() => setOpen(true)}>
          {t(teacher ? "New class" : "Join class")}
        </NewButton>
      </PageTitle>
      <Resource resource={resource}>
        {(classes) =>
          classes.length ? (
            <div className="card-grid">
              {classes.map((c) => (
                <Link
                  className="worksheet-card card-main"
                  to={`/classes/${c.id}`}
                  key={c.id}
                >
                  <span className="icon-tile tone-1">
                    <Users />
                  </span>
                  <h3>{c.name}</h3>
                  <p>{c.teacherName}</p>
                  <ArrowUpRight className="card-arrow" size={19} />
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No classes yet"
              description={
                teacher
                  ? "Create a class to bring your learners together."
                  : "Join a class using the code from your teacher."
              }
            />
          )
        }
      </Resource>
      {open &&
        (teacher ? (
          <NameModal
            title="New class"
            label="Class name"
            onClose={() => setOpen(false)}
            onSave={async (name) => {
              const c = await api.createClass(name);
              navigate(`/classes/${c.id}`);
            }}
          />
        ) : (
          <Modal
            open
            title={t("Join class")}
            footer={null}
            onCancel={() => setOpen(false)}
          >
            <JoinForm classroom onJoined={resource.reload} />
          </Modal>
        ))}
    </>
  );
}
export function ClassDetail() {
  const { id } = useParams();
  const { t, user } = useApp();
  const teacher = user.role === "TEACHER";
  const resource = useResource(async () => {
    const [classroom, members, assignments] = await Promise.all([
      api.classroom(id),
      teacher ? api.members(id) : Promise.resolve([]),
      api.assignments(),
    ]);
    return {
      classroom,
      members,
      assignments: assignments.filter((a) => a.classroomId === Number(id)),
    };
  }, [id, teacher]);
  const [error, setError] = useState(null);
  async function act(action) {
    try {
      await action();
      resource.reload();
    } catch (e) {
      setError(e);
    }
  }
  return (
    <Resource resource={resource}>
      {({ classroom, members, assignments }) => (
        <>
          <PageTitle
            eyebrow="Classes"
            title={classroom.name}
            literalTitle
            subtitle={classroom.teacherName}
          />
          <ErrorNotice error={error} />
          {teacher && (
            <>
              <div className="panel code-banner">
                <div>
                  <p className="eyebrow">{t("Class code")}</p>
                  <strong className="code-text">{classroom.joinCode}</strong>
                  <p className="muted">
                    {t("Share the class code to invite students.")}
                  </p>
                </div>
                <Popconfirm
                  title={t("Replace class code?")}
                  onConfirm={() => act(() => api.rotateClass(id))}
                  okText={t("Save")}
                  cancelText={t("Cancel")}
                >
                  <Button>{t("Rotate code")}</Button>
                </Popconfirm>
              </div>
              <SectionTitle title="Members" />
              {members.length ? (
                <div className="list-panel">
                  {members.map((m) => (
                    <div className="list-row" key={m.userId}>
                      <span className="avatar-circle">
                        {m.name.slice(0, 1)}
                      </span>
                      <div className="grow">
                        <h3>{m.name}</h3>
                        <p>{m.email}</p>
                      </div>
                      <Popconfirm
                        title={t("Remove student?")}
                        description={t(
                          "Their class assignments will be revoked. Completed history is kept.",
                        )}
                        onConfirm={() =>
                          act(() => api.removeMember(id, m.userId))
                        }
                        okText={t("Remove")}
                        cancelText={t("Cancel")}
                      >
                        <Button danger type="text">
                          {t("Remove")}
                        </Button>
                      </Popconfirm>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No members yet"
                  description="Share the class code to invite students."
                />
              )}
            </>
          )}
          <SectionTitle title="Assignments" />
          {teacher && (
            <p>
              <Link to="/sheets">
                {t("Assign worksheet")} <Plus size={15} />
              </Link>
            </p>
          )}
          <AssignmentList items={assignments} />
        </>
      )}
    </Resource>
  );
}
export function Assignments() {
  const { t, user } = useApp();
  const resource = useResource(api.assignments);
  const [open, setOpen] = useState(() =>
    new URLSearchParams(location.search).has("join"),
  );
  return (
    <>
      <PageTitle
        eyebrow="Workspace"
        title="Assignments"
        subtitle="Make progress, one discovery at a time."
      >
        {user.role === "USER" && (
          <NewButton onClick={() => setOpen(true)}>
            {t("Join worksheet")}
          </NewButton>
        )}
      </PageTitle>
      <Resource resource={resource}>
        {(items) => <AssignmentList items={items} />}
      </Resource>
      {open && (
        <Modal
          open
          title={t("Join with a code")}
          onCancel={() => setOpen(false)}
          footer={null}
        >
          <JoinForm onJoined={() => setOpen(false)} />
        </Modal>
      )}
    </>
  );
}
export function Account() {
  const { t, user, setUser } = useApp();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  return (
    <>
      <PageTitle
        eyebrow="Profile"
        title="Account"
        subtitle="Your account and preferences."
      />
      <ErrorNotice error={error} />
      <div className="panel profile-panel">
        <span className="avatar-circle large">{user.name[0]}</span>
        <h2>{user.name}</h2>
        <dl>
          <dt>{t("Email")}</dt>
          <dd>{user.email}</dd>
          <dt>{t("I am a")}</dt>
          <dd>
            {t(
              user.role === "USER"
                ? "Student"
                : user.role === "TEACHER"
                  ? "Teacher"
                  : user.role,
            )}
          </dd>
        </dl>
        <hr />
        <label className="field-label">
          {t("Language")}
          <LanguageSwitch />
        </label>
        <Button
          loading={busy}
          onClick={async () => {
            setBusy(true);
            setError(null);
            try {
              await api.logout();
              setUser(null);
            } catch (error) {
              setError(error);
            } finally {
              setBusy(false);
            }
          }}
        >
          {t("Sign out")}
        </Button>
      </div>
    </>
  );
}
