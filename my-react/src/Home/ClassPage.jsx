import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Button,
  Card,
  ConfigProvider,
  Flex,
  Input,
  Modal,
  Popconfirm,
  Popover,
  Typography,
  message,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import PathBreadcrumb from "./PathBreadcrumb.jsx";
import "./Menu.css";
import "./ClassPage.css";

const { Title } = Typography;

const ADD_BUTTON_LABEL = "Adauga Elev";
const START_TEST_LABEL = "Start a test";
const EMPTY_TEXT = "Nu-i nimic aici";
const NO_TESTS_TEXT = "Aici nu-s inca teste";
const NO_DATA = "-";

// Temporary data: replace with your real worksheets (e.g. fetched from the backend).
// Set it to [] to see the "Aici nu-s inca teste" message.
const AVAILABLE_WORKSHEETS = [
  { id: 1, name: "Easy Math" },
  { id: 2, name: "Number Sequence" },
  { id: 3, name: "Odd or Even" },
];

function getLastTest(tests) {
  if (!tests || tests.length === 0) {
    return NO_DATA;
  }

  return tests[tests.length - 1].percent + "%";
}

function getAverage(tests) {
  if (!tests || tests.length === 0) {
    return NO_DATA;
  }

  const total = tests.reduce(function (sum, t) {
    return sum + t.percent;
  }, 0);

  return Math.round(total / tests.length) + "%";
}

function getLowestTestName(tests) {
  if (!tests || tests.length === 0) {
    return NO_DATA;
  }

  const lowest = tests.reduce(function (min, t) {
    return t.percent < min.percent ? t : min;
  });

  return lowest.name;
}

