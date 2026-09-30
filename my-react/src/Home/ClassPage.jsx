import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Button,
  Card,
  ConfigProvider,
  Flex,
  Input,
  List,
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
import "./Menu.css";
import "./ClassPage.css";

const { Title } = Typography;

const ADD_BUTTON_LABEL = "Adauga Elev";
const EMPTY_TEXT = "Nu-i nimic aici";
const NO_DATA = "-";

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

  const sortedStudents = students.slice().sort(function (a, b) {
    return a.name.localeCompare(b.name, "ro", {
      sensitivity: "base",
    });
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
      <List.Item key={s.id} className="student-list-item">
        <Card className="student-block" size="small">
          <div className="student-grid">
            <Button
              type="text"
              className="table-button student-name-button"
              onClick={function () {
                navigate(
                  "/home/" + className + "/" + encodeURIComponent(s.name)
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
      </List.Item>
    );
  }

  return (
    <section className="class-menu">
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

            <Button type="primary" onClick={openAddModal}>
              {ADD_BUTTON_LABEL}
            </Button>
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

          <List
            split={false}
            dataSource={sortedStudents}
            locale={{ emptyText: EMPTY_TEXT }}
            renderItem={renderStudent}
          />
        </Card>

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
      </ConfigProvider>
    </section>
  );
}

export default ClassPage;