function ClassPage() {
  const params = useParams();
  const navigate = useNavigate();
  const className = params.className;

  const [students, setStudents] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [editingId, setEditingId] = useState(null);
  const [nameInput, setNameInput] = useState("");

  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [testSearch, setTestSearch] = useState("");

  const sortedStudents = students.slice().sort(function (a, b) {
    return a.name.localeCompare(b.name, "ro", {
      sensitivity: "base",
    });
  });

  const filteredWorksheets = AVAILABLE_WORKSHEETS.filter(function (w) {
    return w.name.toLowerCase().includes(testSearch.trim().toLowerCase());
  });

  function openAddModal() {
    setModalMode("add");
    setEditingId(null);
    setNameInput("");
    setIsModalOpen(true);
  }

  function openRenameModal(s) {
    setModalMode("rename");
    setEditingId(s.id);
    setNameInput(s.name);
    setIsModalOpen(true);
  }

  function handleModalCancel() {
    setIsModalOpen(false);
    setNameInput("");
  }

  function handleModalOk() {
    const trimmedName = nameInput.trim();

    if (!trimmedName) {
      message.error("Nu poate sa fie gol");
      return;
    }

    if (modalMode === "add") {
      setStudents(function (current) {
        const nextId = current.length
          ? Math.max.apply(
              null,
              current.map(function (s) {
                return s.id;
              })
            ) + 1
          : 1;

        return current.concat([
          {
            id: nextId,
            name: trimmedName,
            tests: [],
          },
        ]);
      });
    } else {
      setStudents(function (current) {
        return current.map(function (s) {
          if (s.id === editingId) {
            return {
              ...s,
              name: trimmedName,
            };
          }

          return s;
        });
      });
    }

    setIsModalOpen(false);
    setNameInput("");
  }

  function handleDeleteStudent(id) {
    setStudents(function (current) {
      return current.filter(function (s) {
        return s.id !== id;
      });
    });
  }

  function handleNameInputChange(e) {
    setNameInput(e.target.value);
  }

  function openTestModal() {
    setTestSearch("");
    setIsTestModalOpen(true);
  }

  function closeTestModal() {
    setIsTestModalOpen(false);
    setTestSearch("");
  }

  function handleTestSearchChange(e) {
    setTestSearch(e.target.value);
  }

  function handleStartTest(worksheet) {
    // TODO: start the test for this class (call your backend / navigate).
    message.success("Test selectat: " + worksheet.name);
    closeTestModal();
  }

  function renderStudent(s) {
    const menuContent = (
      <Flex gap="small">
        <Button
          size="small"
          type="primary"
          icon={<EditOutlined />}
          onClick={function () {
            openRenameModal(s);
          }}
        >
          Rename
        </Button>

        <Popconfirm
          title="Delete this student?"
          onConfirm={function () {
            handleDeleteStudent(s.id);
          }}
          okText="Delete"
          cancelText="Cancel"
        >
          <Button size="small" danger icon={<DeleteOutlined />}>
            Delete
          </Button>
        </Popconfirm>
      </Flex>
    );

    return (
      <div key={s.id} className="student-list-item">
        <Card className="student-block" size="small">
          <div className="student-grid">
            <Button
              type="text"
              className="table-button student-name-button"
              onClick={function () {
                navigate(
                  "/home/" +
                    encodeURIComponent(className) +
                    "/" +
                    encodeURIComponent(s.name)
                );
              }}
            >
              {s.name}
            </Button>

            <Button type="text" className="table-button">
              {getLastTest(s.tests)}
            </Button>

            <Button type="text" className="table-button">
              {getAverage(s.tests)}
            </Button>

            <Button type="text" className="table-button">
              {getLowestTestName(s.tests)}
            </Button>

            <Popover
              content={menuContent}
              trigger="click"
              placement="bottomRight"
            >
              <Button
                type="text"
                icon={<MoreOutlined />}
                className="student-more-button"
              />
            </Popover>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <section className="class-menu">
      <PathBreadcrumb
        items={[{ label: "Clasa", to: "/home" }, { label: "Elevi" }]}
      />

      <ConfigProvider
        theme={{
          components: {
            Button: {
              colorText: "var(--cm-text)",
              colorTextHover: "var(--cm-hover)",
              borderRadius: 8,
            },
          },
        }}
      >
        <Card>
          <Flex
            justify="space-between"
            align="center"
            gap="middle"
            wrap
          >
            <Title level={2} style={{ margin: 0 }}>
              {className}
            </Title>

            <Flex gap="small" wrap>
              <Button onClick={openTestModal}>{START_TEST_LABEL}</Button>

              <Button type="primary" onClick={openAddModal}>
                {ADD_BUTTON_LABEL}
              </Button>
            </Flex>
          </Flex>

          {sortedStudents.length > 0 && (
            <div className="student-grid student-head">
              <Button type="text" className="table-button">
                Name
              </Button>

              <Button type="text" className="table-button">
                Last test
              </Button>

              <Button type="text" className="table-button">
                Avg
              </Button>

              <Button type="text" className="table-button">
                Worst test
              </Button>

              <span />
            </div>
          )}

          {sortedStudents.length === 0 ? (
            <p className="class-menu__empty">{EMPTY_TEXT}</p>
          ) : (
            sortedStudents.map(renderStudent)
          )}
        </Card>

        {/* ADD / RENAME STUDENT */}
        <Modal
          title={modalMode === "add" ? "Elev nou" : "Renumeste"}
          open={isModalOpen}
          onOk={handleModalOk}
          onCancel={handleModalCancel}
          okText={modalMode === "add" ? "Create" : "Save"}
        >
          <Input
            placeholder="Student name"
            value={nameInput}
            onChange={handleNameInputChange}
            onPressEnter={handleModalOk}
            autoFocus
          />
        </Modal>

        {/* START A TEST */}
        <Modal
          title={START_TEST_LABEL}
          open={isTestModalOpen}
          onCancel={closeTestModal}
          footer={null}
        >
          <Input.Search
            placeholder="Cauta un test"
            value={testSearch}
            onChange={handleTestSearchChange}
            allowClear
            autoFocus
          />

          <div style={{ marginTop: 16 }}>
            {filteredWorksheets.length === 0 ? (
              <p className="class-menu__empty">{NO_TESTS_TEXT}</p>
            ) : (
              <Flex vertical gap="small">
                {filteredWorksheets.map(function (w) {
                  return (
                    <Button
                      key={w.id}
                      block
                      onClick={function () {
                        handleStartTest(w);
                      }}
                    >
                      {w.name}
                    </Button>
                  );
                })}
              </Flex>
            )}
          </div>
        </Modal>
      </ConfigProvider>
    </section>
  );
}

export default ClassPage;